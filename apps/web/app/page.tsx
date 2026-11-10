'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords,
  ArrowRight,
  Code2,
  Users,
  Play,
  Zap,
  Check,
  Copy,
  Clock,
  ShieldCheck,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { getApiUrl } from '../lib/api';
import { LiveDuelVisualizer } from '../components/home/LiveDuelVisualizer';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface OpenBattle {
  id: string;
  code: string;
  title?: string;
  questionSlug?: string;
  mode: string;
  difficulty: string;
  playerCount: number;
  maxPlayers: number;
  status?: string;
  problem?: {
    title?: string;
    difficulty?: string;
  };
}

interface LobbyData {
  items: OpenBattle[];
  stats: {
    onlinePlayers: number;
    activeBattles: number;
    waitingBattles: number;
  };
}

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [loadingLobby, setLoadingLobby] = useState(true);

  useEffect(() => {
    fetchLobby();
  }, []);

  const fetchLobby = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/battles/lobby/public`);
      const data = await res.json();
      if (data.success && data.data) {
        setLobbyData(data.data);
      }
    } catch {
      // Backend offline or unreachable
    } finally {
      setLoadingLobby(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = roomCode.trim();
    if (!clean) return;

    if (clean.includes('/battle/')) {
      const match = clean.match(/\/battle\/([A-Za-z0-9_-]+)/);
      if (match) clean = match[1];
    }
    clean = clean.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean) {
      router.push(`/battle/${clean}?role=fighter`);
    }
  };

  const handleCreateDemo = () => {
    if (typeof window !== 'undefined') {
      const random = 'DUEL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const url = `${window.location.origin}/battle/${random}`;
      navigator.clipboard.writeText(url);
      setCopiedDemo(true);
      setTimeout(() => setCopiedDemo(false), 2000);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="py-14 sm:py-20 border-b border-border/70">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Left Content Column */}
            <motion.div variants={itemVariants} className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary border border-border/80 text-xs font-mono text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Competitive algorithm arena</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.12]">
                  Real-time 1v1 coding duels on LeetCode problems
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  Two programmers receive the same algorithmic problem. Synchronized clocks start together. First to clear all hidden benchmarks claims Elo rating.
                </p>
              </div>

              {/* Primary & Secondary Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/matchmaking?mode=ranked&difficulty=medium"
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors text-center inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="size-4 fill-current" />
                  <span>Enter ranked queue</span>
                </Link>

                <Link
                  href="/roadmap"
                  className="px-5 py-2.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border font-medium text-sm transition-colors text-center inline-flex items-center justify-center gap-2"
                >
                  <Layers className="size-4 text-muted-foreground" />
                  <span>Explore practice roadmap</span>
                </Link>
              </div>

              {/* Room Code Entry & Instant Invite */}
              <div className="pt-3 border-t border-border/60 space-y-2.5">
                <form onSubmit={handleJoinByCode} className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="Room code or invite link"
                      className="w-full pl-3 pr-8 py-2 rounded-lg bg-card border border-border text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
                      ↵
                    </kbd>
                  </div>

                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border font-medium text-xs transition-colors shrink-0"
                  >
                    Join
                  </button>

                  <Link
                    href="/battle/create"
                    className="px-3.5 py-2 rounded-lg bg-card hover:bg-muted text-foreground border border-border font-medium text-xs transition-colors shrink-0"
                  >
                    Host match
                  </Link>
                </form>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={handleCreateDemo}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {copiedDemo ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Link copied to clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-muted-foreground" />
                        <span>Copy private duel link for a friend</span>
                      </>
                    )}
                  </button>
                  <span>&middot;</span>
                  <Link href="/auth/register" className="hover:text-foreground transition-colors font-medium text-amber-500">
                    Connect LeetCode handle
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right Product Hero: Authentic Interactive Duel Simulator */}
            <motion.div variants={itemVariants} className="lg:col-span-6">
              <LiveDuelVisualizer />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Architectural Telemetry Bar */}
      <section className="py-8 border-b border-border/70 bg-muted/15">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1">
              <div className="text-xs font-mono text-muted-foreground">Problems</div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">3,129</div>
              <p className="text-xs text-muted-foreground">Curated algorithmic catalog with full test cases</p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-muted-foreground">Stress tests</div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">50 to 100</div>
              <p className="text-xs text-muted-foreground">Hidden test cases prevent hardcoded shortcuts</p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-muted-foreground">Rating engine</div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">Elo Glicko-2</div>
              <p className="text-xs text-muted-foreground">Instant rating adjustments on verified verdict</p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-muted-foreground">LeetCode sync</div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground tabular-nums">Live API</div>
              <p className="text-xs text-muted-foreground">Mirror contest ranks and verified solved counters</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Active Matches */}
      <section className="py-12 border-b border-border/70">
        <div className="container mx-auto px-4 max-w-6xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Live arena matches
              </h2>
            </div>
            <Link href="/lobby" className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
              <span>View all lobbies</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {loadingLobby ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              Fetching active matches...
            </div>
          ) : !lobbyData?.items || lobbyData.items.length === 0 ? (
            <div className="p-6 rounded-xl border border-border/70 bg-card text-center space-y-2">
              <div className="text-xs font-semibold text-foreground">No matches waiting right now</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Start a ranked queue or create a custom battle room to invite peers.
              </p>
              <div className="pt-2">
                <Link
                  href="/battle/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Swords className="size-3.5" />
                  <span>Host match</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {lobbyData.items.slice(0, 3).map((room) => {
                  const title = room.problem?.title || room.title || 'Algorithmic Duel';
                  const diff = room.difficulty || 'medium';
                  const diffColor =
                    diff.toLowerCase() === 'hard'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      : diff.toLowerCase() === 'easy'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                  return (
                    <motion.div
                      key={room.code}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-3.5 rounded-xl border border-border/80 bg-card flex items-center justify-between text-xs gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-semibold text-foreground">{room.code}</span>
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${diffColor}`}>
                            {diff}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate" title={title}>
                          {title}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {room.playerCount} / {room.maxPlayers} fighters
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/battle/${room.code}?role=fighter`}
                          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors"
                        >
                          Fight
                        </Link>
                        <Link
                          href={`/battle/${room.code}?role=spectator`}
                          className="px-2.5 py-1.5 rounded-md bg-secondary text-foreground text-xs hover:bg-muted transition-colors border border-border"
                        >
                          Watch
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Problem Tracks Section */}
      <section className="py-12 md:py-16 border-b border-border/70">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Curated problem tracks
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Practice verified problem patterns with full solutions and benchmark suites.
              </p>
            </div>
            <Link
              href="/problems"
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <span>Browse 3,129 problems</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/problems?category=top75" className="block group">
              <div className="p-5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      Top 75 core
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                      Essential
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Foundational patterns: arrays, two pointers, sliding window, and binary trees.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-3 border-t border-border/60">
                  <span className="tabular-nums">75 problems</span>
                  <span className="text-foreground font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Start track &rarr;
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/problems?category=core150" className="block group">
              <div className="p-5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      Core 150 syllabus
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Full interview scope: heaps, graphs, topological sort, dynamic programming, and intervals.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-3 border-t border-border/60">
                  <span className="tabular-nums">150 problems</span>
                  <span className="text-foreground font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Start track &rarr;
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/problems?category=mastery250" className="block group sm:col-span-2 lg:col-span-1">
              <div className="p-5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      Mastery 250
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                      Advanced
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Competitive algorithmic depth: monotonic queues, segment trees, and multi-state dynamic programming.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-3 border-t border-border/60">
                  <span className="tabular-nums">250 problems</span>
                  <span className="text-foreground font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Start track &rarr;
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Quiet Footer */}
      <footer className="py-8 border-t border-border/70 mt-auto text-xs text-muted-foreground">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-md bg-secondary border border-border text-foreground flex items-center justify-center">
              <Swords className="size-3" />
            </span>
            <span className="font-semibold text-foreground">CodeClash</span>
            <span>&middot;</span>
            <span>Real-time multiplayer coding arena</span>
          </div>

          <div className="flex items-center gap-4 font-normal">
            <Link href="/problems" className="hover:text-foreground transition-colors">Problems</Link>
            <Link href="/lobby" className="hover:text-foreground transition-colors">Arena</Link>
            <Link href="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link>
            <Link href="/rankings" className="hover:text-foreground transition-colors">Leaderboard</Link>
            <Link href="/leetcode-profiles" className="hover:text-foreground transition-colors">Profiles</Link>
            <Link href="/battle/create" className="hover:text-foreground transition-colors">Host match</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
