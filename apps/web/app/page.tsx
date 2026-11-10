'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Flame,
  ArrowRight,
  Code2,
  Trophy,
  Users,
  Search,
  Hash,
  Eye,
  Plus,
  Play,
  Zap,
  Shield,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getApiUrl } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
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
  const [activeMode, setActiveMode] = useState<'ranked' | 'blitz' | 'knockout'>('ranked');

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
      {/* Centered Hero Section */}
      <section className="border-b border-border/80 relative overflow-hidden py-14 md:py-20">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-0 left-1/3 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-1/3 size-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Multiplayer coding duels.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Two programmers get the same problem. Timers start together. First to pass all hidden benchmarks wins the match and claims Elo rating points.
              </p>
            </motion.div>

            {/* Match Mode Selection Pills */}
            <motion.div variants={itemVariants} className="space-y-3 pt-2 max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
                <span>Select Game Mode</span>
                <span>No sign-up required</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveMode('ranked')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    activeMode === 'ranked'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-foreground">Ranked</span>
                    <Swords className={`size-3.5 ${activeMode === 'ranked' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">10 min &bull; Elo match</div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveMode('blitz')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    activeMode === 'blitz'
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-foreground">Blitz</span>
                    <Zap className={`size-3.5 ${activeMode === 'blitz' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">5 min &bull; Speed race</div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveMode('knockout')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    activeMode === 'knockout'
                      ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-foreground">Knockout</span>
                    <Flame className={`size-3.5 ${activeMode === 'knockout' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">10 players &bull; Royal</div>
                </motion.button>
              </div>

              {/* Primary Launch CTA */}
              <div className="pt-2">
                <Link
                  href={
                    activeMode === 'ranked'
                      ? '/matchmaking?mode=ranked&difficulty=medium'
                      : activeMode === 'blitz'
                      ? '/matchmaking?mode=quick&difficulty=easy'
                      : '/battle/create?mode=battle_royale'
                  }
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  <Play className="size-4 fill-current" />
                  <span>
                    {activeMode === 'ranked'
                      ? 'Find Ranked Match'
                      : activeMode === 'blitz'
                      ? 'Start Blitz Race'
                      : 'Launch Knockout Battle'}
                  </span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Room Code Form & Instant Invite Link */}
            <motion.div variants={itemVariants} className="pt-4 border-t border-border/70 max-w-xl mx-auto space-y-3">
              <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Hash className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter room code or link..."
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-card border border-border text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border font-semibold text-xs transition-colors active:scale-[0.98] shrink-0"
                >
                  Join Room
                </button>

                <Link
                  href="/battle/create"
                  className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs text-center transition-colors hover:bg-muted active:scale-[0.98] shrink-0"
                >
                  Create Custom Room
                </Link>
              </form>

              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={handleCreateDemo}
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                >
                  {copiedDemo ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Duel link copied to clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-primary" />
                      <span>Copy private duel link for friends</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Live Active Arenas Section */}
      <section className="py-10 border-b border-border/80 bg-muted/10">
        <div className="container mx-auto px-4 max-w-6xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Live Arena Matches
              </h2>
            </div>
            <Link href="/lobby" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              View all rooms <ArrowRight className="size-3" />
            </Link>
          </div>

          {loadingLobby ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              Loading active rooms...
            </div>
          ) : !lobbyData?.items || lobbyData.items.length === 0 ? (
            <div className="p-6 rounded-2xl border border-border/80 bg-card text-center space-y-2">
              <div className="text-xs font-semibold text-foreground">No matches waiting right now.</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Start a ranked queue or create a custom battle room to play with peers.
              </p>
              <div className="pt-1">
                <Link
                  href="/battle/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Plus className="size-3.5" />
                  Host Match
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {lobbyData.items.slice(0, 3).map((room) => (
                  <motion.div
                    key={room.code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-foreground">{room.code}</span>
                        <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.2 rounded bg-muted">
                          {room.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {room.title || 'Algorithmic Duel'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/battle/${room.code}?role=fighter`}
                        className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
                      >
                        Fight
                      </Link>
                      <Link
                        href={`/battle/${room.code}?role=spectator`}
                        className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-xs hover:bg-muted transition-colors"
                      >
                        Watch
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Problem Tracks Section */}
      <section className="py-12 md:py-16 border-b border-border/80">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Curated Problem Tracks
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Practice verified problem patterns with full solutions and benchmark suites.
              </p>
            </div>
            <Link
              href="/problems"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Browse 3,129 problems &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div whileHover={{ y: -3 }} className="h-full">
              <Link href="/problems?category=top75" className="block h-full group">
                <SpotlightCard
                  className="p-5 h-full flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors"
                  spotlightColor="rgba(16, 185, 129, 0.12)"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        Top 75 Core
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                        Essential
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Foundational patterns: arrays, two pointers, sliding window, and trees.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                    <span>75 Problems</span>
                    <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Start Track &rarr;
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="h-full">
              <Link href="/problems?category=core150" className="block h-full group">
                <SpotlightCard
                  className="p-5 h-full flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors"
                  spotlightColor="rgba(59, 130, 246, 0.12)"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        Core 150 Syllabus
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        Comprehensive
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Full interview scope: binary search trees, heaps, graphs, topological sort, and DP.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                    <span>150 Problems</span>
                    <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Start Track &rarr;
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="h-full sm:col-span-2 lg:col-span-1">
              <Link href="/problems?category=mastery250" className="block h-full group">
                <SpotlightCard
                  className="p-5 h-full flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
                  spotlightColor="rgba(168, 85, 247, 0.12)"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        Mastery 250
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                        Advanced
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Advanced algorithms: monotonic queues, segment trees, and multi-dimensional state DP.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                    <span>250 Problems</span>
                    <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Start Track &rarr;
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-8 border-t border-border/80 mt-auto text-xs text-muted-foreground">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">CodeClash</span>
            <span>&middot;</span>
            <span>Real-time multiplayer coding arena</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/problems" className="hover:text-foreground transition-colors">Problems</Link>
            <Link href="/lobby" className="hover:text-foreground transition-colors">Arena</Link>
            <Link href="/rankings" className="hover:text-foreground transition-colors">Leaderboard</Link>
            <Link href="/battle/create" className="hover:text-foreground transition-colors">Host Match</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
