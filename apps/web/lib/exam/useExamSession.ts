'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWsUrl } from '../api';
import { ExamSessionState, ProctorViolation } from '../questions/types';

const DEFAULT_QUESTIONS = [
  { slug: 'concatenation-of-array', title: 'Concatenation of Array', difficulty: 'Easy' as const, status: 'drafting' as const },
  { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy' as const, status: 'unvisited' as const },
  { slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Easy' as const, status: 'unvisited' as const },
  { slug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy' as const, status: 'unvisited' as const },
];

export interface CandidateTelemetry {
  audioLevel: number;
  isFullscreen: boolean;
  isCameraActive: boolean;
  isMicActive: boolean;
  faceDetected: boolean;
  trustScore: number;
  lastPing: number;
}

export function useExamSession(
  sessionId: string,
  initialCandidateName = 'Candidate',
  role: 'candidate' | 'examiner' = 'candidate'
) {
  const [session, setSession] = useState<ExamSessionState>(() => {
    // Check localStorage cache for existing synchronized session
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`exam_session_${sessionId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }

    const now = Date.now();
    const durationMin = 45;
    return {
      sessionId,
      title: 'Practice Assessment - Data Structures & Algorithms',
      durationMinutes: durationMin,
      startTime: now,
      endTime: now + durationMin * 60 * 1000,
      status: 'active',
      questions: DEFAULT_QUESTIONS,
      currentQuestionIndex: 0,
      candidateName: initialCandidateName,
      trustScore: 100,
      violations: [],
      codeDrafts: {},
    };
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return Math.max(0, Math.floor((session.endTime - Date.now()) / 1000));
  });

  const [isConnected, setIsConnected] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [announcement, setAnnouncement] = useState<{ text: string; severity: string } | null>(null);
  const [candidateTelemetry, setCandidateTelemetry] = useState<CandidateTelemetry>({
    audioLevel: 0,
    isFullscreen: false,
    isCameraActive: false,
    isMicActive: false,
    faceDetected: true,
    trustScore: 100,
    lastPing: Date.now(),
  });

  const socketRef = useRef<Socket | null>(null);

  // Synchronized countdown timer based on authoritative endTime
  useEffect(() => {
    const updateTimer = () => {
      const rem = Math.max(0, Math.floor((session.endTime - Date.now()) / 1000));
      setRemainingSeconds(rem);
      if (rem === 0 && session.status === 'active') {
        setSession((prev) => ({ ...prev, status: 'completed' }));
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [session.endTime, session.status]);

  // Persist session locally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`exam_session_${sessionId}`, JSON.stringify(session));
    }
  }, [session, sessionId]);

  // Socket.IO synchronization
  useEffect(() => {
    const wsUrl = getWsUrl();
    try {
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 4000,
        reconnectionAttempts: 10,
        reconnectionDelay: 300,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('exam:join', {
          sessionId,
          candidateName: session.candidateName,
          role,
          sessionState: session,
        });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('exam:state_sync', (syncedState: any) => {
        if (syncedState && syncedState.sessionId === sessionId) {
          setSession((prev) => ({
            ...prev,
            ...syncedState,
            // Keep local draft if newer
            codeDrafts: {
              ...syncedState.codeDrafts,
              ...prev.codeDrafts,
            },
          }));
        }
      });

      socket.on('exam:participant_joined', (data: { count?: number }) => {
        if (data?.count !== undefined) setParticipantsCount(data.count);
      });

      socket.on('exam:code_synced', (data: { slug: string; code: string; language: string; updatedAt: number }) => {
        setSession((prev) => ({
          ...prev,
          codeDrafts: {
            ...prev.codeDrafts,
            [data.slug]: {
              code: data.code,
              language: data.language,
              updatedAt: data.updatedAt,
            },
          },
        }));
      });

      socket.on('exam:violation_synced', (violation: ProctorViolation) => {
        setSession((prev) => ({
          ...prev,
          violations: [violation, ...prev.violations],
          trustScore: Math.max(0, prev.trustScore - violation.penalty),
        }));
      });

      socket.on('exam:nav_synced', (data: { currentQuestionIndex: number }) => {
        if (typeof data.currentQuestionIndex === 'number') {
          setSession((prev) => ({
            ...prev,
            currentQuestionIndex: data.currentQuestionIndex,
          }));
        }
      });

      socket.on('exam:status_synced', (data: { slug: string; status: any }) => {
        setSession((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.slug === data.slug ? { ...q, status: data.status } : q
          ),
        }));
      });

      socket.on('exam:telemetry_synced', (telemetry: any) => {
        setCandidateTelemetry((prev) => ({
          ...prev,
          ...telemetry,
          lastPing: Date.now(),
        }));
      });

      socket.on('exam:announcement_broadcast', (ann: { text: string; severity?: string }) => {
        setAnnouncement({ text: ann.text, severity: ann.severity || 'info' });
        setTimeout(() => setAnnouncement(null), 6000);
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection fallback to local sync:', e);
    }
  }, [sessionId, role]);

  // Synchronize Code Draft in real-time
  const syncCodeDraft = useCallback(
    (slug: string, code: string, language: string) => {
      const updatedAt = Date.now();

      setSession((prev) => {
        const updatedDrafts = {
          ...prev.codeDrafts,
          [slug]: { code, language, updatedAt },
        };
        return {
          ...prev,
          codeDrafts: updatedDrafts,
        };
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('exam:code_update', {
          sessionId,
          slug,
          code,
          language,
          updatedAt,
        });
      }
    },
    [sessionId]
  );

  // Synchronize Violation
  const syncViolation = useCallback(
    (violation: ProctorViolation) => {
      setSession((prev) => ({
        ...prev,
        violations: [violation, ...prev.violations],
        trustScore: Math.max(0, prev.trustScore - violation.penalty),
      }));

      if (socketRef.current?.connected) {
        socketRef.current.emit('exam:violation', {
          sessionId,
          violation,
        });
      }
    },
    [sessionId]
  );

  // Switch Question and sync
  const setCurrentQuestionIndex = useCallback(
    (index: number) => {
      setSession((prev) => ({
        ...prev,
        currentQuestionIndex: index,
      }));

      if (socketRef.current?.connected) {
        socketRef.current.emit('exam:nav_change', {
          sessionId,
          currentQuestionIndex: index,
        });
      }
    },
    [sessionId]
  );

  // Update question status and sync
  const updateQuestionStatus = useCallback(
    (slug: string, status: 'unvisited' | 'drafting' | 'passed' | 'flagged') => {
      setSession((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.slug === slug ? { ...q, status } : q
        ),
      }));

      if (socketRef.current?.connected) {
        socketRef.current.emit('exam:status_update', {
          sessionId,
          slug,
          status,
        });
      }
    },
    [sessionId]
  );

  // Send Candidate Telemetry
  const syncTelemetry = useCallback(
    (telemetry: Partial<CandidateTelemetry>) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('exam:telemetry', {
          sessionId,
          telemetry,
        });
      }
    },
    [sessionId]
  );

  // Send Announcement (Examiner)
  const sendAnnouncement = useCallback(
    (text: string, severity = 'warning') => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('exam:announcement', {
          sessionId,
          text,
          severity,
        });
      }
    },
    [sessionId]
  );

  return {
    session,
    remainingSeconds,
    isConnected,
    participantsCount,
    announcement,
    candidateTelemetry,
    syncCodeDraft,
    syncViolation,
    setCurrentQuestionIndex,
    updateQuestionStatus,
    syncTelemetry,
    sendAnnouncement,
  };
}
