'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Code2,
  Shield,
  User,
  LogOut,
  Trophy,
  Flame,
  Zap,
  ArrowRight,
  Hash,
  Share2,
  BookOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickCode, setQuickCode] = useState('');

  useEffect(() => {
    const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || 'guest-token';
    fetchUserData(token);
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const [userRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/me/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const userData = await userRes.json();
      const statsData = await statsRes.json();

      if (userData.success) setUser(userData.data);
      if (statsData.success) setStats(statsData.data);
    } catch {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('battle_username') : null;
      setUser({
        username: storedUser || 'Developer',
        rating: 1200,
        rank: 'newbie',
        totalBattles: 0,
        wins: 0,
        winStreak: 0,
      });
      setStats({
        winRate: 0,
        averageSolveTime: 0,
        totalBattles: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
      });
    } finally {
      setLoading(false);
    }
  };

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
      router.push(`/battle/${clean}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('battle_username');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              {user?.username || 'Candidate'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time competitive metrics, arena quick-launch, and assessment roadmaps.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-3.5 py-2 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="size-3.5" /> Log Out
        </button>
      </div>

      {/* Stat Cards with Top Accent Borders */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Rating Card */}
        <div className="p-5 rounded-2xl border border-border bg-card card-elevated motion-enter relative overflow-hidden space-y-2 card-shine">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-amber-500" />
              Competitive Rating
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              {user?.rank || 'Newbie'}
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-mono tracking-tight tabular-nums">{user?.rating || 1200}</div>
          <p className="text-[11px] text-muted-foreground">Standard Elo baseline rating</p>
        </div>

        {/* Total Battles Card */}
        <div className="p-5 rounded-2xl border border-border bg-card card-elevated motion-enter relative overflow-hidden space-y-2 card-shine">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Swords className="size-3.5 text-blue-500" />
              Arena Matches
            </span>
            <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
              {user?.wins || 0} Wins
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-mono tracking-tight tabular-nums">{user?.totalBattles || 0}</div>
          <p className="text-[11px] text-muted-foreground">Synchronized 1v1 duels played</p>
        </div>

        {/* Win Streak Card */}
        <div className="p-5 rounded-2xl border border-border bg-card card-elevated motion-enter relative overflow-hidden space-y-2 card-shine">
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-orange-500" />
              Win Streak
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
              Active
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-mono tracking-tight tabular-nums">{user?.winStreak || 0}</div>
          <p className="text-[11px] text-muted-foreground">Consecutive undefeated victories</p>
        </div>

        {/* Win Rate Card */}
        <div className="p-5 rounded-2xl border border-border bg-card card-elevated motion-enter relative overflow-hidden space-y-2 card-shine">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-emerald-500" />
              Win Ratio
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              Verified
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground font-mono tracking-tight tabular-nums">
            {user?.totalBattles > 0 ? ((user.wins / user.totalBattles) * 100).toFixed(1) : '0.0'}%
          </div>
          <p className="text-[11px] text-emerald-500 font-medium">Proctor-audited integrity</p>
        </div>
      </div>

      {/* Main Grid: Quick Join Arena & Action Launchpad */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Quick Launchpad (7 cols) */}
        <div className="md:col-span-7 p-6 rounded-2xl border border-border bg-card card-elevated motion-enter space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Code2 className="size-4 text-primary" /> Practice &amp; Combat Launchpad
            </h2>
            <span className="text-xs text-muted-foreground">Quick Shortcuts</span>
          </div>

          <div className="space-y-3">
            <Link
              href="/problems"
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60 transition-colors duration-150 active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-150">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">3,600+ Problem Directory</div>
                  <div className="text-[11px] text-muted-foreground">Core 150, Mastery 250, Top 75 roadmaps and deep editorials.</div>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150" />
            </Link>

            <Link
              href="/lobby"
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 hover:border-orange-500/50 hover:bg-muted/60 transition-colors duration-150 active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform duration-150">
                  <Swords className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Multiplayer Arena Lobby</div>
                  <div className="text-[11px] text-muted-foreground">Browse open deathmatches or launch a custom 1v1 battle room.</div>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150" />
            </Link>

            <Link
              href="/exam/demo-sync-session"
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 hover:border-emerald-500/50 hover:bg-muted/60 transition-colors duration-150 active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-150">
                  <Shield className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Timed Practice Assessment</div>
                  <div className="text-[11px] text-muted-foreground">Proctored multi-problem timed assessment with telemetry audit.</div>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150" />
            </Link>
          </div>
        </div>

        {/* Quick Join by Code Widget (5 cols) */}
        <div className="md:col-span-5 p-6 rounded-2xl border border-border bg-card card-elevated motion-enter space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="size-4 text-amber-500" /> Join Duel by Code or Link
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Have a room code or challenge URL from a friend? Enter it below to join their synchronized session immediately.
            </p>

            <form onSubmit={handleQuickJoin} className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Hash className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    placeholder="Enter code (e.g. DUEL-7X9B) or link"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!quickCode.trim()}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors duration-150 active:scale-[0.98] disabled:opacity-40 shrink-0"
                >
                  Join Match
                </button>
              </div>
            </form>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
              <Share2 className="size-3.5 text-primary" />
              Multiplayer Challenge Flow
            </div>
            <p className="text-[11px] leading-relaxed">
              Anyone can generate a code or link from any question page to challenge a friend on the same problem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
