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
  Zap,
  Shield,
  Check,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { getApiUrl } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';

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
  topPlayers: Array<{
    id: string;
    username: string;
    rating: number;
    rank: string;
    wins: number;
    winStreak: number;
  }>;
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
      // Backend quiet
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
      {/* Hero: Direct, Action-Oriented */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left: Value Proposition and Intent */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  Multiplayer coding duels.
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Two coders get the same problem. Clocks start together. First to pass all hidden benchmarks wins the match and claims Elo rating points.
                </p>
              </div>

              {/* Quick Play Matchmaking Grid (Lichess style) */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  Quick Pairing
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <Link
                    href="/matchmaking?mode=quick&difficulty=easy"
                    className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/40 transition-colors active:scale-[0.98] group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-foreground">5 min Blitz</span>
                      <Zap className="size-3.5 text-amber-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">Easy / Medium warmup</div>
                  </Link>

                  <Link
                    href="/matchmaking?mode=ranked&difficulty=medium"
                    className="p-3.5 rounded-xl border border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-colors active:scale-[0.98] group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-primary">10 min Ranked</span>
                      <Swords className="size-3.5 text-primary" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">Standard Elo duel</div>
                  </Link>

                  <Link
                    href="/battle/create?mode=battle_royale"
                    className="p-3.5 rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-muted/40 transition-colors active:scale-[0.98] group col-span-2 sm:col-span-1"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-foreground">Knockout</span>
                      <Flame className="size-3.5 text-orange-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">Up to 10 players</div>
                  </Link>
                </div>
              </div>

              {/* Inline Room Code Input */}
              <div className="pt-1">
                <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
                  <div className="relative flex-1">
                    <Hash className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="Room code (e.g. DUEL-9X7B) or link"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-card border border-border text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-colors hover:bg-primary/90 active:scale-[0.98] shrink-0"
                  >
                    Join Room
                  </button>
                  <Link
                    href="/battle/create"
                    className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground font-semibold text-xs text-center transition-colors hover:bg-muted active:scale-[0.98] shrink-0"
                  >
                    Host Battle
                  </Link>
                </form>

                <div className="flex items-center gap-4 mt-2.5 text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={handleCreateDemo}
                    className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    <Copy className="size-3 text-primary" />
                    <span>{copiedDemo ? 'Demo link copied!' : 'Generate invite link'}</span>
                  </button>
                  <span>&middot;</span>
                  <span>Instant drop-in, no sign-up required</span>
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry & Open Arenas */}
            <div className="lg:col-span-5 space-y-4">
              <SpotlightCard className="p-5 border-border/80 bg-card/70 shadow-sm" spotlightColor="rgba(59, 130, 246, 0.12)">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="text-xs font-bold text-foreground">Live Arena Rooms</span>
                  </div>
                  <Link href="/lobby" className="text-[11px] text-primary hover:underline font-medium">
                    View all &rarr;
                  </Link>
                </div>

                {loadingLobby ? (
                  <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                    Checking active rooms...
                  </div>
                ) : !lobbyData?.items || lobbyData.items.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="text-xs font-medium text-foreground">No rooms waiting right now.</div>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                      Create an arena and share the room code with a colleague or friend.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/battle/create"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="size-3.5" />
                        Host New Room
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lobbyData.items.slice(0, 3).map((room) => (
                      <div
                        key={room.code}
                        className="p-3 rounded-xl border border-border bg-background flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-foreground">{room.code}</span>
                            <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.2 rounded bg-muted">
                              {room.difficulty}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {room.title || 'Two Sum Duel'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/battle/${room.code}?role=fighter`}
                            className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-semibold text-[11px] hover:bg-primary/90 transition-colors"
                          >
                            Fight
                          </Link>
                          <Link
                            href={`/battle/${room.code}?role=spectator`}
                            className="px-2 py-1 rounded-md bg-muted text-foreground text-[11px] hover:bg-muted/80 transition-colors"
                          >
                            Watch
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Platform Summary Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">3,129</div>
                    <div className="text-[10px] text-muted-foreground">DSA Problems</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">50+</div>
                    <div className="text-[10px] text-muted-foreground">Tests / Problem</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">&lt; 25ms</div>
                    <div className="text-[10px] text-muted-foreground">Keystroke Sync</div>
                  </div>
                </div>
              </SpotlightCard>
            </div>

          </div>
        </div>
      </section>

      {/* Problem Tracks: Clean and Practical */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Structured Problem Tracks
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Practice verified problem patterns with deep intuition breakdowns and hidden test cases.
              </p>
            </div>
            <Link
              href="/problems"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Browse all 3,129 problems &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/problems?category=top75"
              className="group block"
            >
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
                    The foundational 75 algorithmic patterns covering arrays, two pointers, sliding windows, and trees.
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

            <Link
              href="/problems?category=core150"
              className="group block"
            >
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
                    Full interview syllabus including binary search trees, heaps, graphs, topological sort, and DP.
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

            <Link
              href="/problems?category=mastery250"
              className="group block sm:col-span-2 lg:col-span-1"
            >
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
                    Senior engineering level algorithms: monotonic queues, segment trees, and multi-dimensional state DP.
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
          </div>
        </div>
      </section>

      {/* Rules & Mechanics: Direct and Concrete */}
      <section className="py-12 md:py-16 border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Combat Mechanics
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              How matches are judged and evaluated in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SpotlightCard className="p-5 border-border/80 bg-card/60" spotlightColor="rgba(59, 130, 246, 0.1)">
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-primary uppercase">01. Instant Judgement</div>
                <h3 className="text-sm font-bold text-foreground">Authoritative Server Execution</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Code runs on isolated native runners with Clang++ and Python 3. The server tests solutions against 50 hidden test cases to prevent hardcoded outputs.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-5 border-border/80 bg-card/60" spotlightColor="rgba(245, 158, 11, 0.1)">
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-amber-500 uppercase">02. Precision Stamina</div>
                <h3 className="text-sm font-bold text-foreground">Anti-Spray Penalties</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Blind brute-force submissions are punished. Each wrong answer or runtime error costs 25 stamina points. Think through edge cases before clicking submit.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-5 border-border/80 bg-card/60" spotlightColor="rgba(168, 85, 247, 0.1)">
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-purple-400 uppercase">03. Code Shielding</div>
                <h3 className="text-sm font-bold text-foreground">Encrypted During Play</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You see your opponent's typing speed and test progress, but their actual solution code stays encrypted until the match ends to prevent copying.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 border-t border-border mt-auto text-xs text-muted-foreground">
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
