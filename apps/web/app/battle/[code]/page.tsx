'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { io, Socket } from 'socket.io-client';
import {
  Swords,
  Shield,
  ShieldAlert,
  Clock,
  Eye,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  MessageSquare,
  Terminal,
  Trophy,
  Flame,
  Zap,
  Radio,
  FileCode,
  Maximize2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Check,
  Copy,
  Share2,
  Sparkles,
  ThumbsUp,
  Lightbulb,
  Skull,
  Crosshair,
  Package,
  Heart,
} from 'lucide-react';

import { getQuestionBySlug, getAllQuestions } from '../../../lib/questions/data';
import { LeetCodeQuestion, TestCase } from '../../../lib/questions/types';
import { runCode, ExecutionSummary } from '../../../lib/execution/runner';
import { useProctoring } from '../../../lib/proctoring/useProctoring';
import ProctorWidget from '../../../components/proctoring/ProctorWidget';
import ProctorViolationModal from '../../../components/proctoring/ProctorViolationModal';
import ProctorAuditPanel from '../../../components/proctoring/ProctorAuditPanel';
import { getWsUrl, getClientAuthToken, getClientUsername } from '../../../lib/api';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-card text-muted-foreground font-mono text-xs">
      Loading Combat Code Editor...
    </div>
  ),
});

type BattleRole = 'fighter' | 'spectator';
type LeftTab = 'description' | 'roster' | 'feed' | 'challenge';

