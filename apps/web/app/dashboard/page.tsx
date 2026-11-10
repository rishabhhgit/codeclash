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
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Compass,
  X,
  AlertCircle,
} from 'lucide-react';
import LeetCodeVerifyModal from '../../components/leetcode/LeetCodeVerifyModal';

function LeetCodeBrandIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

function getRankMeta(rating: number) {
  if (rating >= 2900) return { name: 'Legendary Grandmaster', bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400', next: null, target: 2900, floor: 2600 };
  if (rating >= 2600) return { name: 'International Grandmaster', bg: 'bg-red-500/15 border-red-500/30 text-red-400', next: 'Legendary Grandmaster', target: 2900, floor: 2600 };
  if (rating >= 2400) return { name: 'Grandmaster', bg: 'bg-red-500/15 border-red-500/30 text-red-400', next: 'International Grandmaster', target: 2600, floor: 2400 };
  if (rating >= 2300) return { name: 'International Master', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', next: 'Grandmaster', target: 2400, floor: 2300 };
  if (rating >= 2100) return { name: 'Master', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', next: 'International Master', target: 2300, floor: 2100 };
  if (rating >= 1900) return { name: 'Candidate Master', bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400', next: 'Master', target: 2100, floor: 1900 };
  if (rating >= 1600) return { name: 'Expert', bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', next: 'Candidate Master', target: 1900, floor: 1600 };
  if (rating >= 1400) return { name: 'Specialist', bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400', next: 'Expert', target: 1600, floor: 1400 };
  if (rating >= 1200) return { name: 'Pupil', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', next: 'Specialist', target: 1400, floor: 1200 };
  return { name: 'Newbie', bg: 'bg-secondary border-border text-muted-foreground', next: 'Pupil', target: 1200, floor: 800 };
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
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
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [practicedCount, setPracticedCount] = useState(0);

  // LeetCode Ownership Verification Modal
  const [showSyncModal, setShowSyncModal] = useState(false);

  useEffect(() => {
    const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || 'guest-token';
    fetchUserData(token);

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
        rating: 1000,
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
    const isVerified = user?.leetcodeVerified;
    if (!handle || !isVerified) {
      setShowSyncModal(true);
      return;
    }

    setSyncingLeetCode(true);
    setSyncFeedback(null);

    try {
      const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || '';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/leetcode/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setSyncFeedback('Metrics synced from LeetCode');
        setTimeout(() => setSyncFeedback(null), 3000);
      } else {
        setShowSyncModal(true);
      }
    } catch {
      setShowSyncModal(true);
    } finally {
      setSyncingLeetCode(false);
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
        <div className="size-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rating = user?.rating || 1000;
  const rankMeta = getRankMeta(rating);
  const totalBattles = user?.totalBattles || stats?.totalBattles || 0;
  const wins = user?.battleWins ?? stats?.wins ?? 0;
  const losses = user?.battleLosses ?? stats?.losses ?? 0;
  const winStreak = user?.winStreak ?? stats?.winStreak ?? 0;

  // Rating progress calculation
  const pointsToNext = rankMeta.next ? Math.max(0, rankMeta.target - rating) : 0;
  const tierProgress = rankMeta.next
    ? Math.min(100, Math.max(8, ((rating - rankMeta.floor) / (rankMeta.target - rankMeta.floor)) * 100))
    : 100;

  const easySolved = user?.leetcodeEasySolved || 0;
  const medSolved = user?.leetcodeMediumSolved || 0;
  const hardSolved = user?.leetcodeHardSolved || 0;
  const totalSolved = user?.leetcodeTotalSolved || 0;
  const totalTarget = 4110;

  const easyPct = Math.min(100, (easySolved / totalTarget) * 100);
  const medPct = Math.min(100, (medSolved / totalTarget) * 100);
  const hardPct = Math.min(100, (hardSolved / totalTarget) * 100);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Authoritative LeetCode Profile Ownership Verification Modal */}
      <LeetCodeVerifyModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        currentUser={user}
        onSuccess={(updatedUser) => {
          setUser(updatedUser);
          setSyncFeedback('LeetCode profile ownership verified & authenticated');
          setTimeout(() => setSyncFeedback(null), 3500);
        }}
        onSyncComplete={(updatedUser) => {
          setUser(updatedUser);
          setSyncFeedback('Metrics synced from LeetCode');
          setTimeout(() => setSyncFeedback(null), 3000);
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Top Hero Command Center Banner */}
        <motion.div variants={itemVariants}>
          <div className="p-5 sm:p-6 rounded-xl border border-border/80 bg-card flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="size-16 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center font-semibold text-lg text-foreground">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="size-full object-cover" />
                  ) : (
                    user?.username?.substring(0, 2).toUpperCase() || 'CC'
                  )}
                </div>
              </div>

              {/* Username & Metadata */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                    {user?.username || 'Challenger'}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${rankMeta.bg}`}>
                    {rankMeta.name}
                  </span>

                  {/* Verified LeetCode Pill */}
                  {user?.leetcodeUsername ? (
                    <button
                      type="button"
                      onClick={() => setShowSyncModal(true)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-secondary hover:bg-muted border border-border text-foreground transition-colors"
                      title="Inspect LeetCode sync details"
                    >
                      <LeetCodeBrandIcon className="size-3 text-amber-500" />
                      <span>@{user.leetcodeUsername}</span>
                      <span className="text-[10px] text-muted-foreground font-sans">
                        {user.leetcodeVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSyncModal(true)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                    >
                      <LeetCodeBrandIcon className="size-3 text-amber-500" />
                      <span>Connect LeetCode</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">Rating: <strong className="text-foreground tabular-nums">{rating}</strong></span>
                  <span>&middot;</span>
                  <span>Handle: <code className="text-foreground font-mono">@{user?.handle || user?.username}</code></span>
                  <span>&middot;</span>
                  <span>Tier: <span className="text-foreground font-medium">{rankMeta.name}</span></span>
                </div>

                {/* Rating Progress to Next Tier */}
                {rankMeta.next && (
                  <div className="pt-1 max-w-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Tier progress</span>
                      <span className="text-foreground tabular-nums">
                        {pointsToNext > 0 ? `${pointsToNext} pts to ${rankMeta.next}` : 'Max tier'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${tierProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {user?.leetcodeUsername ? (
                <button
                  type="button"
                  onClick={handleSyncLeetCode}
                  disabled={syncingLeetCode}
                  className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted border border-border text-xs font-medium text-foreground transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
                  title="Pull latest solve stats and contest rating from LeetCode"
                >
                  <RefreshCw className={`size-3.5 ${syncingLeetCode ? 'animate-spin text-amber-500' : 'text-muted-foreground'}`} />
                  <span>{syncingLeetCode ? 'Syncing...' : 'Sync LeetCode'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSyncModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <LeetCodeBrandIcon className="size-3.5" />
                  <span>Connect LeetCode</span>
                </button>
              )}

              <Link
                href={`/profile/${encodeURIComponent(user?.handle || user?.username || 'Candidate')}`}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted border border-border text-xs font-medium text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <User className="size-3.5 text-muted-foreground" />
                <span>View profile</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
                title="Log out of session"
              >
                <LogOut className="size-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sync Toast Feedback Banner */}
        {syncFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              <span>{syncFeedback}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Just now</span>
          </motion.div>
        )}

        {/* 4 Primary Metric Cards */}
        <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Competitive Rating */}
          <div className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card space-y-2">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span className="font-mono uppercase text-[11px]">Rating</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Peak {user?.maxRating || rating}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-foreground font-mono tabular-nums">
              {rating}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Authoritative CodeClash competitive rating
            </p>
          </div>

          {/* Card 2: Arena Battles & Record */}
          <div className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card space-y-2">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span className="font-mono uppercase text-[11px]">Arena duels</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {wins}W &middot; {losses}L
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-foreground font-mono tabular-nums">
              {totalBattles}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              1v1 synchronized speed duels played
            </p>
          </div>

          {/* Card 3: Win Streak */}
          <div className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card space-y-2">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span className="font-mono uppercase text-[11px]">Win streak</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Best {user?.maxWinStreak || winStreak}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-foreground font-mono tabular-nums flex items-center gap-2">
              <span>{winStreak}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Active consecutive match victories
            </p>
          </div>

          {/* Card 4: LeetCode Profile Sync (Dedicated Card) */}
          <div
            onClick={() => setShowSyncModal(true)}
            className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors space-y-2 cursor-pointer group"
          >
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono uppercase text-[11px] text-foreground">
                <LeetCodeBrandIcon className="size-3.5 text-amber-500" />
                <span>LeetCode solved</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground">
                {user?.leetcodeVerified ? 'Verified' : user?.leetcodeUsername ? 'Unverified' : 'Connect'}
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-semibold text-foreground font-mono tabular-nums">
              {totalSolved}
            </div>

            {/* Micro Difficulty Segmented Bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
              <div style={{ width: `${easyPct}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${medPct}%` }} className="bg-amber-500 h-full" />
              <div style={{ width: `${hardPct}%` }} className="bg-rose-500 h-full" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-semibold tabular-nums">{easySolved}E</span>
                <span>&middot;</span>
                <span className="text-amber-500 font-semibold tabular-nums">{medSolved}M</span>
                <span>&middot;</span>
                <span className="text-rose-500 font-semibold tabular-nums">{hardSolved}H</span>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-0.5">
                Inspect &rarr;
              </span>
            </div>
          </div>
        </motion.div>

        {/* Practice Roadmap Progress Banner */}
        <motion.div variants={itemVariants}>
          <div className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground shrink-0">
                  <Compass className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      DSA practice roadmap tracker
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      18 patterns
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
                    Practiced problems
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                    {practicedCount} done
                  </span>
                </div>
                <Link
                  href="/roadmap"
                  className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Open roadmap</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Visual Mini Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Core 150 syllabus target</span>
                <span className="font-medium text-foreground tabular-nums">
                  {Math.min(100, Math.round((practicedCount / 150) * 100))}% completed
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(practicedCount > 0 ? 5 : 0, (practicedCount / 150) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Combat & Sparring Launchpad (4 Cards Grid) */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              <span>Combat &amp; sparring modes</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">1v1 synchronized engine</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Action 1: Ranked 1v1 Duel */}
            <Link
              href="/matchmaking?mode=ranked"
              className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="size-9 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                  <Swords className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Ranked duel</span>
                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Battle against opponents in your strict Elo rating bracket. Winner claims rating.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Strict Elo match</span>
              </div>
            </Link>

            {/* Action 2: Casual Practice */}
            <Link
              href="/matchmaking?mode=casual"
              className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="size-9 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                  <Code2 className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Casual sparring</span>
                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Practice with zero rating penalty. Test solutions with live clock pressure.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                <span>No rating risk</span>
              </div>
            </Link>

            {/* Action 3: Multiplayer Arena Lobby */}
            <Link
              href="/lobby"
              className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="size-9 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                  <Flame className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Arena lobby</span>
                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Browse open public battles or launch custom Battle Royale match rooms.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <span>Multiplayer &amp; BR</span>
              </div>
            </Link>

            {/* Action 4: Timed Proctor Assessment */}
            <Link
              href="/exam/demo-sync-session"
              className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="size-9 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Timed assessment</span>
                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Simulate real technical interviews with camera and tab-focus telemetry monitoring.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/60">
                <span>Proctoring audit</span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Quick Join Duel by Code & Instant Friend Challenge */}
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-12">
          {/* Quick Join Input (7 cols) */}
          <div className="md:col-span-7 p-5 sm:p-6 rounded-xl border border-border/80 bg-card space-y-3 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Hash className="size-4 text-muted-foreground" />
                <span>Enter room code or challenge link</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste a battle invite link or 4 to 8 character code to face off immediately.
              </p>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Hash className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    placeholder="e.g. DUEL-7X9B or battle URL"
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!quickCode.trim()}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors disabled:opacity-40 shrink-0 shadow-sm flex items-center gap-1.5"
                >
                  <Swords className="size-3.5" />
                  <span>Enter</span>
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
              <span>Quick links:</span>
              <Link href="/problems" className="hover:text-foreground transition-colors">
                Problems &rarr;
              </Link>
              <span>&middot;</span>
              <Link href="/rankings" className="hover:text-foreground transition-colors">
                Leaderboard &rarr;
              </Link>
            </div>
          </div>

          {/* Instant Challenge Generator (5 cols) */}
          <div className="md:col-span-5 p-5 sm:p-6 rounded-xl border border-border/80 bg-card space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Share2 className="size-4 text-muted-foreground" />
                <span>Challenge a friend 1v1</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate a synchronized battle link. Share it via Discord, WhatsApp, or Slack to spar on the same problem.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateChallenge}
                className="w-full py-2.5 px-4 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm bg-secondary hover:bg-muted text-foreground border border-border"
              >
                {copiedInvite ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-emerald-500">Invite link copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span>Copy private duel link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
