'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Zap, Trophy, Gamepad2, Swords, Shield, Radar, CheckCircle2, X, Flame } from 'lucide-react';
import { getWsUrl } from '../../lib/api';

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
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground p-4 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Match Found Overlay */}
      {matchedData && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card border border-emerald-500/40 p-8 rounded-2xl text-center space-y-6 shadow-2xl max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
                Opponent Verified
              </div>
              <h2 className="text-2xl font-black text-foreground">MATCH FOUND</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Entering 1v1 Battle Arena <span className="font-mono text-foreground font-semibold">[{matchedData.battleCode}]</span>
              </p>
            </div>

            {matchedData.opponent && (
              <div className="bg-secondary/40 border border-border/60 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-sm text-primary">
                    {matchedData.opponent.username?.substring(0, 2).toUpperCase() || 'VS'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">{matchedData.opponent.username || 'Challenger'}</div>
                    <div className="text-xs text-muted-foreground">Rating: {matchedData.opponent.rating || 1200}</div>
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
              <div className="bg-emerald-500 h-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full space-y-6 relative z-10">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs font-medium text-muted-foreground">
            <Radar className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Authoritative Real-Time 1v1 Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Competitive Matchmaking</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Queue into instantaneous skill-ranked battles. Test your algorithmic speed, solve clean, and climb the global ladder.
          </p>
        </div>

        {/* Searching Radar State vs Setup State */}
        {isSearching ? (
          <div className="bg-card border border-primary/30 rounded-2xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
              {/* Mid ring */}
              <div className="absolute inset-4 rounded-full border border-primary/30 animate-pulse" />
              {/* Inner ring */}
              <div className="absolute inset-8 rounded-full border border-primary/40" />
              {/* Radar sweep */}
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <div className="relative text-2xl font-black font-mono text-primary">
                {formatTime(elapsed)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-bold text-foreground">Scanning Competitive Queue...</div>
              <div className="text-xs text-muted-foreground font-mono">
                Searching skill band ±{currentRange} ELO • {mode.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-xs">
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/40 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Mode</span>
                <span className="font-semibold text-foreground capitalize">{mode} Duel</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/40 text-left">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Difficulty</span>
                <span className="font-semibold text-foreground capitalize">{difficulty}</span>
              </div>
            </div>

            <button
              onClick={handleCancelMatchmaking}
              className="px-6 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Cancel Queue
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Mode Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Game Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'quick'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-foreground">Quick Match</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Fastest matching across active fighters</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('ranked')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'ranked'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-foreground">Ranked Duel</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Strict ELO rating skill-bracket combat</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('casual')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'casual'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/60 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-foreground">Casual Practice</div>
                  <div className="text-xs text-muted-foreground mt-0.5">No rating impact, unranked sparring</div>
                </button>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {(['any', 'easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                      difficulty === d
                        ? d === 'easy'
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                          : d === 'medium'
                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                          : d === 'hard'
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-400'
                          : 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 hover:border-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Topics */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic Filters (Optional)</label>
                {selectedTopics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTopics([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Clear selection ({selectedTopics.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTopic(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedTopics.includes(t)
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'bg-secondary/50 hover:bg-secondary text-muted-foreground border border-border/40'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartMatchmaking}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              Find Opponent
            </button>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-xl border border-border/40 bg-card/40 flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Submission Accuracy Penalties</div>
              <div>Non-accepted submissions deduct 25 accuracy stamina</div>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-border/40 bg-card/40 flex items-start gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-foreground">True Skill ELO</div>
              <div>Authoritative server rating updates upon accepted solutions</div>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-border/40 bg-card/40 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Code Privacy Shield</div>
              <div>Opponent source is hidden until match concludes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