export default function BattleRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeParam = (params.code as string).toUpperCase();
  const initialRole: BattleRole = searchParams.get('role') === 'spectator' ? 'spectator' : 'fighter';

  const [role, setRole] = useState<BattleRole>(initialRole);
  const [username, setUsername] = useState<string>(() => {
    return getClientUsername();
  });

  // Direct drop-in into arena (no blocking proctored modal)
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [cameraChecked, setCameraChecked] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [fullscreenChecked, setFullscreenChecked] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Match & Room State
  const [battle, setBattle] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15 * 60);
  const [spectatorSelectedPlayer, setSpectatorSelectedPlayer] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [matchWinner, setMatchWinner] = useState<string | null>(null);

  // Editor & Execution State
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java'>('cpp');
  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<ExecutionSummary | null>(null);

  // Opponent code stream for live spectator / combatant
  const [opponentStreams, setOpponentStreams] = useState<Record<string, { code: string; language: string }>>({});
  const [opponentTyping, setOpponentTyping] = useState<boolean>(false);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, { code: string; language: string; username: string }>>({});
  const [inspectingOpponent, setInspectingOpponent] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Active DSA Question
  const question = useMemo(() => {
    const slug = battle?.questionSlug || searchParams.get('slug') || 'two-sum';
    return getQuestionBySlug(slug) || getAllQuestions()[0];
  }, [battle?.questionSlug, searchParams]);

  const handleCopyInviteLink = useCallback(() => {
    if (typeof window === 'undefined') return;
    const challengeUrl = `${window.location.origin}/battle/${codeParam}${question?.slug ? `?slug=${question.slug}` : ''}`;
    navigator.clipboard.writeText(challengeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }, [codeParam, question?.slug]);

  const handleCopyCode = useCallback(() => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(codeParam);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  }, [codeParam]);

  // Battle Royale Game Mechanics
  const isBattleRoyale = useMemo(() => {
    return (
      battle?.mode === 'battle_royale' ||
      battle?.mode === 'royal' ||
      codeParam.startsWith('ROYAL') ||
      codeParam.startsWith('BR-') ||
      (battle?.maxPlayers && battle.maxPlayers > 2)
    );
  }, [battle?.mode, battle?.maxPlayers, codeParam]);

  const aliveSurvivorsCount = useMemo(() => {
    if (!battle?.players) return 1;
    return Object.values(battle.players).filter((p: any) => p.status !== 'eliminated').length;
  }, [battle?.players]);

  const totalCombatants = useMemo(() => {
    if (!battle?.players) return 1;
    return Object.keys(battle.players).length;
  }, [battle?.players]);

  const handleClaimAirdrop = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('battle:claim_airdrop', {
      battleCode: codeParam,
    });
  };

  // HackerRank Proctoring Hook
  const {
    trustScore,
    violations,
    isFullscreen,
    isCameraActive,
    isMicActive,
    faceDetected,
    activeWarning,
    audioLevel,
    videoRef,
    detectedObjects,
    faceBbox,
    candidateCentering,
    aiModelStatus,
    setAiSensitivity,
    reconnectCamera,
    triggerSimulatedIllicit,
    clearSimulatedIllicit,
    enterFullscreen,
    exitFullscreen,
    startCameraAndMic,
    stopCameraAndMic,
    dismissWarning,
    resetViolations,
  } = useProctoring({
    enabled: false,
    strictMode: false,
    onViolation: (v) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('battle:violation', {
          battleCode: codeParam,
          violation: v,
        });
      }
    },
  });

  // Sync user's default language preference from settings (defaults to 'cpp')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('codeclash_default_language') as 'cpp' | 'python' | 'java';
      if (savedLang && ['cpp', 'python', 'java'].includes(savedLang)) {
        setLanguage(savedLang);
      }
    }
  }, []);

  // Socket.IO Connection for Real-Time Duel & Spectating
  useEffect(() => {
    const wsUrl = getWsUrl();
    const token = getClientAuthToken();
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      auth: { token, candidateId: username },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('battle:join', {
        battleCode: codeParam,
        role,
        username,
        questionSlug: searchParams.get('slug') || undefined,
        mode: searchParams.get('mode') || (codeParam.toUpperCase().startsWith('ROYAL') || codeParam.toUpperCase().startsWith('BR-') ? 'battle_royale' : undefined),
      });
    });

    socket.on('battle:role_reassigned', (data: { role: BattleRole; reason: string }) => {
      if (data?.role) {
        setRole(data.role);
        setIsVerified(true);
      }
    });

    socket.on('battle:state_sync', (state: any) => {
      if (state) {
        setBattle(state);
        if (state.endTime && state.status === 'active') {
          setRemainingSeconds(Math.max(0, Math.floor((state.endTime - Date.now()) / 1000)));
        }
        if (state.winner) {
          setMatchWinner(state.winner);
        }
      }
    });

    socket.on('battle:state_update', (state: any) => {
      if (state) setBattle(state);
    });

    socket.on('battle:countdown_tick', (data: { count: number }) => {
      setCountdownVal(data.count);
    });

    socket.on('battle:countdown_complete', () => {
      setCountdownVal(0);
      setTimeout(() => setCountdownVal(null), 1000);
    });

    socket.on('battle:opponent_typing', (data: any) => {
      if (data.username !== username) {
        setOpponentTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setOpponentTyping(false);
        }, 1500);
      }
    });

    socket.on('battle:reveal_codes', (solutions: any) => {
      if (solutions) setRevealedSolutions(solutions);
    });

    socket.on('battle:player_code_stream', (data: any) => {
      setOpponentStreams((prev) => ({
        ...prev,
        [data.userId]: { code: data.code, language: data.language },
      }));
    });

    socket.on('battle:progress_sync', (data: any) => {
      setBattle((prev: any) => {
        if (!prev) return prev;
        const updatedPlayers = { ...prev.players };
        if (updatedPlayers[data.userId]) {
          updatedPlayers[data.userId].passedCases = data.passed;
          updatedPlayers[data.userId].totalCases = data.total;
        }
        return {
          ...prev,
          players: updatedPlayers,
          feed: data.feed || prev.feed,
        };
      });
    });

    socket.on('battle:match_won', (data: any) => {
      setMatchWinner(data.winner);
      if (data.battle) setBattle(data.battle);
      if (data.solutions) setRevealedSolutions(data.solutions);
    });

    socket.on('battle:submission_result', (data: any) => {
      if (data.userId === socket.id || data.userId === username) {
        setExecResult((prev) => ({
          verdict: data.verdict as any,
          passedCases: data.passed,
          totalCases: data.total,
          totalRuntimeMs: prev?.totalRuntimeMs || 0,
          memoryMb: prev?.memoryMb || 0,
          results: prev?.results || [],
          globalError: data.error,
        }));
      }
    });

    socket.on('battle:player_reconnected', (data: any) => {
      setBattle((prev: any) => (prev ? { ...prev, feed: data.feed || prev.feed } : prev));
    });

    socket.on('battle:violation_alert', (data: any) => {
      setBattle((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          feed: data.feed || prev.feed,
        };
      });
    });

    socket.on('battle:chat_broadcast', (msg: any) => {
      setBattle((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          chat: [...(prev.chat || []), msg],
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [codeParam, role, username]);

  // Synchronized countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set default question code
  useEffect(() => {
    if (!question) return;
    const starter = question.starterCodes[language] || question.starterCodes.cpp || question.starterCodes.python;
    setCode(starter);
    setCustomTestCases(question.testCases.map((tc, idx) => ({ ...tc, id: `tc-${idx}` })));
  }, [question, language]);

  // Stream fighter code in real-time
  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    if (socketRef.current?.connected && role === 'fighter') {
      socketRef.current.emit('battle:code_stream', {
        battleCode: codeParam,
        code: val,
        language,
      });
    }
  };

  // Native server-side compiler (clang++ / python3) with client-side fallback
  const executeCode = async (casesToRun: TestCase[], isSubmit: boolean): Promise<ExecutionSummary> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resp = await fetch('/api/questions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: question.slug,
          code,
          language,
          isSubmit,
          customTestCases: casesToRun,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Battle execution API timed out or unavailable, using fallback runner:', e);
    }
    return await runCode(code, language, question, casesToRun);
  };

  // Run Testcases
  const handleRunCode = async () => {
    if (!question || isRunning) return;
    setIsRunning(true);
    setActiveConsoleTab('result');

    try {
      const summary = await executeCode(customTestCases, false);
      setExecResult(summary);

      if (socketRef.current?.connected && role === 'fighter') {
        socketRef.current.emit('battle:testcase_progress', {
          battleCode: codeParam,
          passed: summary.passedCases,
          total: summary.totalCases,
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution
  const handleSubmitCode = async () => {
    if (!question || isSubmitting) return;
    setIsSubmitting(true);
    setActiveConsoleTab('result');

    try {
      const fullSuite = [...question.testCases, ...(question.hiddenTestCases || [])];
      const summary = await executeCode(fullSuite, true);
      setExecResult(summary);

      if (socketRef.current?.connected && role === 'fighter') {
        socketRef.current.emit('battle:submit_solution', {
          battleCode: codeParam,
          code,
          language,
          passed: summary.passedCases,
          total: summary.totalCases,
          verdict: summary.verdict,
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Spectator Chat / Reaction
  const handleSendChat = (text: string, isCheer = false) => {
    if (!text.trim() || !socketRef.current?.connected) return;
    socketRef.current.emit('battle:chat_message', {
      battleCode: codeParam,
      message: text,
      isCheer,
    });
    setChatInput('');
  };

  // Format Timer MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Players list for spectator views
  const playersList = useMemo(() => {
    if (!battle?.players) return [];
    return Object.values(battle.players) as any[];
  }, [battle?.players]);

  const activeSpectatorPlayer = useMemo(() => {
    if (spectatorSelectedPlayer) {
      return playersList.find((p) => p.userId === spectatorSelectedPlayer) || playersList[0];
    }
    return playersList[0];
  }, [playersList, spectatorSelectedPlayer]);

  const opponentPlayer = useMemo(() => {
    return playersList.find((p) => p.username !== username) || null;
  }, [playersList, username]);

  const currentPlayer = useMemo(() => {
    return playersList.find((p) => p.username === username) || null;
  }, [playersList, username]);

  const isStormHazard = useMemo(() => {
    if (!isBattleRoyale || battle?.status !== 'active') return false;
    const req = battle?.storm?.phase || 1;
    return (currentPlayer?.passedCases || 0) < req || (currentPlayer?.hp ?? 100) < 40;
  }, [isBattleRoyale, battle?.status, battle?.storm?.phase, currentPlayer?.passedCases, currentPlayer?.hp]);

  const handleToggleReady = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('battle:toggle_ready', {
      battleCode: codeParam,
    });
  };

  return (
    <div
      className="flex flex-col h-[calc(100dvh-4rem)] bg-background text-foreground overflow-hidden font-sans select-none relative transition-all duration-500"
      style={isStormHazard ? { boxShadow: 'inset 0 0 50px rgba(59, 130, 246, 0.45)' } : undefined}
    >
      {/* ================= TOP ARENA NAVBAR ================= */}
      <header className="h-13 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 gap-3 z-30">
        {/* Left: Room & Match Mode */}
        <div className="flex items-center gap-3">
          <Link
            href="/lobby"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Lobby
          </Link>

          <div className="h-4 w-px bg-muted" />

          <div className="flex items-center gap-2">
            <span className="font-black text-xs text-primary flex items-center gap-1">
              {isBattleRoyale ? <Flame className="size-4 text-orange-500" /> : <Swords className="size-4 text-primary" />}
              {isBattleRoyale ? `Knockout Arena ${codeParam}` : `Arena ${codeParam}`}
            </span>
            <span className={`px-2 py-0.5 rounded border text-[11px] font-mono ${
              isBattleRoyale
                ? 'bg-primary/10 text-primary border-primary/20 font-bold'
                : 'bg-muted border-border text-muted-foreground'
            }`}>
              {isBattleRoyale ? 'Knockout Tournament' : '1v1 Deathmatch'}
            </span>
            <div className="flex items-center rounded-lg border border-border bg-muted overflow-hidden text-xs">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 hover:bg-muted/80 text-foreground font-mono text-[11px] font-medium flex items-center gap-1 border-r border-border transition-colors duration-150 active:scale-[0.98]"
                title="Copy unique room code"
                aria-label="Copy unique room code"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
                <span>{copiedCode ? 'Code Copied!' : `Code: ${codeParam}`}</span>
              </button>
              <button
                onClick={handleCopyInviteLink}
                className="px-2.5 py-1 hover:bg-muted/80 text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors duration-150 active:scale-[0.98]"
                title="Copy direct invite link"
                aria-label="Copy direct invite link"
              >
                {copiedLink ? <Check className="size-3.5 text-emerald-400" /> : <Share2 className="size-3.5 text-muted-foreground" />}
                <span>{copiedLink ? 'Link Copied!' : 'Invite Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Synchronized Timer & Survival / Spectator Count */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium ${
              remainingSeconds < 180
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-muted text-foreground border-border'
            }`}
          >
            <Clock className="size-3.5 text-amber-400" />
            <span className="tabular-nums">{formatTimer(remainingSeconds)}</span>
          </div>

          {isBattleRoyale ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold font-mono">
              <span className="flex size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="tabular-nums">👥 {aliveSurvivorsCount} / {totalCombatants} Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
              <Eye className="size-3.5 text-blue-400" />
              <span className="tabular-nums">
                {Object.keys(battle?.spectators || {}).length > 0
                  ? `${Object.keys(battle?.spectators || {}).length} ${Object.keys(battle?.spectators || {}).length === 1 ? 'Spectator' : 'Spectators'}`
                  : '0 Spectators'}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              handleCopyInviteLink();
              setActiveLeftTab('challenge');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold transition-all duration-150 shadow-sm active:scale-95"
            title="Invite friends to this battle"
            aria-label="Invite friends to this battle"
          >
            <Share2 className="size-3.5" />
            <span>{copiedLink ? 'Link Copied! ✓' : '👥 Challenge Friends'}</span>
          </button>
        </div>

        {/* Right: Locked Role Badge (Role flipping disabled during active match) */}
        <div className="flex items-center gap-2">
          {role === 'fighter' ? (
            <div
              data-testid="fighter-mode-badge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-medium text-xs select-none"
              title="Active Fighter: role is locked to prevent battle corruption"
            >
              <Swords className="size-3.5" />
              <span>Fighter Mode (Combatant)</span>
            </div>
          ) : (
            <div
              data-testid="spectator-mode-badge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-xs select-none shadow-sm"
              title="Spectator: observing live combat"
            >
              <Eye className="size-3.5 text-blue-400" />
              <span>Spectator Mode (Observer)</span>
            </div>
          )}
        </div>
      </header>

      {/* ================= READY CHECK OR COUNTDOWN OVERLAY BANNER ================= */}
      {battle?.status === 'ready_check' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs shrink-0 z-20 motion-enter">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="font-bold text-amber-300 uppercase tracking-wider">Ready Check Active:</span>
            <span className="text-muted-foreground text-pretty">Both fighters must confirm readiness to unlock the arena</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs font-mono">
              You: <strong className={currentPlayer?.isReady ? 'text-emerald-400' : 'text-amber-400'}>{currentPlayer?.isReady ? 'READY ✓' : 'NOT READY'}</strong>
              {' | '}
              Opponent: <strong className={opponentPlayer?.isReady ? 'text-emerald-400' : 'text-muted-foreground'}>{opponentPlayer?.isReady ? 'READY ✓' : 'WAITING...'}</strong>
            </span>
            <button
              onClick={handleToggleReady}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-150 shadow-sm active:scale-95 ${
                currentPlayer?.isReady
                  ? 'bg-secondary border border-border text-foreground hover:bg-muted'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {currentPlayer?.isReady ? 'Cancel Ready' : 'CONFIRM READY ✓'}
            </button>
          </div>
        </div>
      )}

      {(battle?.status === 'countdown' || (countdownVal !== null && countdownVal > 0)) && (
        <div className="bg-primary/20 border-b border-primary/40 px-4 py-3 flex items-center justify-center text-center text-xs shrink-0 z-20 motion-enter">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-black text-primary tabular-nums">
              {countdownVal !== null && countdownVal > 0 ? countdownVal : battle?.countdownSeconds || 3}
            </span>
            <span className="font-bold text-foreground text-sm uppercase tracking-widest text-balance">
              BATTLE COMMENCING — PREPARE TO CODE!
            </span>
          </div>
        </div>
      )}

      {/* ================= FIGHTER HUD: LIVE OPPONENT METER OR KNOCKOUT ARENA HUD ================= */}
      {role === 'fighter' && (
        isBattleRoyale ? (
          <div className="bg-gradient-to-r from-blue-950/60 via-card to-purple-950/60 border-b border-blue-500/30 px-4 py-2 flex flex-wrap items-center justify-between text-xs shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="size-3.5 text-blue-400" />
                <span>{battle?.storm?.phaseName || 'Phase 1: Initial Benchmark Sprint'}</span>
              </span>

              <span className="text-muted-foreground text-xs hidden md:inline">
                Cutoff Requirement: <strong className="text-foreground">{battle?.storm?.safeZoneRequirement || 'Pass testcases before cutoff'}</strong>
              </span>

              {battle?.airdrop?.active && (
                !battle.airdrop.claimedBy ? (
                  <button
                    onClick={handleClaimAirdrop}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-[10px] tracking-wide flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 transition-all duration-150"
                  >
                    <Package className="size-3.5 text-black" />
                    <span>CLAIM ALGORITHMIC BLUEPRINT (+50 Buffer)</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Package className="size-3 text-muted-foreground" />
                    <span>Blueprint claimed by @{battle.airdrop.claimedBy}</span>
                  </span>
                )
              )}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Heart className="size-3.5 text-rose-500 fill-rose-500" />
                <span>STAMINA</span>
                <div className="w-20 bg-muted h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, currentPlayer?.hp ?? 100))}%` }}
                  />
                </div>
                <span className="text-foreground tabular-nums">{currentPlayer?.hp ?? 100}</span>
              </div>

              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Shield className="size-3.5 text-blue-400" />
                <span>BUFFER</span>
                <div className="w-16 bg-muted h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, currentPlayer?.shield ?? 50))}%` }}
                  />
                </div>
                <span className="text-foreground tabular-nums">{currentPlayer?.shield ?? 50}</span>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-border text-foreground font-bold">
                <span className="text-primary font-mono tabular-nums">👥 {aliveSurvivorsCount} Active Coders</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-emerald-400 font-mono tabular-nums">🎯 {currentPlayer?.kills || 0} Solved</span>
              </div>
            </div>
          </div>
        ) : opponentPlayer ? (
          <div className="h-10 bg-card border-b border-border px-4 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Opponent:</span>
              <span className="font-bold text-foreground">{opponentPlayer.username}</span>
              <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] text-muted-foreground tabular-nums">
                {opponentPlayer.trustScore}% Trust
              </span>
              {opponentTyping ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Typing...
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground font-mono">Idle</span>
              )}
              <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.2 rounded bg-muted/50 font-mono hidden sm:inline" title="Opponent code is private during match">
                🔒 Code Shielded
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs">
                Testcases Passed: <strong className="text-emerald-400 tabular-nums">{opponentPlayer.passedCases || 0}</strong> / <span className="tabular-nums">{opponentPlayer.totalCases || 3}</span>
              </span>
              <div className="w-28 bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{
                    width: `${((opponentPlayer.passedCases || 0) / (opponentPlayer.totalCases || 3)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-11 bg-card border-b border-border px-4 flex items-center justify-between text-xs shrink-0 gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="text-muted-foreground font-medium">Waiting for challenger...</span>
              <span className="text-foreground text-xs hidden sm:inline">
                Share Code: <strong className="font-mono text-primary font-bold">{codeParam}</strong> or Invite Link
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-md bg-secondary hover:bg-muted text-foreground border border-border font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 active:scale-[0.98]"
                aria-label="Copy code"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
                <span>{copiedCode ? 'Code Copied!' : `Copy Code (${codeParam})`}</span>
              </button>
              <button
                onClick={handleCopyInviteLink}
                className="px-3 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 transition-colors duration-150 active:scale-[0.98]"
                aria-label="Copy invite link"
              >
                {copiedLink ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* ================= MAIN WORKSPACE: FIGHTER OR SPECTATOR ================= */}
      {role === 'spectator' ? (
        /* ======================================================== */
        /* LIVE SPECTATOR MODE (Side-by-Side Dual Code & Telemetry) */
        /* ======================================================== */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Left Column: Match Details & Live Combat Log */}
          <div className="flex flex-col border-r border-border bg-background overflow-hidden">
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500" />
                  Live Duel Telemetry
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                  In Progress
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Problem: {question.title}</p>
            </div>

            {/* Combatants Leaderboard */}
            <div className="p-4 space-y-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground">Combatants</h3>
              <div className="space-y-2">
                {playersList.map((p, idx) => (
                  <div
                    key={p.userId}
                    onClick={() => setSpectatorSelectedPlayer(p.userId)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      activeSpectatorPlayer?.userId === p.userId
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-foreground">
                        #{idx + 1} {p.username}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.trustScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {p.trustScore}% Trust
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Cases: {p.passedCases || 0} / {p.totalCases || 3} Passed</span>
                      <span className="font-mono capitalize text-[11px] text-muted-foreground">{p.language || 'javascript'}</span>
                    </div>

                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{
                          width: `${((p.passedCases || 0) / (p.totalCases || 3)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Play-by-Play Combat Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">Combat Feed</h3>
              {(battle?.feed || []).map((item: any) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                    item.type === 'win'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-200 font-bold'
                      : item.type === 'violation'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-border/80 bg-muted/40 text-foreground'
                  }`}
                >
                  <span className="text-muted-foreground font-mono text-[10px] mr-1.5">[{item.time}]</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Column: Live Code Mirror of Selected Fighter */}
          <div className="flex flex-col border-r border-border bg-card overflow-hidden">
            <div className="h-10 px-4 bg-card border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">
                  Live Screen: {activeSpectatorPlayer?.username || 'Player'}
                </span>
                <span className="size-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">Real-time Stream</span>
            </div>

            <div className="flex-1 bg-card">
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeSpectatorPlayer?.language || 'javascript'}
                value={
                  opponentStreams[activeSpectatorPlayer?.userId]?.code ||
                  activeSpectatorPlayer?.code ||
                  `// Waiting for ${activeSpectatorPlayer?.username || 'player'} code stream...`
                }
                options={{
                  readOnly: true,
                  fontSize: 13,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                }}
              />
            </div>
          </div>

          {/* Right Column: Live Spectator Chat & Cheer Reactions */}
          <div className="flex flex-col bg-background overflow-hidden">
            <div className="h-10 px-4 bg-card border-b border-border flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                Spectator Chat & Cheers
              </span>
              <span className="text-[11px] text-muted-foreground">Live Reaction</span>
            </div>

            {/* Quick Cheer Buttons */}
            <div className="p-2 border-b border-border/80 bg-muted/40 flex items-center justify-around gap-1">
              <button
                onClick={() => handleSendChat('Sharp code!', true)}
                className="px-2.5 py-1 rounded bg-muted hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors text-foreground"
              >
                <Flame className="w-3 h-3 text-orange-400" />
                Fire
              </button>
              <button
                onClick={() => handleSendChat('Good match, well played!', true)}
                className="px-2.5 py-1 rounded bg-muted hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors text-foreground"
              >
                <ThumbsUp className="w-3 h-3 text-blue-400" />
                GG
              </button>
              <button
                onClick={() => handleSendChat('Impressive solve speed!', true)}
                className="px-2.5 py-1 rounded bg-muted hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors text-foreground"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                Fast
              </button>
              <button
                onClick={() => handleSendChat('Optimal algorithmic approach!', true)}
                className="px-2.5 py-1 rounded bg-muted hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors text-foreground"
              >
                <Lightbulb className="w-3 h-3 text-yellow-400" />
                Brain
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {(battle?.chat || []).map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg border ${
                    msg.isCheer ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-muted/40 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span className="font-bold text-foreground">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p>{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                type="text"
                placeholder="Chat or cheer live..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat(chatInput)}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => handleSendChat(chatInput)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* FIGHTER MODE (HackerRank Proctored Arena & Monaco Editor) */
        /* ======================================================== */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden select-text">
          {/* Left Pane: Question Details & Live Combat Feed */}
          <div className="flex flex-col border-r border-border bg-background overflow-hidden">
            <div className="h-10 px-3 border-b border-border bg-card flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveLeftTab('description')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeLeftTab === 'description' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                Problem Statement
              </button>

              {isBattleRoyale && (
                <button
                  onClick={() => setActiveLeftTab('roster')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeLeftTab === 'roster' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Active Coders ({aliveSurvivorsCount}/{totalCombatants})</span>
                </button>
              )}

              <button
                onClick={() => setActiveLeftTab('feed')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeLeftTab === 'feed' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                Match Feed ({(battle?.feed || []).length})
              </button>

              <button
                onClick={() => setActiveLeftTab('challenge')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeLeftTab === 'challenge' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-primary" />
                <span>Challenge Friends</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeLeftTab === 'description' && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {question.number}. {question.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {question.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{question.category}</span>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none text-foreground leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.description}</ReactMarkdown>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Examples</h3>
                    {question.examples.map((ex, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 text-xs font-mono">
                        <div>
                          <span className="text-muted-foreground font-sans">Input: </span>
                          <span className="text-foreground">{ex.input}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-sans">Output: </span>
                          <span className="text-emerald-400">{ex.expectedOutput}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">Constraints:</h3>
                    <ul className="list-disc list-inside text-xs text-muted-foreground font-mono space-y-0.5">
                      {question.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeLeftTab === 'roster' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Survivors Radar</h3>
                      <p className="text-[11px] text-muted-foreground">Real-time status of all combatants in the circle.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                      {aliveSurvivorsCount} / {totalCombatants} Alive
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {playersList.map((p, idx) => {
                      const isAlive = p.status !== 'eliminated';
                      return (
                        <div
                          key={p.userId}
                          className={`p-3.5 rounded-xl border transition-all ${
                            p.username === username
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : isAlive
                              ? 'border-border bg-card'
                              : 'border-border/40 bg-muted/20 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                {p.username}
                                {p.username === username && <span className="text-[10px] text-primary font-mono">(You)</span>}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                p.status === 'champion'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : isAlive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {p.status === 'champion' ? '🏆 Champion' : isAlive ? '🟢 Active' : '⚠️ Cutoff'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
                            <div>Stamina: <strong className="text-emerald-400">{p.hp ?? 100}</strong> / 100</div>
                            <div>Buffer: <strong className="text-blue-400">{p.shield ?? 50}</strong> / 100</div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                            <span>Benchmarks: <strong className="text-foreground">{p.passedCases || 0} / {p.totalCases || 4} Passed</strong></span>
                            {p.eliminatedBy && <span className="text-rose-400 text-[10px]">Cause: {p.eliminatedBy}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeLeftTab === 'feed' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground mb-2">Live Match Activity</h3>
                  {(battle?.feed || []).map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border text-xs leading-relaxed ${
                        item.type === 'win'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-200 font-bold'
                          : item.type === 'violation'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : 'border-border bg-muted/40 text-foreground'
                      }`}
                    >
                      <span className="text-muted-foreground font-mono text-[10px] mr-1.5">[{item.time}]</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeLeftTab === 'challenge' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-2">
                    <div className="flex items-center gap-2">
                      <Swords className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-sm text-foreground">Challenge Your Friends</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Invite a friend or rival to this {isBattleRoyale ? 'Knockout Arena' : '1v1 Blitz Duel'}. Share the room code or direct link to battle in real-time.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Room Access Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-muted/60 border border-border rounded-xl font-mono text-base font-bold text-foreground text-center tracking-widest">
                        {codeParam}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="px-4 py-3 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Direct Battle Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}/battle/${codeParam}` : `/battle/${codeParam}`}
                        className="flex-1 px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-mono text-muted-foreground truncate select-all"
                      />
                      <button
                        onClick={handleCopyInviteLink}
                        className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shadow-md shadow-primary/20"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Social Share */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs text-muted-foreground font-medium block">Quick Share:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`⚔️ I challenge you to a coding battle on CodeClash! Drop into my room here: ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/battle/${codeParam}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/battle/${codeParam}` : '')}&text=${encodeURIComponent('⚔️ Join my CodeClash arena battle!')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        Telegram
                      </a>
                    </div>
                  </div>

                  {/* Current Combatants in Arena */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Current Combatants in Arena</span>
                      <span className="font-mono text-muted-foreground">{playersList.length} / {battle?.maxPlayers || 2}</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {playersList.map((p) => (
                        <div key={p.userId} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <span className="font-medium text-foreground">{p.username}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.isReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {p.isReady ? 'READY ✓' : 'WAITING...'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Monaco Editor & Live Console */}
          <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Editor Action Toolbar */}
            <div className="h-10 px-3 border-b border-border bg-card flex items-center justify-between shrink-0 text-xs">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="text-xs bg-card border border-border text-foreground font-semibold px-2.5 py-1.5 rounded-lg"
              >
                <option value="cpp">C++</option>
                <option value="python">Python 3</option>
                <option value="java">Java</option>
              </select>

              <div className="flex items-center gap-2">
                {isBattleRoyale && (
                  <span className="text-[11px] text-amber-400 font-mono hidden md:inline px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-semibold">
                    ⚠️ Penalty: -25 Stamina on failed tests
                  </span>
                )}
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting || battle?.status === 'ready_check' || battle?.status === 'countdown'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted text-foreground text-xs font-semibold border border-border disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 text-emerald-400 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning || isSubmitting || battle?.status === 'ready_check' || battle?.status === 'countdown'}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-950 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-[160px] w-full overflow-hidden bg-card relative">
              {(battle?.status === 'ready_check' || battle?.status === 'countdown') && (
                <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground shadow-lg">
                    🔒 Editor locked until Ready Check & Countdown complete
                  </div>
                </div>
              )}
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  readOnly: battle?.status === 'ready_check' || battle?.status === 'countdown',
                  minimap: { enabled: false },
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  bracketPairColorization: { enabled: true },
                  automaticLayout: true,
                  wordWrap: 'on',
                }}
              />
            </div>

            {/* Console */}
            <div className="h-56 bg-background border-t border-border flex flex-col shrink-0">
              <div className="h-9 px-3 border-b border-border bg-card flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveConsoleTab('testcase')}
                  className={`px-3 py-1 rounded font-semibold ${
                    activeConsoleTab === 'testcase' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Testcases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={`px-3 py-1 rounded font-semibold ${
                    activeConsoleTab === 'result' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Result
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
                {activeConsoleTab === 'testcase' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {customTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveTestCaseIndex(idx)}
                          className={`px-3 py-1 rounded-lg cursor-pointer border ${
                            activeTestCaseIndex === idx
                              ? 'bg-muted border-border text-foreground'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                        >
                          Case {idx + 1}
                        </div>
                      ))}
                    </div>

                    {customTestCases[activeTestCaseIndex] && (
                      <textarea
                        rows={3}
                        value={customTestCases[activeTestCaseIndex].input}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomTestCases((prev) =>
                            prev.map((c, i) => (i === activeTestCaseIndex ? { ...c, input: val } : c))
                          );
                        }}
                        className="w-full p-2.5 rounded-lg bg-card border border-border text-foreground font-mono text-xs focus:outline-none"
                      />
                    )}
                  </div>
                )}

                {activeConsoleTab === 'result' && (
                  <div>
                    {!execResult ? (
                      <div className="text-muted-foreground text-center py-6 font-sans">
                        Run tests or submit your code to view results.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-sm ${
                              execResult.verdict === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {execResult.verdict} ({execResult.passedCases}/{execResult.totalCases} passed)
                          </span>
                          <span className="text-muted-foreground">{execResult.totalRuntimeMs} ms</span>
                        </div>

                        {execResult.results.map((res) => (
                          <div
                            key={res.index}
                            className={`p-2.5 rounded-lg border ${
                              res.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
                            }`}
                          >
                            <div className="flex justify-between font-sans font-semibold mb-1">
                              <span>Case {res.index}</span>
                              <span className={res.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                {res.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            <div>Input: {res.input}</div>
                            <div>Output: {res.actual}</div>
                            <div>Expected: {res.expected}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= HACKERRANK PRE-ASSESSMENT VERIFICATION MODAL ================= */}
      {false && role === 'fighter' && !isVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">HackerRank Proctored Check-In</h2>
                <p className="text-xs text-muted-foreground">Complete verification to enter the timed combat arena</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1.5">
                <label className="block text-[11px] font-semibold text-foreground">
                  Fighter Handle / Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUsername(val);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('battle_username', val);
                    }
                  }}
                  placeholder="Enter your fighter handle..."
                  className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div
                onClick={() => {
                  startCameraAndMic();
                  setCameraChecked(true);
                  setMicChecked(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-muted/40 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">1. Webcam & Microphone Access</div>
                    <div className="text-muted-foreground text-[11px]">Continuously monitors face centering, noise & illicit objects</div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                      cameraChecked
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {cameraChecked ? 'Verified ✓' : 'Allow Camera'}
                  </div>
                </div>
                {cameraChecked && (
                  <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden bg-black border border-border">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-mono flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      Camera Active
                    </div>
                  </div>
                )}
              </div>

              <div
                onClick={() => {
                  enterFullscreen();
                  setFullscreenChecked(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between cursor-pointer hover:border-border"
              >
                <div>
                  <div className="font-semibold text-foreground">2. Fullscreen Lock Enforcement</div>
                  <div className="text-muted-foreground text-[11px]">Exiting fullscreen flags an integrity violation</div>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-muted font-bold text-primary">
                  {fullscreenChecked ? 'Locked ✓' : 'Enable Fullscreen'}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-foreground space-y-1">
                <div className="font-semibold text-rose-300">Strict Anti-Cheating Protocol</div>
                <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                  <li>AI illicit object detection (cell phones, cheat notes, headphones, multi-person)</li>
                  <li>Tab switching, window blur & minimizing are tracked in real-time</li>
                  <li>Copy & pasting code from outside is blocked and logged</li>
                  <li>Spectators & referees will watch your code stream live</li>
                </ul>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 bg-muted border-border"
                />
                <span className="text-foreground font-medium text-xs">
                  I agree to the proctored assessment honor code
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                disabled={!policyAccepted}
                onClick={() => {
                  setIsVerified(true);
                  enterFullscreen();
                  startCameraAndMic();
                  if (socketRef.current?.connected) {
                    socketRef.current.emit('battle:join', {
                      battleCode: codeParam,
                      role,
                      username,
                      questionSlug: searchParams.get('slug') || undefined,
                      mode: searchParams.get('mode') || (codeParam.toUpperCase().startsWith('ROYAL') || codeParam.toUpperCase().startsWith('BR-') ? 'battle_royale' : undefined),
                    });
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all shadow-lg shadow-primary/25 disabled:opacity-40"
              >
                Enter Proctored Arena
              </button>
              <button
                onClick={() => {
                  setIsVerified(true);
                  if (socketRef.current?.connected) {
                    socketRef.current.emit('battle:join', {
                      battleCode: codeParam,
                      role,
                      username,
                      questionSlug: searchParams.get('slug') || undefined,
                      mode: searchParams.get('mode') || (codeParam.toUpperCase().startsWith('ROYAL') || codeParam.toUpperCase().startsWith('BR-') ? 'battle_royale' : undefined),
                    });
                  }
                }}
                className="py-3 px-4 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border font-medium text-xs transition-colors"
                title="Join battle immediately without webcam permissions"
              >
                Quick Enter (Casual)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BATTLE ROYALE / DUEL CONCLUSION MODAL ================= */}
      {(matchWinner || (isBattleRoyale && currentPlayer?.status === 'eliminated')) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 motion-enter">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl text-center space-y-4 card-elevated">
            {matchWinner === username || currentPlayer?.status === 'champion' ? (
              /* #1 1ST PLACE CHAMPION */
              <div className="space-y-4">
                <div className="size-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-md shadow-amber-500/20">
                  <Trophy className="size-8" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs uppercase tracking-widest border border-amber-500/30 mb-2">
                    🏆 MATCH WINNER &amp; TOURNAMENT CHAMPION!
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    🏆 1ST PLACE CHAMPION
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    You cleared all benchmark stages and out-coded all contenders in the arena!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Placement</div>
                    <div className="text-base font-bold text-amber-400">#1 / {totalCombatants}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Benchmarks Solved</div>
                    <div className="text-base font-bold text-foreground">{currentPlayer?.kills || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Rating Gain</div>
                    <div className="text-base font-bold text-emerald-400">+45 ELO</div>
                  </div>
                </div>
              </div>
            ) : currentPlayer?.status === 'eliminated' && !matchWinner ? (
              /* PLAYER ELIMINATED WHILE MATCH CONTINUES */
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                  <Skull className="w-8 h-8" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs uppercase tracking-widest border border-rose-500/30 mb-2">
                    ⚠️ STAGE CUTOFF ELIMINATION
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">
                    STAGE CUTOFF REACHED
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cause: {currentPlayer?.eliminatedBy || 'Phase Cutoff Time Limit'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono">
                  <span className="text-muted-foreground">Final Placement: </span>
                  <strong className="text-foreground text-sm font-bold">#{currentPlayer?.placement || 2} / {totalCombatants}</strong>
                </div>
              </div>
            ) : (
              /* MATCH CONCLUDED BY RIVAL */
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto text-amber-500">
                  <Trophy className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {isBattleRoyale ? 'Knockout Arena Concluded' : 'Match Concluded'}
                  </h2>
                  <p className="text-base text-foreground font-bold mt-1">
                    🏆 {matchWinner} took 1st Place!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All benchmark test cases were passed first with authoritative server verification.
                  </p>
                </div>
              </div>
            )}

            {inspectingOpponent && (
              <div className="text-left mt-3 p-3 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    Final Submitted Code ({opponentPlayer?.username || 'Opponent'}):
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {revealedSolutions[opponentPlayer?.userId]?.language || 'cpp'}
                  </span>
                </div>
                <pre className="p-3 bg-muted/60 rounded-lg text-xs font-mono max-h-52 overflow-y-auto whitespace-pre-wrap text-foreground border border-border/50">
                  {revealedSolutions[opponentPlayer?.userId]?.code ||
                    opponentStreams[opponentPlayer?.userId]?.code ||
                    '// Code was evaluated directly on the backend runner'}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/lobby"
                className="px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Back to Lobby
              </Link>
              {currentPlayer?.status === 'eliminated' && role === 'fighter' && (
                <button
                  onClick={() => {
                    setRole('spectator');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors"
                >
                  Spectate Competitors
                </button>
              )}
              {matchWinner && (
                <button
                  onClick={() => setInspectingOpponent((prev) => !prev)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground font-medium text-xs border border-border transition-colors"
                >
                  {inspectingOpponent ? 'Hide Code' : 'Inspect Winning Code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Candidate Proctoring HUD */}
      {false && role === 'fighter' && isVerified && (
        <ProctorWidget
          trustScore={trustScore}
          violations={violations}
          isFullscreen={isFullscreen}
          isCameraActive={isCameraActive}
          isMicActive={isMicActive}
          faceDetected={faceDetected}
          audioLevel={audioLevel}
          videoRef={videoRef}
          detectedObjects={detectedObjects}
          faceBbox={faceBbox}
          candidateCentering={candidateCentering}
          onEnterFullscreen={enterFullscreen}
          onExitFullscreen={exitFullscreen}
          onStartCamera={startCameraAndMic}
          onStopCamera={stopCameraAndMic}
          onReconnectCamera={reconnectCamera}
          aiModelStatus={aiModelStatus}
          onSetSensitivity={setAiSensitivity}
          onTriggerIllicit={triggerSimulatedIllicit}
          onClearIllicit={clearSimulatedIllicit}
        />
      )}

      {/* Strict Anti-Cheat Alert Modal */}
      {false && role === 'fighter' && isVerified && (
        <ProctorViolationModal
          message={activeWarning}
          trustScore={trustScore}
          onDismiss={dismissWarning}
          onReEnterFullscreen={enterFullscreen}
        />
      )}
    </div>
  );
}
