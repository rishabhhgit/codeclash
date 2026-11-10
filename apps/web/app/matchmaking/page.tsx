'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Zap, Trophy, Gamepad2, Swords, Shield, Radar, CheckCircle2, X, Flame, Check } from 'lucide-react';
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
  'arrays', 'strings', 'linked_lists', 'binary_search', 'two_pointers',
  'sliding_window', 'trees', 'dynamic_programming', 'graphs', 'greedy',
  'stacks', 'hash_map',
];

export default function MatchmakingPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [mode, setMode] = useState<'quick' | 'ranked' | 'casual'>('quick');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'any'>('any');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [matchedData, setMatchedData] = useState<any>(null);
  const [queueCount, setQueueCount] = useState<number>(1);

  // Derive expanding search window based on elapsed time
  const currentRange = useMemo(() => {
    return Math.min(500, 150 + Math.floor(elapsed / 5) * 50);
  }, [elapsed]);

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
      }, 1600);
    });

    socket.on('match:timeout', (data: any) => {
      setIsSearching(false);
      setError(data.message || 'Matchmaking timed out. No opponent found.');
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
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
        }, 1600);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background text-foreground py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Match Found Overlay */}
      <AnimatePresence>
        {matchedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-emerald-500/40 p-8 rounded-3xl text-center space-y-6 shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                className="size-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
              >
                <CheckCircle2 className="size-8" />
              </motion.div>
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
                  Opponent Verified
                </div>
                <h2 className="text-2xl font-black text-foreground">MATCH FOUND</h2>
                <p className="text-xs text-muted-foreground mt-1 text-pretty">
                  Entering 1v1 Battle Arena <span className="font-mono text-foreground font-semibold">[{matchedData.battleCode}]</span>
                </p>
              </div>

              {matchedData.opponent && (
                <div className="bg-secondary/40 border border-border/60 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-sm text-primary">
                      {matchedData.opponent.username?.substring(0, 2).toUpperCase() || 'VS'}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-foreground">{matchedData.opponent.username || 'Challenger'}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">Rating: {matchedData.opponent.rating || 1200}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                      Ready
                    </span>
                  </div>
                </div>
              )}

              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="bg-emerald-500 h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl w-full space-y-8 relative z-10">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs font-semibold text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ranked Matchmaking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Find an Opponent
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto text-pretty leading-relaxed">
            Pair with an opponent near your Elo rating in seconds. Both get the same problem and timer.
          </p>
        </div>

        {/* Searching Radar State vs Setup State */}
        {isSearching ? (
          <div className="bg-card border border-primary/30 rounded-3xl p-8 sm:p-12 text-center space-y-7 shadow-xl relative overflow-hidden">
            <div className="relative size-44 mx-auto flex items-center justify-center">
              {/* Expanding sonar ripple rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-primary/40 pointer-events-none"
                  initial={{ scale: 0.35, opacity: 0.8 }}
                  animate={{ scale: [0.35, 1.25], opacity: [0.8, 0] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: i * 0.7,
                    ease: 'easeOut',
                  }}
                />
              ))}
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-primary/25" />
              {/* Mid ring */}
              <div className="absolute inset-5 rounded-full border border-primary/35" />
              {/* Inner ring */}
              <div className="absolute inset-10 rounded-full border border-primary/45" />
              {/* Radar sweep */}
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <div className="relative z-10 text-2xl font-black font-mono text-primary tabular-nums">
                {formatTime(elapsed)}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-lg font-bold text-foreground">Scanning Competitive Queue...</div>
              <div className="text-xs text-muted-foreground font-mono">
                Searching skill band ±{currentRange} ELO • {mode.toUpperCase()} DUEL
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Mode</span>
                <span className="font-semibold text-foreground capitalize">{mode} Duel</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Difficulty</span>
                <span className="font-semibold text-foreground capitalize">{difficulty}</span>
              </div>
            </div>

            <button
              onClick={handleCancelMatchmaking}
              className="px-6 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <X className="size-4" />
              <span>Cancel Queue</span>
            </button>
          </div>
        ) : (
          <SpotlightCard className="p-6 sm:p-9 space-y-7 sm:space-y-8 rounded-3xl border-border/80 shadow-xl bg-card/85">
            {/* Mode Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Select Game Mode
                </label>
                <span className="text-[11px] font-mono text-primary font-semibold">
                  {mode === 'quick' ? 'Fast Matching' : mode === 'ranked' ? 'Elo Ranked' : 'Casual Practice'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Quick Match */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => setMode('quick')}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative ${
                    mode === 'quick'
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                    <Zap className="size-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Quick Match</span>
                    {mode === 'quick' && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    Fastest matching across active fighters
                  </div>
                </motion.button>

                {/* Ranked Duel */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => setMode('ranked')}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative ${
                    mode === 'ranked'
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                    <Trophy className="size-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Ranked Duel</span>
                    {mode === 'ranked' && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    Strict Elo rating skill-bracket combat
                  </div>
                </motion.button>

                {/* Casual Practice */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => setMode('casual')}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative ${
                    mode === 'casual'
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                    <Gamepad2 className="size-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Casual Practice</span>
                    {mode === 'casual' && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    No rating impact, unranked sparring
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Target Difficulty
                </label>
                <span className="text-[11px] font-mono text-muted-foreground capitalize">
                  {difficulty === 'any' ? 'Any Difficulty Tier' : `${difficulty} Only`}
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
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? d === 'easy'
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 shadow-sm'
                            : d === 'medium'
                            ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/50 shadow-sm'
                            : d === 'hard'
                            ? 'border-rose-500/60 bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/50 shadow-sm'
                            : 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm'
                          : 'border-border/60 hover:border-foreground/30 bg-background/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          d === 'easy'
                            ? 'bg-emerald-400'
                            : d === 'medium'
                            ? 'bg-amber-400'
                            : d === 'hard'
                            ? 'bg-rose-400'
                            : 'bg-primary'
                        }`}
                      />
                      <span>{d}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Topic Filters */}
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

              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => {
                  const isSelected = selectedTopics.includes(t);
                  return (
                    <motion.button
                      key={t}
                      type="button"
                      whileHover={{ scale: 1.04 }}
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
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            {/* Start Button & Spaced Container */}
            <div className="pt-2 space-y-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleStartMatchmaking}
                className="btn-radiant-primary w-full py-4 rounded-2xl text-primary-foreground font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Swords className="size-4" />
                <span>Find Opponent</span>
              </motion.button>
              <p className="text-[11px] text-center text-muted-foreground font-mono">
                Average wait: ~5-15s • Matched by Elo rating &amp; problem criteria
              </p>
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
                Non-accepted submissions deduct 25 accuracy stamina
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
              <Zap className="size-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-foreground text-xs">Code Privacy Shield</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                Opponent source is hidden until match concludes
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
