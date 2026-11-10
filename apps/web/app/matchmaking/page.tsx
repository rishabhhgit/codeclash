'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import {
  Zap,
  Trophy,
  Gamepad2,
  Swords,
  Shield,
  Radar,
  CheckCircle2,
  X,
  Flame,
  Check,
  User,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWsUrl } from '../../lib/api';
import { SpotlightCard } from '../../components/ui/SpotlightCard';

function getClientAuthToken(): string {
  if (typeof window === 'undefined') return 'guest-token';
  let token = localStorage.getItem('token');
  if (!token) {
    let guestId = localStorage.getItem('codeclash_guest_id');
    if (!guestId) {
      guestId = 'guest-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('codeclash_guest_id', guestId);
    }
    token = guestId;
  }
  return token;
}

const TOPICS = [
  'arrays',
  'strings',
  'linked_lists',
  'binary_search',
  'two_pointers',
  'sliding_window',
  'trees',
  'dynamic_programming',
  'graphs',
  'greedy',
  'stacks',
  'hash_map',
];

const PRESETS = [
  {
    name: 'All Topics',
    topics: [],
  },
  {
    name: 'Blind 75 Core',
    topics: ['arrays', 'two_pointers', 'sliding_window', 'binary_search', 'trees', 'graphs', 'dynamic_programming'],
  },
  {
    name: 'Data Structures',
    topics: ['arrays', 'strings', 'linked_lists', 'stacks', 'hash_map', 'trees'],
  },
  {
    name: 'Algorithms',
    topics: ['two_pointers', 'sliding_window', 'binary_search', 'greedy', 'dynamic_programming', 'graphs'],
  },
];

function MatchmakingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socketRef = useRef<Socket | null>(null);

  const initialMode = (searchParams.get('mode') as 'quick' | 'ranked' | 'casual') || 'ranked';
  const initialDifficulty = (searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | 'any') || 'any';
  const initialTopic = searchParams.get('topic');

  const [mode, setMode] = useState<'quick' | 'ranked' | 'casual'>(
    ['quick', 'ranked', 'casual'].includes(initialMode) ? initialMode : 'ranked'
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'any'>(
    ['easy', 'medium', 'hard', 'any'].includes(initialDifficulty) ? initialDifficulty : 'any'
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialTopic && TOPICS.includes(initialTopic) ? [initialTopic] : []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [matchedData, setMatchedData] = useState<any>(null);
  const [queueCount, setQueueCount] = useState<number>(3);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Derive expanding search window based on elapsed time
  const currentRange = useMemo(() => {
    return Math.min(500, 150 + Math.floor(elapsed / 4) * 50);
  }, [elapsed]);

  // Fetch current user details on mount
  useEffect(() => {
    const token = getClientAuthToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setCurrentUser(d.data);
        }
      })
      .catch(() => {});
  }, []);

  // Socket IO matchmaking listener
  useEffect(() => {
    const token = getClientAuthToken();

    const socket = io(getWsUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on('match:found', (data: any) => {
      const code = data.battleCode || data.battle?.code || data.code;
      const slug = data.questionSlug || data.slug || '';
      setMatchedData(data);
      setIsSearching(false);

      setTimeout(() => {
        router.push(`/battle/${code}${slug ? `?slug=${slug}` : ''}`);
      }, 2000);
    });

    socket.on('match:timeout', (data: any) => {
      setIsSearching(false);
      setError(data.message || 'Matchmaking timed out. No opponent found.');
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Stopwatch timer when searching
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Escape key to cancel queue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearching) {
        handleCancelMatchmaking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearching]);

  const handleStartMatchmaking = async () => {
    setError('');
    setIsSearching(true);
    setElapsed(0);
    const token = getClientAuthToken();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matchmaking/${mode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferredDifficulty: difficulty,
            preferredTopics: selectedTopics,
            mode,
            maxWaitTime: 90,
          }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to enter matchmaking queue');
        setIsSearching(false);
      } else if (data.data?.status === 'matched') {
        const code = data.data.battleCode;
        const slug = data.data.questionSlug || '';
        setMatchedData(data.data);
        setIsSearching(false);
        setTimeout(() => {
          router.push(`/battle/${code}${slug ? `?slug=${slug}` : ''}`);
        }, 2000);
      } else if (data.data?.queueSize) {
        setQueueCount(data.data.queueSize);
      }
    } catch {
      setError('Unable to reach matchmaking server. Please check your network.');
      setIsSearching(false);
    }
  };

  const handleCancelMatchmaking = async () => {
    const token = getClientAuthToken();
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/matchmaking/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch {
      // Ignored
    }
    setIsSearching(false);
    setElapsed(0);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const applyPreset = (topics: string[]) => {
    setSelectedTopics(topics);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const userRating = currentUser?.rating || 1200;
  const username = currentUser?.username || 'Challenger';
  const isGuest = currentUser?.handle?.toLowerCase().startsWith('guest');

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground py-10 sm:py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 size-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Dramatic Match Found Faceoff Overlay */}
      <AnimatePresence>
        {matchedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border-2 border-emerald-500/50 p-8 sm:p-10 rounded-3xl text-center space-y-7 shadow-2xl max-w-xl w-full relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />

              {/* Title & Badge */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-emerald-400 font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="size-3.5" />
                  <span>Opponent Synchronized</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  MATCH FOUND
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  Room [{matchedData.battleCode}] • Entering Synchronized Arena
                </p>
              </div>

              {/* Faceoff Cards: You vs Challenger */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center">
                {/* You */}
                <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 text-left space-y-2">
                  <div className="text-[10px] uppercase font-mono text-primary font-bold">You</div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-sm text-primary overflow-hidden">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="You" className="size-full object-cover" />
                      ) : (
                        username.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-foreground truncate">{username}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{userRating} Elo</div>
                    </div>
                  </div>
                </div>

                {/* Opponent */}
                <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 text-left space-y-2">
                  <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Opponent</div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-sm text-emerald-400 overflow-hidden">
                      {matchedData.opponent?.avatar ? (
                        <img src={matchedData.opponent.avatar} alt="Opponent" className="size-full object-cover" />
                      ) : (
                        matchedData.opponent?.username?.substring(0, 2).toUpperCase() || 'VS'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {matchedData.opponent?.username || 'Challenger'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {matchedData.opponent?.rating || 1200} Elo
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Launching IDE Sandbox</span>
                  <span className="text-emerald-400 font-bold">Ready</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                    className="bg-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl w-full space-y-7 relative z-10">
        {/* Top Header & Combat Dossier */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/70 text-xs font-semibold text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Competitive Matchmaking Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground text-balance">
            Find an Opponent
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto text-pretty leading-relaxed">
            Synchronized 1v1 battle matching. Both combatants face the same problem, timer, and hidden test benchmarks.
          </p>

          {/* User Combat Status Banner */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-card border border-border/80 shadow-sm text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Fighter:</span>
              <strong className="text-foreground">{username}</strong>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Trophy className="size-3 text-amber-400" />
              <strong className="text-amber-400">{userRating}</strong>
              <span className="text-muted-foreground">Elo</span>
            </div>
            {isGuest && (
              <>
                <span>•</span>
                <Link href="/auth/register" className="text-primary hover:underline font-semibold">
                  Save Stats →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Searching Radar State vs Setup State */}
        {isSearching ? (
          <SpotlightCard className="p-8 sm:p-12 text-center space-y-8 rounded-3xl border-primary/40 shadow-2xl bg-card/90">
            {/* Concentric Radar Scanner */}
            <div className="relative size-48 mx-auto flex items-center justify-center">
              {/* Sonar Ripple Rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-primary/40 pointer-events-none"
                  initial={{ scale: 0.3, opacity: 0.85 }}
                  animate={{ scale: [0.3, 1.35], opacity: [0.85, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Static Range Rings */}
              <div className="absolute inset-0 rounded-full border border-primary/20" />
              <div className="absolute inset-6 rounded-full border border-primary/30" />
              <div className="absolute inset-12 rounded-full border border-primary/40" />

              {/* Radar Sweep Needle */}
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />

              {/* Digital Stopwatch in Center */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-primary tabular-nums tracking-tight">
                  {formatTime(elapsed)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                  Elapsed
                </span>
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-2 max-w-sm mx-auto">
              <div className="text-lg font-bold text-foreground">
                Scanning Competitive Queue...
              </div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                Searching skill band <span className="text-foreground font-bold">±{currentRange} ELO</span> ({Math.max(0, userRating - currentRange)} - {userRating + currentRange})
              </p>
            </div>

            {/* Match Parameters Card */}
            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto text-xs">
              <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-mono font-semibold">Mode</span>
                <span className="font-bold text-foreground capitalize">{mode} Duel</span>
              </div>
              <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-mono font-semibold">Difficulty</span>
                <span className="font-bold text-foreground capitalize">{difficulty}</span>
              </div>
              <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-mono font-semibold">Topics</span>
                <span className="font-bold text-foreground">
                  {selectedTopics.length > 0 ? `${selectedTopics.length} Selected` : 'Any'}
                </span>
              </div>
            </div>

            {/* Cancel Button */}
            <div>
              <button
                type="button"
                onClick={handleCancelMatchmaking}
                className="px-6 py-2.5 rounded-2xl border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
              >
                <X className="size-4" />
                <span>Cancel Queue (Esc)</span>
              </button>
            </div>
          </SpotlightCard>
        ) : (
          <SpotlightCard className="p-6 sm:p-9 space-y-7 sm:space-y-8 rounded-3xl border-border/80 shadow-xl bg-card/85">
            {/* Mode Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Select Game Mode
                </label>
                <span className="text-[11px] font-mono text-primary font-semibold">
                  {mode === 'ranked' ? 'Strict Elo Ranked' : mode === 'quick' ? 'Fast Matching' : 'Unranked Sparring'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Ranked Duel (First / Highlighted) */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => setMode('ranked')}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    mode === 'ranked'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Trophy className="size-4" />
                    </div>
                    {mode === 'ranked' && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500 text-stone-950">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Ranked Duel</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    Strict Elo skill-bracket combat with rating stakes
                  </div>
                </motion.button>

                {/* Quick Match */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => setMode('quick')}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    mode === 'quick'
                      ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Zap className="size-4" />
                    </div>
                    {mode === 'quick' && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-stone-950">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Quick Match</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    Fastest matching across active fighters
                  </div>
                </motion.button>

                {/* Casual Practice */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => setMode('casual')}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    mode === 'casual'
                      ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Gamepad2 className="size-4" />
                    </div>
                    {mode === 'casual' && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-500 text-stone-950">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Casual Practice</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    No rating impact, unranked sparring
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Target Difficulty Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Target Difficulty
                </label>
                <span className="text-[11px] font-mono text-muted-foreground capitalize">
                  {difficulty === 'any' ? 'Any Tier (Fastest Match)' : `${difficulty} Only`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['any', 'easy', 'medium', 'hard'] as const).map((d) => {
                  const isSelected = difficulty === d;
                  return (
                    <motion.button
                      key={d}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={() => setDifficulty(d)}
                      className={`py-3 px-3.5 rounded-2xl border text-xs font-bold capitalize transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? d === 'easy'
                            ? 'border-emerald-500/80 bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/50 shadow-sm'
                            : d === 'medium'
                            ? 'border-amber-500/80 bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/50 shadow-sm'
                            : d === 'hard'
                            ? 'border-rose-500/80 bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/50 shadow-sm'
                            : 'border-primary bg-primary/15 text-primary ring-1 ring-primary shadow-sm'
                          : 'border-border/60 hover:border-foreground/30 bg-background/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${
                            d === 'easy'
                              ? 'bg-emerald-400'
                              : d === 'medium'
                              ? 'bg-amber-400'
                              : d === 'hard'
                              ? 'bg-rose-400'
                              : 'bg-primary'
                          }`}
                        />
                        <span className="font-bold">{d}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {d === 'easy' ? '10 min' : d === 'medium' ? '15 min' : d === 'hard' ? '25 min' : 'Auto balance'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Topic Filter Chips & Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    Topic Filters
                  </label>
                  <span className="text-[11px] text-muted-foreground">(Optional)</span>
                </div>
                {selectedTopics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTopics([])}
                    className="text-[11px] text-primary hover:underline font-medium transition-colors"
                  >
                    Clear selection ({selectedTopics.length})
                  </button>
                )}
              </div>

              {/* Quick Preset Selector */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[11px] font-mono text-muted-foreground mr-1">Presets:</span>
                {PRESETS.map((preset) => {
                  const isCurrent =
                    preset.topics.length === 0
                      ? selectedTopics.length === 0
                      : preset.topics.every((t) => selectedTopics.includes(t)) &&
                        selectedTopics.length === preset.topics.length;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset.topics)}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-primary/15 border-primary/40 text-primary font-bold'
                          : 'bg-secondary/50 border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Individual Topic Pills */}
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => {
                  const isSelected = selectedTopics.includes(t);
                  return (
                    <motion.button
                      key={t}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      onClick={() => toggleTopic(t)}
                      className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm border border-primary ring-1 ring-primary/40'
                          : 'bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80'
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                      <span>{t.replace(/_/g, ' ')}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Start Button & Queue Indicator */}
            <div className="pt-2 space-y-2.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleStartMatchmaking}
                className="btn-radiant-primary w-full py-4 rounded-2xl text-primary-foreground font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Swords className="size-4" />
                <span>Enter Competitive Queue</span>
              </motion.button>
              <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono">
                <span>Avg queue: ~5-15s</span>
                <span>•</span>
                <span>Strict MMR matching</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{queueCount} fighters in queue</span>
              </div>
            </div>
          </SpotlightCard>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs text-muted-foreground">
          <SpotlightCard className="p-4 sm:p-5 flex items-start gap-3 rounded-2xl border-border/80 bg-card/80">
            <div className="size-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="size-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-foreground text-xs">Submission Accuracy Penalties</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                Non-accepted submissions deduct 25 accuracy stamina points
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 sm:p-5 flex items-start gap-3 rounded-2xl border-border/80 bg-card/80">
            <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trophy className="size-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-foreground text-xs">True Skill Elo</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                Authoritative server rating updates upon accepted solutions
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 sm:p-5 flex items-start gap-3 rounded-2xl border-border/80 bg-card/80">
            <div className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="size-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-foreground text-xs">Code Privacy Shield</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                Opponent source code is hidden until match concludes
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}

export default function MatchmakingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MatchmakingContent />
    </Suspense>
  );
}
