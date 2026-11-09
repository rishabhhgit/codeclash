'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Shield,
  Swords,
  ArrowRight,
  Check,
  FileCode,
  Zap,
  Trophy,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  Cpu,
  Share2,
  Flame,
  Activity,
  ChevronRight,
  Eye,
  RefreshCw,
  Copy,
  Hash,
  Package,
  Skull,
  Crosshair,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'royale' | 'duel' | 'radar' | 'blueprints'>('royale');
  const [copiedCode, setCopiedCode] = useState(false);
  const [quickCode, setQuickCode] = useState('');

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = quickCode.trim();
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

  const handleCopyDemoLink = () => {
    if (typeof window !== 'undefined') {
      const randomCode = 'BR-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      navigator.clipboard.writeText(`${window.location.origin}/battle/${randomCode}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background text-foreground relative overflow-hidden">
      {/* Background Subtle Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-grid-subtle bg-dot-mask pointer-events-none opacity-40 dark:opacity-25" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] glow-ambient-orange pointer-events-none blur-3xl opacity-35" />
      <div className="absolute top-96 right-0 w-[500px] h-[300px] glow-ambient-primary pointer-events-none blur-3xl opacity-25" />
      <div className="absolute top-[800px] left-0 w-[500px] h-[300px] glow-ambient-emerald pointer-events-none blur-3xl opacity-20" />

      {/* Top Banner Ribbon */}
      <div className="relative z-10 border-b border-border/60 bg-muted/40 backdrop-blur-sm py-2 px-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-foreground">Live 1v1 speed duels and multi-player knockout arenas are active.</span>
        <Link href="/lobby" className="text-primary font-semibold hover:underline inline-flex items-center gap-1 ml-1">
          Open Lobby <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Hero Headline & Action Triggers */}
            <div className="lg:col-span-6 space-y-6">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary backdrop-blur-sm shadow-sm">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-time multiplayer coding arena</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
                Solve DSA problems <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-400">
                  head-to-head in real time.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl text-pretty">
                Challenge friends to timed 1v1 speed duels, compete in multi-player knockout rooms, and climb the Elo leaderboard across 3,129 LeetCode-style challenges with instant test evaluation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/matchmaking"
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-all duration-150 shadow-lg shadow-primary/25 active:scale-[0.98] flex items-center gap-2"
                >
                  <Swords className="size-4" />
                  <span>Find 1v1 Ranked Match</span>
                </Link>

                <Link
                  href="/battle/create"
                  className="px-5 py-3 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-[0.98] flex items-center gap-2 shadow-sm"
                >
                  <Share2 className="size-4 text-primary" />
                  <span>Create Room &amp; Invite Friends</span>
                </Link>

                <Link
                  href="/problems"
                  className="px-4 py-3 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm transition-all duration-150 flex items-center gap-1.5"
                >
                  <Code2 className="size-4" />
                  <span>Browse 3,129 Problems</span>
                </Link>
              </div>

              {/* Quick Code Join & Friend Challenge Box */}
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5 max-w-lg shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Swords className="size-3.5 text-primary" />
                    Join with room code or link
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">Instant access</span>
                </div>

                <form onSubmit={handleQuickJoin} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={quickCode}
                      onChange={(e) => setQuickCode(e.target.value)}
                      placeholder="Enter room code (e.g. DUEL-ABCD) or paste link..."
                      className="w-full pl-8 pr-3 py-2 bg-muted/50 border border-border rounded-xl text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold text-xs transition-all whitespace-nowrap active:scale-[0.98]"
                  >
                    Join Room
                  </button>
                </form>

                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                  <button
                    type="button"
                    onClick={handleCopyDemoLink}
                    className="hover:text-foreground flex items-center gap-1 transition-colors font-medium"
                  >
                    <Copy className="w-3 h-3 text-primary" />
                    <span>{copiedCode ? 'Battle Link Copied!' : 'Copy Demo Invite Link'}</span>
                  </button>
                  <Link href="/lobby" className="text-primary hover:underline font-semibold flex items-center gap-1">
                    Browse All Active Arenas <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Key Highlights Micro-Pills */}
              <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time Keystrokes</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Opponent Code Privacy</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Authoritative Server ELO</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Gaming Showcase */}
            <div className="lg:col-span-6 space-y-3">
              {/* Interactive Demo Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 backdrop-blur-sm rounded-xl border border-border/80 text-xs font-medium w-full sm:w-fit overflow-x-auto">
                <button
                  onClick={() => setActiveTab('royale')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'royale'
                      ? 'bg-background text-foreground shadow-sm font-semibold border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span>🏆 Knockout Arena</span>
                </button>
                <button
                  onClick={() => setActiveTab('duel')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'duel'
                      ? 'bg-background text-foreground shadow-sm font-semibold border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 text-primary" />
                  <span>⚔️ 1v1 Blitz Duel</span>
                </button>
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'radar'
                      ? 'bg-background text-foreground shadow-sm font-semibold border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Active Coders</span>
                </button>
                <button
                  onClick={() => setActiveTab('blueprints')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'blueprints'
                      ? 'bg-background text-foreground shadow-sm font-semibold border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Complexity Intel</span>
                </button>
              </div>

              {/* Live Preview Window Frame */}
              <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden font-mono text-xs card-shine">
                
                {/* Window Header */}
                <div className="h-11 px-4 bg-muted/50 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-border mx-2">|</span>
                    <span className="text-foreground font-sans font-semibold text-xs flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-primary" />
                      {activeTab === 'royale' && 'knockout_tournament.cpp · Room #KNOCK-8ACK'}
                      {activeTab === 'duel' && 'blitz_duel.cpp · Head-to-Head Speed Clock'}
                      {activeTab === 'radar' && 'competitor_telemetry.ts · 4 / 10 Coders Active'}
                      {activeTab === 'blueprints' && 'complexity_blueprint.ts · +50 Buffer & Complexity Blueprint'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'royale' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        Phase 2 Checkpoint
                      </span>
                    )}
                    {activeTab === 'duel' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                        ±32 ELO Stakes
                      </span>
                    )}
                    {activeTab === 'radar' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        4 Active
                      </span>
                    )}
                    {activeTab === 'blueprints' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Blueprint Unlocked
                      </span>
                    )}
                  </div>
                </div>

                {/* TAB 1: KNOCKOUT ARENA SHOWCASE */}
                {activeTab === 'royale' && (
                  <div className="p-5 space-y-4 bg-card/60 min-h-[340px]">
                    {/* Stage Checkpoint HUD */}
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-primary animate-pulse" />
                        <span className="font-bold text-foreground">Phase 2: Stress Test Checkpoint</span>
                        <span className="text-muted-foreground text-[11px]">(Pass &ge; 2 testcases before cutoff)</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono font-bold text-xs">
                        <span className="text-amber-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 02:45
                        </span>
                        <span className="text-primary">👥 4 / 10 ACTIVE</span>
                        <span className="text-emerald-400">🎯 2 BENCHMARKS</span>
                      </div>
                    </div>

                    {/* Accuracy Stamina & Buffer Meters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Accuracy Stamina
                          </span>
                          <span className="font-mono font-bold text-emerald-400">100 / 100</span>
                        </div>
                        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-full transition-all" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            Stamina Buffer
                          </span>
                          <span className="font-mono font-bold text-cyan-400">50 / 100</span>
                        </div>
                        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full w-1/2 transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Submission Penalty Alert Box */}
                    <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/10 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-300">
                        <Crosshair className="w-4 h-4 text-rose-400" />
                        <span>Submission Penalties: Precision is Rewarded</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Submitting non-accepted code (Wrong Answer, TLE, Syntax Error) deducts <strong className="text-rose-300">25 Stamina</strong> from your Buffer and Stamina pool. Reach 0 Stamina and your match is retired!
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        href="/battle/create?mode=battle_royale"
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Deploy Knockout Arena</span>
                      </Link>
                      <span className="text-muted-foreground text-[11px]">First to solve all benchmarks claims 1st Place</span>
                    </div>
                  </div>
                )}

                {/* TAB 2: 1v1 BLITZ SPEED DUEL */}
                {activeTab === 'duel' && (
                  <div className="p-5 space-y-4 bg-card/60 min-h-[340px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-center">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Your Match Clock</div>
                        <div className="text-2xl font-bold font-mono text-primary">04:12</div>
                        <div className="text-[11px] text-emerald-400">Solving: Two Sum</div>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border space-y-1 text-center">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Rival Clock</div>
                        <div className="text-2xl font-bold font-mono text-foreground">03:48</div>
                        <div className="text-[11px] text-amber-400 flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Typing (78 WPM)
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">Competitive Rating Stakes:</span>
                        <span className="font-mono text-primary font-bold">1200 ELO Bracket</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <div className="p-2 rounded-lg bg-card border border-border">Victory: <strong className="text-emerald-400">+32 ELO</strong></div>
                        <div className="p-2 rounded-lg bg-card border border-border">Defeat: <strong className="text-rose-400">-28 ELO</strong></div>
                      </div>
                      <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>Opponent code is encrypted and shielded until match conclusion.</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        href="/battle/create"
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Create 1v1 Challenge Link</span>
                      </Link>
                      <Link href="/matchmaking" className="text-primary text-xs hover:underline font-semibold">
                        Enter Ranked Queue →
                      </Link>
                    </div>
                  </div>
                )}

                {/* TAB 3: ACTIVE CODERS RADAR */}
                {activeTab === 'radar' && (
                  <div className="p-5 space-y-3 bg-card/60 min-h-[340px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">Live Telemetry &amp; Solves</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 text-[10px]">
                        4 / 10 Coders
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-card border border-emerald-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400">#1</span>
                          <span className="font-bold text-foreground">ApexCoder</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">100 Stamina</span>
                          <span className="text-cyan-400 font-bold">50 Buffer</span>
                          <span className="text-muted-foreground">3/4 Passed</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-muted-foreground">#2</span>
                          <span className="font-bold text-foreground">Drop_Looter</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-mono">BLUEPRINT</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">100 Stamina</span>
                          <span className="text-cyan-400 font-bold">100 Buffer</span>
                          <span className="text-muted-foreground">2/4 Passed</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">#3</span>
                          <span className="font-bold text-foreground">Camp_Coder</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">AT CUTOFF</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-amber-400 font-bold">60 Stamina</span>
                          <span className="text-muted-foreground">0 Buffer</span>
                          <span className="text-muted-foreground">1/4 Passed</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-card border border-rose-500/20 opacity-60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-400">#4</span>
                          <span className="line-through text-muted-foreground">Async_Coder</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-mono">CUTOFF</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px] text-rose-400">
                          <span>0 Stamina</span>
                          <span>Placement #4</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] font-mono text-muted-foreground">
                      📡 Match Feed: ⚠️ @Async_Coder fell behind phase benchmark cutoff [Placement #4]
                    </div>
                  </div>
                )}

                {/* TAB 4: ALGORITHMIC BLUEPRINTS */}
                {activeTab === 'blueprints' && (
                  <div className="p-5 space-y-4 bg-card/60 min-h-[340px]">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <Package className="w-6 h-6 animate-bounce" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-foreground">Optimal Complexity Blueprint</div>
                        <div className="text-xs text-muted-foreground">Unlocks mid-match at stage checkpoints.</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase">Buffer Recovery</div>
                        <div className="text-sm font-bold text-foreground">+50 Stamina Buffer</div>
                        <div className="text-[11px] text-muted-foreground">Absorbs non-accepted submission penalties</div>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                        <div className="text-[10px] font-bold text-amber-400 uppercase">Complexity Intel</div>
                        <div className="text-sm font-bold text-foreground">Algorithmic Blueprint</div>
                        <div className="text-[11px] text-muted-foreground">Reveals O(N) Hash Table pattern analysis</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">First coder to click Unlock Blueprint secures the intel!</span>
                      <span className="font-mono text-emerald-400 font-bold">1-Click Unlock</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Esports Metrics Ribbon */}
      <section className="border-b border-border/60 bg-muted/20 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl border border-border bg-card/70 tremor-card tremor-card-orange space-y-1 shadow-sm">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Flame className="size-3.5 text-primary" />
                Game Modes
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">Knockout &amp; Duels</div>
              <div className="text-[11px] text-muted-foreground text-pretty">Multi-player Arenas &amp; 1v1 Speed Matchmaking</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/70 tremor-card tremor-card-blue space-y-1 shadow-sm">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                DSA Question Pool
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground tabular-nums">3,129</div>
              <div className="text-[11px] text-muted-foreground text-pretty">Top 75, Core 150 &amp; Mastery 250</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/70 tremor-card tremor-card-emerald space-y-1 shadow-sm">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Zap className="size-3.5 text-emerald-400" />
                Multiplayer Latency
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground tabular-nums">&lt; 25ms</div>
              <div className="text-[11px] text-muted-foreground text-pretty">Live typing &amp; state telemetry sync</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/70 tremor-card tremor-card-purple space-y-1 shadow-sm">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5 text-purple-400" />
                True Skill Rating
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">Authoritative</div>
              <div className="text-[11px] text-muted-foreground text-pretty">Server-side Elo expansion &amp; journal persistence</div>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid: Competitive Gaming Features */}
      <section className="py-16 md:py-24 container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs text-primary font-bold">
            <Flame className="size-3.5" />
            Competitive Arena Architecture
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Built Like an Esports Game.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground text-pretty">
            No more boring coding exercises. CodeClash turns LeetCode grinding into high-intensity multiplayer knockouts and timed speed duels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Timed Stage Knockouts */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-150 space-y-4 group relative overflow-hidden card-shine shadow-sm">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-150">
              <Flame className="size-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-primary font-semibold mb-1">
                Knockout Arena
              </div>
              <h3 className="text-lg font-bold text-foreground text-balance">Timed Stage Checkpoints</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 text-pretty">
                Rounds advance through 4 timed stages. Pass test cases before each phase cutoff to stay ahead of the benchmark pace. First to solve all benchmarks wins 1st Place.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <Link href="/battle/create?mode=battle_royale" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                Play Knockout Arena <ArrowRight className="size-3" />
              </Link>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">Up to 100 Players</span>
            </div>
          </div>

          {/* Card 2: 1v1 Speed Duels */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-150 space-y-4 group relative overflow-hidden card-shine shadow-sm">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-150">
              <Swords className="size-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-primary font-semibold mb-1">
                Timed Speed Duels
              </div>
              <h3 className="text-lg font-bold text-foreground text-balance">1v1 Blitz Elo Matchmaking</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 text-pretty">
                Rapid head-to-head battles with synchronized clocks. Monitor rival typing cadence and benchmark progress in real-time, while opponent code stays shielded until match conclusion.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <Link href="/matchmaking" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                Find Ranked Rival <ArrowRight className="size-3" />
              </Link>
              <span className="text-[11px] font-mono text-muted-foreground">Elo Rated</span>
            </div>
          </div>

          {/* Card 3: Challenge Your Friends */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 transition-all duration-150 space-y-4 group relative overflow-hidden card-shine shadow-sm">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-150">
              <Share2 className="size-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                Challenge Friends
              </div>
              <h3 className="text-lg font-bold text-foreground text-balance">Instant Shareable Battle Links</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 text-pretty">
                Generate an arena room with a single click. Share your unique code or link on WhatsApp, Discord, or Telegram to challenge friends with zero setup or friction.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <Link href="/battle/create" className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1">
                Create Battle Link <ArrowRight className="size-3" />
              </Link>
              <span className="text-[11px] font-mono text-muted-foreground">Instant Drop-In</span>
            </div>
          </div>

        </div>

        {/* 2nd Row: Accuracy Stamina & Complexity Blueprints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Crosshair className="size-4" />
              </div>
              <h4 className="font-bold text-foreground text-sm text-balance">Accuracy Stamina &amp; Penalty System (100 Stamina)</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
              No brute-force spray-and-pray. Submitting non-accepted code (Wrong Answer, Time Limit Exceeded, Syntax Error) deducts 25 stamina. Precision is your primary defense.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Package className="size-4" />
              </div>
              <h4 className="font-bold text-foreground text-sm text-balance">Algorithmic Complexity Blueprints</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
              Intel unlocks at phase checkpoints throughout the battle. Claim them to restore +50 Stamina Buffer and unlock time-complexity blueprints with optimal algorithmic patterns.
            </p>
          </div>
        </div>
      </section>

      {/* Esports Match Lifecycle Stepper */}
      <section className="py-12 border-y border-border/60 bg-muted/10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground text-balance">How a Battle Works</h3>
            <p className="text-xs text-muted-foreground text-pretty">From synchronized start to 1st Place Victory.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-mono">
                <span className="font-bold text-primary tabular-nums">01</span>
                <span>Matchmaking</span>
              </div>
              <div className="font-bold text-foreground">Enter or Invite</div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Join a Knockout Arena queue or share your unique room link with your friends.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-mono">
                <span className="font-bold text-primary tabular-nums">02</span>
                <span>Ready Check</span>
              </div>
              <div className="font-bold text-foreground">Lock-In Status</div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                All coders confirm readiness. Synchronized countdown unlocks code editors.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-mono">
                <span className="font-bold text-amber-400 tabular-nums">03</span>
                <span>Checkpoints</span>
              </div>
              <div className="font-bold text-foreground">Pass Phase Cutoffs</div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Pass test cases to remain ahead of each stage cutoff before time expires.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-mono">
                <span className="font-bold text-cyan-400 tabular-nums">04</span>
                <span>Blueprints</span>
              </div>
              <div className="font-bold text-foreground">Unlock Intel</div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Unlock mid-match complexity blueprints for extra stamina buffer and data structure insights.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground font-mono">
                <span className="font-bold text-emerald-400 tabular-nums">05</span>
                <span>Championship</span>
              </div>
              <div className="font-bold text-foreground">1st Place Victory</div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                First to solve all hidden benchmark testcases claims 1st Place!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Problem Categories Quick Access */}
      <section className="py-16 container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground text-balance">Curated Problem Sets</h3>
            <p className="text-xs text-muted-foreground mt-0.5 text-pretty">Filter 3,129 questions across proven study tracks.</p>
          </div>
          <Link
            href="/problems"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start md:self-auto tabular-nums"
          >
            View All 3,129 Problems <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/problems?category=top75"
            className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-150 space-y-2 group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Top 75</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Essential
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">The foundational 75 algorithmic patterns asked across top tech companies.</p>
          </Link>

          <Link
            href="/problems?category=core150"
            className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-150 space-y-2 group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Core 150</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Full Track
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">Deep coverage of trees, graphs, heaps, dynamic programming, and tries.</p>
          </Link>

          <Link
            href="/problems?category=mastery250"
            className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-150 space-y-2 group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Mastery 250</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Advanced
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">Senior engineering level algorithms, segment trees, and hard state DP.</p>
          </Link>

          <Link
            href="/problems?difficulty=Medium"
            className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-150 space-y-2 group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Medium Filter</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Popular
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">Standard interview sweet-spot problems with full test suites.</p>
          </Link>
        </div>
      </section>

      {/* Bottom CTA Box */}
      <section className="py-16 container mx-auto px-4 max-w-7xl">
        <div className="relative rounded-3xl border border-border bg-gradient-to-b from-card via-card to-muted/40 p-8 sm:p-12 text-center space-y-6 overflow-hidden card-shine shadow-xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] glow-ambient-orange pointer-events-none blur-3xl opacity-20" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
              Ready to code under pressure?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
              Enter the arena, challenge friends to 1v1 blitz duels, or join multi-player knockout tournaments.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/matchmaking"
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-all duration-150 shadow-md active:scale-[0.98] flex items-center gap-2"
              >
                <Swords className="size-4" />
                <span>Find Ranked Rival</span>
              </Link>
              <Link
                href="/battle/create"
                className="px-6 py-3 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border font-bold text-xs sm:text-sm transition-all duration-150 active:scale-[0.98] flex items-center gap-2"
              >
                <Share2 className="size-4 text-primary" />
                <span>Challenge a Friend</span>
              </Link>
              <Link
                href="/battle/create?mode=battle_royale"
                className="px-5 py-3 rounded-xl bg-card hover:bg-muted text-foreground border border-border font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-[0.98] flex items-center gap-2"
              >
                <Flame className="size-4 text-primary" />
                <span>Knockout Arena</span>
              </Link>
              <Link
                href="/lobby"
                className="px-5 py-3 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border font-medium text-xs sm:text-sm transition-all duration-150 active:scale-[0.98] flex items-center gap-2"
              >
                <span>Arena Lobby</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-8 text-xs text-muted-foreground mt-auto">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-bold text-[10px] border border-orange-500/30">
              cc
            </span>
            <span className="font-semibold text-foreground">CodeClash</span>
            <span>&middot; Real-Time Competitive Multiplayer for Algorithms</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <Link href="/problems" className="hover:text-foreground transition-colors">Problems</Link>
            <Link href="/lobby" className="hover:text-foreground transition-colors">Arena</Link>
            <Link href="/rankings" className="hover:text-foreground transition-colors">Leaderboard</Link>
            <Link href="/battle/create" className="hover:text-foreground transition-colors">Challenge Friends</Link>
            <span className="flex items-center gap-1.5 text-emerald-500 font-mono text-[11px] tabular-nums">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
