'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Swords,
} from 'lucide-react';
import LeetCodeProfileCard, { LeetCodeCardData } from '../../components/leetcode/LeetCodeProfileCard';
import GenerateStatsModal from '../../components/leetcode/GenerateStatsModal';

function LeetCodeBrandIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
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

export default function LeetCodeProfilesPage() {
  const [profiles, setProfiles] = useState<LeetCodeCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'questions' | 'rating' | 'rank' | 'name'>('questions');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Quick pin inline form
  const [quickHandle, setQuickHandle] = useState('');
  const [quickPinLoading, setQuickPinLoading] = useState(false);
  const [quickPinMessage, setQuickPinMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        search: debouncedSearch,
        sortBy,
        page: page.toString(),
        limit: '12',
      });
      const res = await fetch(`${apiUrl}/api/leetcode/showcase?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setProfiles(data.data.items || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalItems(data.data.pagination?.total || 0);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, page]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleProfileAdded = (newProfile: LeetCodeCardData) => {
    setProfiles((prev) => [newProfile, ...prev.filter((p) => p.username !== newProfile.username)]);
    setTotalItems((prev) => prev + 1);
  };

  const handleProfileRemoved = (username: string) => {
    setProfiles((prev) => prev.filter((p) => p.username.toLowerCase() !== username.toLowerCase()));
    setTotalItems((prev) => Math.max(0, prev - 1));
  };

  const handleQuickPin = async (e: React.FormEvent) => {
    e.preventDefault();
    let clean = quickHandle.trim();
    if (!clean) return;

    if (clean.includes('/u/')) {
      const match = clean.match(/\/u\/([^/?#]+)/);
      if (match) clean = match[1];
    }
    clean = clean.replace(/^@/, '');

    setQuickPinLoading(true);
    setQuickPinMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/leetcode/showcase/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: clean }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to pin LeetCode handle');
      }

      setQuickPinMessage({ text: `Pinned @${data.data.username} to Hall of Fame` });
      setQuickHandle('');
      handleProfileAdded(data.data);
    } catch (err: any) {
      setQuickPinMessage({ text: err?.message || 'Failed to pin profile', error: true });
    } finally {
      setQuickPinLoading(false);
    }
  };

  const totalSolvedAcrossProfiles = profiles.reduce((acc, p) => acc + (p.totalSolved || 0), 0);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Generate / Preview Stats Modal */}
      <GenerateStatsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleProfileAdded}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary border border-border text-xs font-mono text-muted-foreground">
            <LeetCodeBrandIcon className="size-3.5 text-amber-500" />
            <span>LeetCode verified combatants</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-[1.15]">
            LeetCode Hall of Fame
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Inspect real-time problem-solving distributions, verified contest ratings, and challenge fighters directly to 1v1 CodeClash duels.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>Pin a LeetCode handle</span>
            </button>

            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-muted border border-border text-foreground font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <Users className="size-3.5 text-muted-foreground" />
              <span>Sign up with LeetCode</span>
            </Link>
          </div>
        </div>

        {/* Quick Pin Inline Bar */}
        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-foreground">Pin a profile to the Hall of Fame</div>
              <div className="text-[11px] text-muted-foreground">
                Enter any public LeetCode handle to mirror their verified problem metrics.
              </div>
            </div>
            {quickPinMessage && (
              <div
                className={`text-xs font-mono flex items-center gap-1.5 ${
                  quickPinMessage.error ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {quickPinMessage.error ? (
                  <AlertCircle className="size-3.5" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>{quickPinMessage.text}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleQuickPin} className="flex items-center gap-2 max-w-lg pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickHandle}
                onChange={(e) => setQuickHandle(e.target.value)}
                placeholder="LeetCode username (e.g. rishabhh-dev)"
                disabled={quickPinLoading}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={quickPinLoading || !quickHandle.trim()}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              {quickPinLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Pin profile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Telemetry Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-0.5">
            <div className="text-[11px] font-mono text-muted-foreground">Tracked profiles</div>
            <div className="text-xl font-semibold text-foreground font-mono tabular-nums">
              {totalItems}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-0.5">
            <div className="text-[11px] font-mono text-muted-foreground">Solved questions</div>
            <div className="text-xl font-semibold text-foreground font-mono tabular-nums">
              {totalSolvedAcrossProfiles.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-0.5">
            <div className="text-[11px] font-mono text-muted-foreground">Catalog depth</div>
            <div className="text-xl font-semibold text-foreground font-mono tabular-nums">
              3,129
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-0.5">
            <div className="text-[11px] font-mono text-muted-foreground">Combat engine</div>
            <div className="text-xl font-semibold text-foreground font-mono tabular-nums">
              1v1 Elo Sync
            </div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 font-mono transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground shrink-0 flex items-center gap-1">
              <Filter className="size-3" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-mono text-foreground focus:outline-none focus:border-foreground/40"
            >
              <option value="questions">Questions solved</option>
              <option value="rating">Contest Elo</option>
              <option value="rank">Global rank</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Profile Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-border/70 bg-card h-64 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-28 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-px bg-border/60" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-xl border border-border/80 bg-card text-center space-y-3 max-w-md mx-auto">
            <div className="size-10 mx-auto rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
              <LeetCodeBrandIcon className="size-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No profiles pinned to the Hall of Fame yet
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pin your own LeetCode handle using the box above, or sign up with your handle to appear automatically.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors shadow-sm"
              >
                Pin your profile
              </button>
              <Link
                href="/auth/register"
                className="px-3.5 py-2 rounded-lg bg-secondary hover:bg-muted border border-border text-foreground font-medium text-xs transition-colors"
              >
                Sign up with handle
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {profiles.map((profile) => (
              <motion.div key={profile.username} variants={itemVariants}>
                <LeetCodeProfileCard data={profile} onRemove={handleProfileRemoved} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground px-3">
              Page <strong className="text-foreground">{page}</strong> of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
