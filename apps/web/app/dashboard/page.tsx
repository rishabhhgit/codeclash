'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  GitFork,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Compass,
} from 'lucide-react';
import { SpotlightCard } from '../../components/ui/SpotlightCard';

function LeetCodeBrandIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

function getRankMeta(rating: number) {
  if (rating >= 2900) return { name: 'Legendary Grandmaster', color: 'text-rose-500', bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400', next: null, target: 2900, floor: 2600 };
  if (rating >= 2600) return { name: 'International Grandmaster', color: 'text-red-500', bg: 'bg-red-500/15 border-red-500/30 text-red-400', next: 'Legendary Grandmaster', target: 2900, floor: 2600 };
  if (rating >= 2400) return { name: 'Grandmaster', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30 text-red-400', next: 'International Grandmaster', target: 2600, floor: 2400 };
  if (rating >= 2300) return { name: 'International Master', color: 'text-amber-500', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', next: 'Grandmaster', target: 2400, floor: 2300 };
  if (rating >= 2100) return { name: 'Master', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', next: 'International Master', target: 2300, floor: 2100 };
  if (rating >= 1900) return { name: 'Candidate Master', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400', next: 'Master', target: 2100, floor: 1900 };
  if (rating >= 1600) return { name: 'Expert', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', next: 'Candidate Master', target: 1900, floor: 1600 };
  if (rating >= 1400) return { name: 'Specialist', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400', next: 'Expert', target: 1600, floor: 1400 };
  if (rating >= 1200) return { name: 'Pupil', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', next: 'Specialist', target: 1400, floor: 1200 };
  return { name: 'Newbie', color: 'text-stone-400', bg: 'bg-stone-500/15 border-stone-500/30 text-stone-300', next: 'Pupil', target: 1200, floor: 800 };
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickCode, setQuickCode] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [syncingLeetCode, setSyncingLeetCode] = useState(false);
  const [practicedCount, setPracticedCount] = useState(0);
  const [connectLcInput, setConnectLcInput] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingLc, setConnectingLc] = useState(false);
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || 'guest-token';
    fetchUserData(token);

    // Read practiced roadmap items from localStorage
    try {
      const stored = localStorage.getItem('codeclash_practiced_slugs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPracticedCount(parsed.length);
        }
      }
    } catch {}
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

      if (userData.success && userData.data) setUser(userData.data);
      if (statsData.success && statsData.data) setStats(statsData.data);
    } catch {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('battle_username') : null;
      setUser({
        username: storedUser || 'Challenger',
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

  const handleSyncLeetCode = async () => {
    const handle = user?.leetcodeUsername;
    if (!handle) return;

    setSyncingLeetCode(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/leetcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
      }
    } catch {
      // Ignored
    } finally {
      setSyncingLeetCode(false);
    }
  };

  const handleConnectLeetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = connectLcInput.trim();
    if (!handle) return;

    setConnectingLc(true);
    setConnectError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/leetcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect LeetCode handle');
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.data?.user) {
        setUser(data.data.user);
        localStorage.setItem('battle_username', data.data.user.username);
        localStorage.setItem('codeclash_handle', data.data.user.handle || data.data.user.username);
      }
      localStorage.setItem('codeclash_leetcode_handle', handle);
      setShowConnectModal(false);
      setConnectLcInput('');
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to connect handle');
    } finally {
      setConnectingLc(false);
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

  const handleGenerateChallenge = () => {
    if (typeof window === 'undefined') return;
    const random = 'DUEL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const challengeUrl = `${window.location.origin}/battle/${random}?role=fighter`;
    navigator.clipboard.writeText(challengeUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('battle_username');
    localStorage.removeItem('codeclash_handle');
    localStorage.removeItem('codeclash_leetcode_handle');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rating = user?.rating || 1200;
  const rankMeta = getRankMeta(rating);
  const totalBattles = user?.totalBattles || stats?.totalBattles || 0;
  const wins = user?.battleWins ?? stats?.wins ?? 0;
  const winRate = totalBattles > 0 ? ((wins / totalBattles) * 100).toFixed(1) : '0.0';
  const winStreak = user?.winStreak ?? stats?.winStreak ?? 0;

  // Rating progress calculation
  const pointsToNext = rankMeta.next ? Math.max(0, rankMeta.target - rating) : 0;
  const tierProgress = rankMeta.next
    ? Math.min(100, Math.max(8, ((rating - rankMeta.floor) / (rankMeta.target - rankMeta.floor)) * 100))
    : 100;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground py-8 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 size-[550px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 size-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Connect LeetCode Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="size-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                  <LeetCodeBrandIcon className="size-4" />
                </span>
                <h3 className="text-lg font-bold text-foreground">Connect LeetCode Account</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your public LeetCode handle. We will import your solved count, contest rating, and avatar automatically.
              </p>

              {connectError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {connectError}
                </div>
              )}

              <form onSubmit={handleConnectLeetCode} className="space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase text-muted-foreground block mb-1.5">
                    LeetCode Username
                  </label>
                  <input
                    type="text"
                    value={connectLcInput}
                    onChange={(e) => setConnectLcInput(e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. neal_wu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConnectModal(false);
                      setConnectError('');
                    }}
                    className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connectingLc || !connectLcInput.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {connectingLc ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        <span>Confirm &amp; Sync</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-7 relative z-10"
      >
        {/* Top Hero Command Center Banner */}
        <motion.div variants={itemVariants}>
          <SpotlightCard className="p-6 sm:p-7 rounded-3xl border-border/80 bg-card/85 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar with Glow Ring */}
              <div className="relative shrink-0">
                <div className="size-16 sm:size-20 rounded-2xl bg-secondary/80 border-2 border-primary/40 overflow-hidden flex items-center justify-center font-bold text-2xl text-primary shadow-md">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="size-full object-cover" />
                  ) : (
                    user?.username?.substring(0, 2).toUpperCase() || 'CC'
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center shadow-sm" title="Online & Combat Ready">
                  <span className="size-2 rounded-full bg-emerald-100" />
                </span>
              </div>

              {/* Username & Metadata */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    {user?.username || 'Challenger'}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${rankMeta.bg}`}>
                    {rankMeta.name}
                  </span>
                  {user?.leetcodeUsername && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                      <LeetCodeBrandIcon className="size-3 text-amber-500" />
                      <span>{user.leetcodeUsername}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">Rating: <strong className="text-foreground">{rating}</strong></span>
                  <span>•</span>
                  <span>Handle: <code className="text-foreground font-mono">@{user?.handle || user?.username}</code></span>
                  <span>•</span>
                  <span>Rank Tier: <span className="font-semibold text-foreground capitalize">{rankMeta.name}</span></span>
                </div>

                {/* Rating Progress to Next Tier */}
                {rankMeta.next && (
                  <div className="pt-1.5 max-w-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Tier Progress</span>
                      <span className="text-foreground font-semibold">
                        {pointsToNext > 0 ? `${pointsToNext} pts to ${rankMeta.next}` : 'Max Tier'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${tierProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
              {user?.leetcodeUsername ? (
                <button
                  type="button"
                  onClick={handleSyncLeetCode}
                  disabled={syncingLeetCode}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-semibold transition-all inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Pull latest solve stats and contest rating from LeetCode"
                >
                  <RefreshCw className={`size-3.5 text-amber-400 ${syncingLeetCode ? 'animate-spin' : ''}`} />
                  <span>{syncingLeetCode ? 'Syncing...' : 'Sync LeetCode'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all inline-flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <LeetCodeBrandIcon className="size-3.5 text-stone-950" />
                  <span>Connect LeetCode</span>
                </button>
              )}

              <Link
                href={`/profile/${encodeURIComponent(user?.handle || user?.username || 'Candidate')}`}
                className="px-3 py-2 rounded-xl bg-secondary hover:bg-muted border border-border/80 text-xs font-medium text-foreground transition-all duration-150 active:scale-95 inline-flex items-center gap-1.5 shadow-sm"
              >
                <User className="size-3.5" />
                <span>View Profile</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl border border-destructive/30 text-destructive/80 hover:text-destructive hover:bg-destructive/10 text-xs font-medium transition-all active:scale-95 inline-flex items-center gap-1.5"
                title="Log out of session"
              >
                <LogOut className="size-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* 4 Primary Metric Cards */}
        <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Competitive Rating */}
          <SpotlightCard className="p-5 rounded-2xl border-border/80 bg-card/80 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold font-mono uppercase text-[11px]">
                <Trophy className="size-3.5 text-amber-400" />
                Rating
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                Peak {user?.maxRating || rating}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground font-mono tabular-nums tracking-tight">
              {rating}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Authoritative CodeClash competitive rating
            </p>
          </SpotlightCard>

          {/* Card 2: Arena Battles & Record */}
          <SpotlightCard className="p-5 rounded-2xl border-border/80 bg-card/80 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold font-mono uppercase text-[11px]">
                <Swords className="size-3.5 text-blue-400" />
                Arena Duels
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
                {wins}W - {(user?.battleLosses ?? stats?.losses ?? 0)}L
              </span>
            </div>
            <div className="text-3xl font-black text-foreground font-mono tabular-nums tracking-tight">
              {totalBattles}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              1v1 synchronized speed duels played
            </p>
          </SpotlightCard>

          {/* Card 3: Win Streak */}
          <SpotlightCard className="p-5 rounded-2xl border-border/80 bg-card/80 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold font-mono uppercase text-[11px]">
                <Flame className="size-3.5 text-orange-400" />
                Win Streak
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-semibold">
                Best {user?.maxWinStreak || winStreak}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground font-mono tabular-nums tracking-tight flex items-center gap-2">
              <span>{winStreak}</span>
              {winStreak >= 3 && <Flame className="size-6 text-orange-500 animate-pulse" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Active consecutive match victories
            </p>
          </SpotlightCard>

          {/* Card 4: LeetCode Solved or Win Ratio */}
          <SpotlightCard className="p-5 rounded-2xl border-border/80 bg-card/80 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold font-mono uppercase text-[11px]">
                {user?.leetcodeTotalSolved ? (
                  <>
                    <LeetCodeBrandIcon className="size-3.5 text-amber-500" />
                    LeetCode Solved
                  </>
                ) : (
                  <>
                    <Shield className="size-3.5 text-emerald-400" />
                    Win Rate
                  </>
                )}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                {user?.leetcodeTotalSolved ? 'Synced' : 'Verified'}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground font-mono tabular-nums tracking-tight">
              {user?.leetcodeTotalSolved ? user.leetcodeTotalSolved : `${winRate}%`}
            </div>
            {user?.leetcodeTotalSolved ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-emerald-400 font-bold">{user.leetcodeEasySolved || 0}E</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{user.leetcodeMediumSolved || 0}M</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">{user.leetcodeHardSolved || 0}H</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-tight">
                Integrity audited by automated judge
              </p>
            )}
          </SpotlightCard>
        </motion.div>

        {/* Practice Roadmap Progress Banner */}
        <motion.div variants={itemVariants}>
          <SpotlightCard className="p-5 sm:p-6 rounded-3xl border-border/80 bg-card/85 space-y-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Compass className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      DSA Practice Roadmap Tracker
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      18 Patterns
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Master essential coding interview structures across 5 prerequisite progression tiers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    Practiced Slugs
                  </span>
                  <span className="text-sm font-mono font-bold text-foreground">
                    {practicedCount} Problems Done
                  </span>
                </div>
                <Link
                  href="/roadmap"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>Open Roadmap</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Visual Mini Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Core 150 Target</span>
                <span className="font-semibold text-foreground">
                  {Math.min(100, Math.round((practicedCount / 150) * 100))}% Completed
                </span>
              </div>
              <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(practicedCount > 0 ? 5 : 0, (practicedCount / 150) * 100))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-primary rounded-full"
                />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Combat & Sparring Launchpad (4 Cards Grid) */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              Combat &amp; Sparring Modes
            </h2>
            <span className="text-xs text-muted-foreground font-mono">1v1 Synchronized Engine</span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Action 1: Ranked 1v1 Duel */}
            <Link
              href="/matchmaking?mode=ranked"
              className="p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/60 hover:bg-card/90 transition-all duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Swords className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Ranked Duel</span>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Battle against opponents in your strict Elo rating bracket. Winner claims rating points.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Strict Elo Match</span>
              </div>
            </Link>

            {/* Action 2: Casual Practice */}
            <Link
              href="/matchmaking?mode=casual"
              className="p-5 rounded-2xl border border-border/80 bg-card hover:border-blue-500/60 hover:bg-card/90 transition-all duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Code2 className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Casual Sparring</span>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Practice with zero rating penalty. Test solutions with live clock pressure.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-blue-400 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-400" />
                <span>No Rating Risk</span>
              </div>
            </Link>

            {/* Action 3: Multiplayer Arena Lobby */}
            <Link
              href="/lobby"
              className="p-5 rounded-2xl border border-border/80 bg-card hover:border-orange-500/60 hover:bg-card/90 transition-all duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Flame className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Arena Lobby</span>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Browse open public battles or launch custom Battle Royale match rooms.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-orange-400 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-orange-400" />
                <span>Multiplayer &amp; BR</span>
              </div>
            </Link>

            {/* Action 4: Timed Proctor Assessment */}
            <Link
              href="/exam/demo-sync-session"
              className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/60 hover:bg-card/90 transition-all duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Shield className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Timed Assessment</span>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Simulate real technical interviews with camera and tab-focus telemetry monitoring.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Proctoring Audit</span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Quick Join Duel by Code & Instant Friend Challenge */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-12">
          {/* Quick Join Input (7 cols) */}
          <SpotlightCard className="md:col-span-7 p-6 rounded-3xl border-border/80 bg-card/85 space-y-4 shadow-md">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Hash className="size-4 text-primary" />
                Enter Room Code or Challenge Link
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Paste a battle invite link or 4 to 8 digit room code to synchronize and face off.
              </p>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Hash className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    placeholder="e.g. DUEL-7X9B or paste URL"
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-background border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!quickCode.trim()}
                  className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all active:scale-95 disabled:opacity-40 shrink-0 shadow-md flex items-center gap-1.5"
                >
                  <Swords className="size-3.5" />
                  <span>Enter Room</span>
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
              <span>Quick links:</span>
              <Link href="/problems" className="text-foreground hover:underline">
                Problem Directory →
              </Link>
              <span>•</span>
              <Link href="/rankings" className="text-foreground hover:underline">
                Global Rankings →
              </Link>
            </div>
          </SpotlightCard>

          {/* Instant Challenge Generator (5 cols) */}
          <SpotlightCard className="md:col-span-5 p-6 rounded-3xl border-border/80 bg-card/85 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Share2 className="size-4" />
                <span>Challenge a Friend 1v1</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate an instant synchronized battle link. Share it via Discord, WhatsApp, or Slack to spar immediately on the same problem.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateChallenge}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                  copiedInvite
                    ? 'bg-emerald-500 text-stone-950 font-black'
                    : 'bg-secondary hover:bg-muted text-foreground border border-border/80'
                }`}
              >
                {copiedInvite ? (
                  <>
                    <CheckCircle2 className="size-4 text-stone-950" />
                    <span>Invite Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 text-primary" />
                    <span>Generate Instant Invite Link</span>
                  </>
                )}
              </button>
            </div>
          </SpotlightCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
