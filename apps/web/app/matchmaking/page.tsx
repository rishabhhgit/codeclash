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
  Check,
  AlertCircle,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWsUrl, getApiUrl, getClientAuthToken, getTabSessionId } from '../../lib/api';

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
    name: 'All topics',
    topics: [],
  },
  {
    name: 'Blind 75',
    topics: ['arrays', 'two_pointers', 'sliding_window', 'binary_search', 'trees', 'graphs', 'dynamic_programming'],
  },
  {
    name: 'Data structures',
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

    const tabId = getTabSessionId();

    const socket = io(getWsUrl(), {
      auth: { token, tabId },
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
      setError(data.message || 'Matchmaking timed out. No opponent found in queue.');
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Active matchmaking polling fallback while searching
  useEffect(() => {
    if (!isSearching || matchedData) return;
    const tabId = getTabSessionId();
    const token = getClientAuthToken();
    const apiUrl = getApiUrl();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/matchmaking/status?tabId=${encodeURIComponent(tabId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tab-id': tabId,
          },
        });
        const d = await res.json();
        if (d.success && d.data?.status === 'matched') {
          const match = d.data;
          setMatchedData(match);
          setIsSearching(false);
          const code = match.battleCode || match.code;
          const slug = match.questionSlug || match.slug || '';
          setTimeout(() => {
            router.push(`/battle/${code}${slug ? `?slug=${slug}` : ''}`);
          }, 1600);
        } else if (d.success && typeof d.data?.queueSize === 'number') {
          setQueueCount(d.data.queueSize);
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [isSearching, matchedData, router]);

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
    const tabId = getTabSessionId();
    const apiUrl = getApiUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/matchmaking/${mode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-tab-id': tabId,
          },
          body: JSON.stringify({
            preferredDifficulty: difficulty,
            preferredTopics: selectedTopics,
            mode,
            tabId,
            force: true,
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
      setError('Unable to reach matchmaking server. Please check connection.');
      setIsSearching(false);
    }
  };

  const handleCancelMatchmaking = async () => {
    const token = getClientAuthToken();
    const tabId = getTabSessionId();
    const apiUrl = getApiUrl();
    try {
      await fetch(
        `${apiUrl}/api/matchmaking/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-tab-id': tabId,
          },
          body: JSON.stringify({ tabId }),
        }
      );
    } catch {}
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

  const userRating = currentUser?.rating || 1000;
  const username = currentUser?.username || 'Challenger';
  const isGuest = currentUser?.handle?.toLowerCase().startsWith('guest');

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* Match Found Overlay */}
      <AnimatePresence>
        {matchedData && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.18 }}
              className="bg-card border border-border p-6 sm:p-8 rounded-xl max-w-md w-full text-center space-y-5 shadow-2xl"
            >
              <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Match found</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Room [{matchedData.battleCode}] &middot; Entering synchronized duel
                </p>
              </div>

              {/* Roster cards */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-lg bg-background border border-border space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">You</span>
                  <div className="text-xs font-semibold text-foreground truncate">{username}</div>
                  <div className="text-[11px] font-mono text-muted-foreground tabular-nums">{userRating} Elo</div>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">Opponent</span>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {matchedData.opponent?.username || 'Challenger'}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground tabular-nums">
                    {matchedData.opponent?.rating || 1000} Elo
                  </div>
                </div>
              </div>

              {/* Connecting progress indicator */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Connecting to sandbox</span>
                  <span className="text-emerald-500 font-medium">Ready</span>
                </div>
                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                    className="bg-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Find an opponent
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Synchronized 1v1 battle matching. Both combatants face the same problem, timer, and hidden test benchmarks.
          </p>

          {/* User Dossier Meta */}
          <div className="inline-flex items-center gap-2 pt-1 text-xs font-mono text-muted-foreground">
            <span>Fighter:</span>
            <span className="font-semibold text-foreground">@{username}</span>
            <span>&middot;</span>
            <span className="text-foreground font-semibold tabular-nums">{userRating}</span>
            <span>Elo</span>
            {isGuest && (
              <>
                <span>&middot;</span>
                <Link href="/auth/register" className="text-primary hover:underline">
                  Save stats &rarr;
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Searching Queue Screen vs Setup Card */}
        {isSearching ? (
          <div className="p-8 sm:p-10 text-center space-y-6 rounded-xl border border-border bg-card shadow-sm">
            {/* Minimalist Stopwatch & Scanner Ring */}
            <div className="relative size-36 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-border" />
              <div className="absolute inset-2 rounded-full border border-border/60" />
              <div className="absolute inset-0 rounded-full border-t border-primary animate-spin" />

              <div className="relative z-10 flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-foreground">
                  {formatTime(elapsed)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
                  Queue time
                </span>
              </div>
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <div className="text-sm font-semibold text-foreground">
                Scanning competitive queue
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Matching skill bracket &plusmn;{currentRange} Elo ({Math.max(0, userRating - currentRange)} &ndash; {userRating + currentRange})
              </p>
            </div>

            {/* Current Search Specs */}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs font-mono text-left">
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Mode</span>
                <span className="font-semibold text-foreground capitalize">{mode}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Difficulty</span>
                <span className="font-semibold text-foreground capitalize">{difficulty}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Topics</span>
                <span className="font-semibold text-foreground">
                  {selectedTopics.length > 0 ? `${selectedTopics.length} selected` : 'All'}
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleCancelMatchmaking}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <X className="size-3.5" />
                <span>Cancel queue (Esc)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-7 space-y-6 rounded-xl border border-border bg-card shadow-sm">
            {/* Mode Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Game mode</span>
                <span className="text-muted-foreground">
                  {mode === 'ranked' ? 'Strict Elo stakes' : mode === 'quick' ? 'Fast matching' : 'Unranked sparring'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Ranked Duel */}
                <button
                  type="button"
                  onClick={() => setMode('ranked')}
                  className={`p-3.5 rounded-lg border text-left transition-colors relative space-y-1 ${
                    mode === 'ranked'
                      ? 'border-foreground/50 bg-secondary/80 text-foreground'
                      : 'border-border bg-background/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Trophy className="size-3.5 text-amber-500" />
                      <span>Ranked Duel</span>
                    </span>
                    {mode === 'ranked' && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Strict Elo skill-bracket combat with rating stakes
                  </p>
                </button>

                {/* Quick Match */}
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`p-3.5 rounded-lg border text-left transition-colors relative space-y-1 ${
                    mode === 'quick'
                      ? 'border-foreground/50 bg-secondary/80 text-foreground'
                      : 'border-border bg-background/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Zap className="size-3.5 text-amber-500" />
                      <span>Quick Match</span>
                    </span>
                    {mode === 'quick' && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Fastest matching across open active fighters
                  </p>
                </button>

                {/* Casual Practice */}
                <button
                  type="button"
                  onClick={() => setMode('casual')}
                  className={`p-3.5 rounded-lg border text-left transition-colors relative space-y-1 ${
                    mode === 'casual'
                      ? 'border-foreground/50 bg-secondary/80 text-foreground'
                      : 'border-border bg-background/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Gamepad2 className="size-3.5 text-muted-foreground" />
                      <span>Casual Practice</span>
                    </span>
                    {mode === 'casual' && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Zero rating impact, safe unranked sparring
                  </p>
                </button>
              </div>
            </div>

            {/* Target Difficulty Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Target difficulty</span>
                <span className="text-muted-foreground capitalize">
                  {difficulty === 'any' ? 'Any tier (fastest match)' : `${difficulty} tier only`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['any', 'easy', 'medium', 'hard'] as const).map((d) => {
                  const isSelected = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`p-2.5 rounded-lg border text-left transition-colors font-mono text-xs space-y-0.5 ${
                        isSelected
                          ? 'border-foreground/50 bg-secondary/80 text-foreground'
                          : 'border-border bg-background/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize text-foreground">{d}</span>
                        <span
                          className={`size-1.5 rounded-full ${
                            d === 'easy'
                              ? 'bg-emerald-500'
                              : d === 'medium'
                              ? 'bg-amber-500'
                              : d === 'hard'
                              ? 'bg-rose-500'
                              : 'bg-muted-foreground'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        {d === 'easy' ? '10 min' : d === 'medium' ? '15 min' : d === 'hard' ? '25 min' : 'Auto balance'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Filter Chips & Presets */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Topic filters (optional)</span>
                {selectedTopics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTopics([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear filters ({selectedTopics.length})
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-muted-foreground mr-0.5">Presets:</span>
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
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        isCurrent
                          ? 'bg-secondary border-foreground/40 text-foreground font-semibold'
                          : 'bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Topic Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {TOPICS.map((t) => {
                  const isSelected = selectedTopics.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTopic(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-secondary border-foreground/40 text-foreground font-medium'
                          : 'bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected && <Check className="size-3 text-foreground" />}
                      <span>{t.replace(/_/g, ' ')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Queue Button & Info */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleStartMatchmaking}
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Swords className="size-4" />
                <span>Enter competitive queue</span>
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono">
                <span>Avg queue: ~5&ndash;15s</span>
                <span>&middot;</span>
                <span>Strict MMR matching</span>
                <span>&middot;</span>
                <span className="tabular-nums">{queueCount} fighters in queue</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchmakingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center">
          <div className="size-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MatchmakingContent />
    </Suspense>
  );
}
