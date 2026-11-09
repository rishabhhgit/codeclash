'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProctorViolation } from '../questions/types';
import {
  analyzeVideoFrame,
  analyzeVideoFrameAsync,
  initAiModel,
  getAiModelStatus,
  setAiSensitivity,
  triggerSimulatedIllicit,
  clearSimulatedIllicit,
  DetectedObject,
  BoundingBox,
  IllicitObjectType,
} from './illicitObjectDetector';

interface UseProctoringOptions {
  enabled?: boolean;
  strictMode?: boolean;
  onViolation?: (violation: ProctorViolation) => void;
  onTelemetry?: (telemetry: {
    audioLevel: number;
    isFullscreen: boolean;
    isCameraActive: boolean;
    isMicActive: boolean;
    faceDetected: boolean;
    trustScore: number;
    illicitCount?: number;
  }) => void;
  examSessionId?: string;
}

export function useProctoring({
  enabled = true,
  strictMode = true,
  onViolation,
  onTelemetry,
  examSessionId,
}: UseProctoringOptions = {}) {
  const [trustScore, setTrustScore] = useState<number>(100);
  const [violations, setViolations] = useState<ProctorViolation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Illicit Object & Vision Telemetry State
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [faceBbox, setFaceBbox] = useState<BoundingBox | null>({ x: 0.25, y: 0.15, width: 0.5, height: 0.6 });
  const [candidateCentering, setCandidateCentering] = useState<'centered' | 'off_center' | 'absent'>('centered');
  const [aiModelStatus, setAiModelStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const visionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceAbsentCountRef = useRef<number>(0);

  // Rate limiting refs to prevent runaway violation cascades
  const lastViolationMapRef = useRef<Record<string, number>>({});
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFullscreenTransitionRef = useRef<number>(0);
  const highAudioStreakRef = useRef<number>(0);

  const addViolation = useCallback(
    (
      type: ProctorViolation['type'],
      penalty: number,
      details: string
    ) => {
      if (!enabled) return;

      const now = Date.now();
      const lastTime = lastViolationMapRef.current[type] || 0;
      // Enforce 6-second cooldown per violation category
      if (now - lastTime < 6000) {
        return;
      }
      lastViolationMapRef.current[type] = now;

      const timeString = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newViolation: ProctorViolation = {
        id: 'viol-' + now + '-' + Math.random().toString(36).substring(2, 6),
        type,
        timestamp: now,
        timeString,
        penalty,
        details,
      };

      setViolations((prev) => [newViolation, ...prev]);
      setTrustScore((prev) => Math.max(0, prev - penalty));
      setActiveWarning(details);
      setWarningCount((prev) => prev + 1);

      if (onViolation) {
        onViolation(newViolation);
      }
    },
    [enabled, onViolation]
  );

  // Fullscreen helper
  const getIsFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      (typeof window !== 'undefined' && typeof screen !== 'undefined' && window.innerHeight >= screen.height - 15 && window.innerWidth >= screen.width - 15)
    );
  }, []);

  // Fullscreen enforcement
  const enterFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined') {
        const docEl = document.documentElement as any;
        const requestMethod =
          docEl.requestFullscreen ||
          docEl.webkitRequestFullscreen ||
          docEl.mozRequestFullScreen ||
          docEl.msRequestFullscreen;

        if (requestMethod) {
          lastFullscreenTransitionRef.current = Date.now();
          await requestMethod.call(docEl);
          setIsFullscreen(true);
          return true;
        }
      }
    } catch (err) {
      console.warn('Could not enter fullscreen:', err);
    }
    return false;
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined') {
        const doc = document as any;
        const exitMethod =
          doc.exitFullscreen ||
          doc.webkitExitFullscreen ||
          doc.mozCancelFullScreen ||
          doc.msExitFullscreen;

        if (exitMethod) {
          lastFullscreenTransitionRef.current = Date.now();
          await exitMethod.call(doc);
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Could not exit fullscreen:', err);
    }
  }, []);

  // Initialize camera and microphone monitoring with illicit object detection
  const startCameraAndMic = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsCameraActive(false);
      setIsMicActive(false);
      return;
    }

    // Clean up any stale streams first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: 15 },
        audio: true,
      });

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsMicActive(true);

      // Handle unexpected track termination (e.g. OS sleep, privacy switch)
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setIsCameraActive(false);
          setActiveWarning('Camera disconnected or interrupted by OS.');
        };
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Initialize offscreen canvas for computer vision analysis
      if (!offscreenCanvasRef.current && typeof document !== 'undefined') {
        offscreenCanvasRef.current = document.createElement('canvas');
      }

      // Real-Time Deep Learning Computer Vision & Illicit Object Scanner Loop (Every 350ms)
      if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
      let isFrameProcessing = false;

      // Pre-warm Deep Learning Model
      initAiModel().then(() => {
        setAiModelStatus(getAiModelStatus());
      }).catch(() => {});

      visionIntervalRef.current = setInterval(async () => {
        if (isFrameProcessing || !videoRef.current || !streamRef.current) return;
        if (videoRef.current.readyState < 2 || videoRef.current.paused || videoRef.current.ended) return;

        isFrameProcessing = true;
        try {
          const analysis = await analyzeVideoFrameAsync(
            videoRef.current,
            offscreenCanvasRef.current || undefined
          );

          setFaceDetected(analysis.faceDetected);
          setFaceBbox(analysis.faceBbox);
          setCandidateCentering(analysis.candidateCentering);
          setDetectedObjects(analysis.illicitObjects);
          setAiModelStatus(analysis.aiModelStatus);

          // 1. Face Absence Detection (Requires 4 consecutive absent checks ~ 1.4s)
          if (!analysis.faceDetected) {
            faceAbsentCountRef.current += 1;
            if (faceAbsentCountRef.current >= 4 && strictMode) {
              addViolation('FACE_ABSENT', 15, '🚨 Candidate face absent from proctor camera frame!');
              faceAbsentCountRef.current = 0;
            }
          } else {
            faceAbsentCountRef.current = 0;
          }

          // 2. Real-Time Illicit Object Violations
          for (const obj of analysis.illicitObjects) {
            if (obj.type === 'cellphone') {
              addViolation('CELLPHONE_DETECTED', 25, `🚨 Unauthorized mobile device / cell phone detected (${Math.round(obj.confidence * 100)}%)!`);
            } else if (obj.type === 'multiple_faces') {
              addViolation('MULTIPLE_FACES', 20, `🚨 Multiple persons detected in camera frame (${Math.round(obj.confidence * 100)}%)!`);
            } else if (obj.type === 'unauthorized_material') {
              addViolation('UNAUTHORIZED_MATERIAL', 15, `🚨 Unauthorized cheat notes or secondary screen detected (${Math.round(obj.confidence * 100)}%)!`);
            } else if (obj.type === 'headphones') {
              addViolation('HEADPHONES_DETECTED', 10, '🚨 Unauthorized headphones or audio device detected!');
            }
          }
        } catch (err) {
          console.warn('Proctor vision loop error:', err);
        } finally {
          isFrameProcessing = false;
        }
      }, 350);

      // Audio loudness monitoring via Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastAudioCheck = Date.now();

        const checkAudio = () => {
          if (!analyserRef.current) return;
          const currentTime = Date.now();

          // Sample audio every 100ms
          if (currentTime - lastAudioCheck >= 100) {
            lastAudioCheck = currentTime;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round(avg * 1.5));
            setAudioLevel(level);

            // Require sustained high volume (> 85 for 1.5 seconds / 15 consecutive frames)
            if (avg > 85) {
              highAudioStreakRef.current += 1;
              if (highAudioStreakRef.current >= 15) {
                addViolation('HIGH_AUDIO_NOISE', 5, 'Sustained external speech or ambient noise detected.');
                highAudioStreakRef.current = 0;
              }
            } else {
              highAudioStreakRef.current = Math.max(0, highAudioStreakRef.current - 1);
            }
          }

          animFrameRef.current = requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (audioErr) {
        console.warn('Audio analyzer error:', audioErr);
      }
    } catch (err) {
      console.warn('Camera/mic hardware access declined or unavailable:', err);
      setIsCameraActive(false);
      setIsMicActive(false);
    }
  }, [addViolation, strictMode]);

  const stopCameraAndMic = useCallback(() => {
    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
      visionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsCameraActive(false);
    setIsMicActive(false);
    setAudioLevel(0);
    setDetectedObjects([]);
  }, []);

  // Persistent camera video element binding
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  });

  // Event Listeners: Tab switch, Fullscreen exit, DevTools, Paste
  useEffect(() => {
    if (!enabled) return;

    // Fullscreen change handler
    const handleFullscreenChange = () => {
      const isNowFullscreen = getIsFullscreen();
      setIsFullscreen(isNowFullscreen);
      lastFullscreenTransitionRef.current = Date.now();

      if (!isNowFullscreen && strictMode) {
        addViolation(
          'FULLSCREEN_EXIT',
          15,
          'Exited full-screen mode! Fullscreen assessment environment is required.'
        );
      }
    };

    // Tab visibility change handler (Immediate violation on tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden && strictMode) {
        addViolation(
          'TAB_SWITCH',
          15,
          'Assessment tab hidden! Leaving the assessment tab is strictly monitored.'
        );
      }
    };

    // Window blur handler with 2.5s debounce to avoid false positives
    const handleWindowBlur = () => {
      // Ignore blur right after entering/exiting fullscreen
      if (Date.now() - lastFullscreenTransitionRef.current < 4000) {
        return;
      }

      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);

      blurTimeoutRef.current = setTimeout(() => {
        if (typeof document !== 'undefined' && (!document.hasFocus() || document.hidden) && strictMode) {
          addViolation(
            'WINDOW_BLUR',
            10,
            'Assessment window lost active focus for more than 2 seconds.'
          );
        }
      }, 2500);
    };

    const handleWindowFocus = () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };

    // DevTools & Key shortcuts interception
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        addViolation('DEVTOOLS_ATTEMPT', 20, 'F12 Developer Tools shortcut intercepted.');
        return false;
      }

      // Ctrl+Shift+I / Cmd+Opt+I (DevTools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')
      ) {
        e.preventDefault();
        addViolation('DEVTOOLS_ATTEMPT', 20, 'Developer Tools shortcut intercepted.');
        return false;
      }

      // Ctrl+U / Cmd+Opt+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        addViolation('DEVTOOLS_ATTEMPT', 15, 'View Source attempt blocked.');
        return false;
      }
    };

    // Paste monitoring
    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text') || '';
      if (pastedText.length > 50 && strictMode) {
        addViolation(
          'CLIPBOARD_PASTE',
          10,
          `External code paste detected (${pastedText.length} characters). Solutions must be authored manually.`
        );
      }
    };

    // Context menu protection (prevent right-click inspect)
    const handleContextMenu = (e: MouseEvent) => {
      if (strictMode) {
        e.preventDefault();
        setActiveWarning('Right-click context menu is restricted in proctored mode.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [enabled, strictMode, addViolation]);

  // Periodic Telemetry Synchronization
  useEffect(() => {
    if (!enabled || !onTelemetry) return;

    const interval = setInterval(() => {
      onTelemetry({
        audioLevel,
        isFullscreen,
        isCameraActive,
        isMicActive,
        faceDetected,
        trustScore,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [enabled, onTelemetry, audioLevel, isFullscreen, isCameraActive, isMicActive, faceDetected, trustScore]);

  const dismissWarning = useCallback(() => {
    setActiveWarning(null);
  }, []);

  const resetViolations = useCallback(() => {
    setViolations([]);
    setTrustScore(100);
    setActiveWarning(null);
    setWarningCount(0);
    lastViolationMapRef.current = {};
  }, []);

  const toggleFaceDetection = useCallback(() => {
    setFaceDetected((prev) => {
      const next = !prev;
      if (!next && strictMode) {
        addViolation('FACE_ABSENT', 10, 'Candidate face left camera frame.');
      }
      return next;
    });
  }, [strictMode, addViolation]);

  return {
    trustScore,
    violations,
    isFullscreen,
    isCameraActive,
    isMicActive,
    faceDetected,
    faceBbox,
    candidateCentering,
    detectedObjects,
    aiModelStatus,
    setAiSensitivity,
    activeWarning,
    warningCount,
    audioLevel,
    videoRef,
    enterFullscreen,
    exitFullscreen,
    startCameraAndMic,
    stopCameraAndMic,
    reconnectCamera: startCameraAndMic,
    triggerSimulatedIllicit,
    clearSimulatedIllicit,
    dismissWarning,
    resetViolations,
    addViolation,
    toggleFaceDetection,
  };
}
