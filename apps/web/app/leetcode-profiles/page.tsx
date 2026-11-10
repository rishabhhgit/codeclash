'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Trophy,
  Swords,
  Users,
  Layers,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  Code2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import LeetCodeProfileCard, { LeetCodeCardData } from '../../components/leetcode/LeetCodeProfileCard';
import GenerateStatsModal from '../../components/leetcode/GenerateStatsModal';

function LeetCodeBrandIcon({ className = 'size-5' }: { className?: string }) {
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
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 26 },
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
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

  // Aggregated totals
  const totalSolvedAcrossProfiles = profiles.reduce((acc, p) => acc + (p.totalSolved || 0), 0);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background text-foreground py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 size-[650px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 size-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Generate Stats Modal */}
      <GenerateStatsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleProfileAdded}
      />

      <div className="max-w-7xl mx-auto space-y-9 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold shadow-sm">
            <LeetCodeBrandIcon className="size-3.5" />
            <span>LeetCode Profiles Showcase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground text-balance">
            Global LeetCode Hall of Fame
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty max-w-2xl mx-auto">
            Discover competitive coders worldwide, inspect real-time problem-solving distributions, and directly challenge fighters to synchronized 1v1 CodeClash duels.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="size-4" />
              <span>Generate / Pin Your Stat Card</span>
            </button>

            <Link
              href="/auth/register"
              className="px-5 py-2.5 rounded-2xl bg-secondary hover:bg-muted border border-border/80 text-foreground font-semibold text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <Users className="size-4 text-primary" />
              <span>Sign Up with LeetCode</span>
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <SpotlightCard className="p-4 rounded-2xl border-border/80 bg-card/80">
            <div className="text-[11px] font-mono uppercase text-muted-foreground">Tracked Profiles</div>
            <div className="text-2xl font-black text-foreground font-mono mt-1 tabular-nums">
              {totalItems}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 rounded-2xl border-border/80 bg-card/80">
            <div className="text-[11px] font-mono uppercase text-muted-foreground">Questions Solved</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1 tabular-nums">
              {totalSolvedAcrossProfiles.toLocaleString()}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 rounded-2xl border-border/80 bg-card/80">
            <div className="text-[11px] font-mono uppercase text-muted-foreground">Catalog Depth</div>
            <div className="text-2xl font-black text-primary font-mono mt-1 tabular-nums">
              4,110+
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 rounded-2xl border-border/80 bg-card/80">
            <div className="text-[11px] font-mono uppercase text-muted-foreground">Duel Engine</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1 tabular-nums">
              1v1 Sync
            </div>
          </SpotlightCard>
        </div>

        {/* Search, Filter & Sort Controls */}
        <SpotlightCard className="p-4 sm:p-5 rounded-2xl border-border/80 bg-card/85 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or real name (e.g. neal_wu)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 font-mono shadow-inner"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground shrink-0 flex items-center gap-1">
              <Filter className="size-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono text-foreground focus:outline-none focus:border-amber-500"
            >
              <option value="questions">Questions Solved (Highest)</option>
              <option value="rating">Contest Elo Rating</option>
              <option value="rank">Global Rank</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </SpotlightCard>

        {/* Profile Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-border bg-card/50 h-72 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-2xl bg-secondary" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-secondary rounded" />
                    <div className="h-3 w-20 bg-secondary rounded" />
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center gap-4">
                  <div className="size-24 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-secondary rounded" />
                    <div className="h-3 bg-secondary rounded" />
                    <div className="h-3 bg-secondary rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <SpotlightCard className="p-12 rounded-3xl border-border/80 bg-card/80 text-center space-y-4 max-w-lg mx-auto">
            <div className="size-14 mx-auto rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <LeetCodeBrandIcon className="size-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Profiles Found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No LeetCode profile matched &quot;{search}&quot;. Be the first to generate and pin this profile to the Hall of Fame!
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Search
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
              >
                Pin Profile
              </button>
            </div>
          </SpotlightCard>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {profiles.map((profile) => (
              <motion.div key={profile.username} variants={itemVariants}>
                <LeetCodeProfileCard data={profile} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
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
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
