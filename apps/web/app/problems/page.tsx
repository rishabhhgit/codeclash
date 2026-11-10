'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Play,
  Shield,
  ArrowRight,
  FolderTree,
  ListFilter,
  Code2,
  Shuffle,
  Swords,
} from 'lucide-react';
import { getAllQuestions, LIST_OF_QUESTIONS, ROADMAP_CATEGORIES } from '../../lib/questions/data';
import { Difficulty, LeetCodeQuestion } from '../../lib/questions/types';

type ListPreset = 'all' | 'top75' | 'core150' | 'mastery250' | 'list';

export default function ProblemsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPreset, setSelectedPreset] = useState<ListPreset>('all');
  const [viewLayout, setViewLayout] = useState<'categories' | 'table'>('categories');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const allQuestions = useMemo(() => getAllQuestions(), []);

  // Filter based on selected preset list
  const presetQuestions = useMemo(() => {
    switch (selectedPreset) {
      case 'core150':
        return LIST_OF_QUESTIONS.filter((q) => q.core150 || q.neetcode150);
      case 'mastery250':
        return LIST_OF_QUESTIONS.filter((q) => q.mastery250 || q.neetcode250);
      case 'top75':
        return LIST_OF_QUESTIONS.filter((q) => q.blind75);
      case 'list':
        return LIST_OF_QUESTIONS;
      case 'all':
      default:
        return allQuestions;
    }
  }, [selectedPreset, allQuestions]);

  // Filtered Questions by search, difficulty, category
  const filteredQuestions = useMemo(() => {
    return presetQuestions.filter((q) => {
      const matchSearch =
        search === '' ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.slug.toLowerCase().includes(search.toLowerCase()) ||
        String(q.number).includes(search);

      const matchDifficulty =
        difficultyFilter === 'all' ||
        q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      const matchCategory =
        categoryFilter === 'all' ||
        q.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchDifficulty && matchCategory;
    });
  }, [presetQuestions, search, difficultyFilter, categoryFilter]);

  // Grouped by Category for category view
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, LeetCodeQuestion[]> = {};
    for (const q of filteredQuestions) {
      const cat = q.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    }
    return groups;
  }, [filteredQuestions]);

  // Random problem selector
  const randomProblemSlug = useMemo(() => {
    if (presetQuestions.length === 0) return 'concatenation-of-array';
    const rand = presetQuestions[Math.floor(Math.random() * presetQuestions.length)];
    return rand.slug;
  }, [presetQuestions]);

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Hard':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }
  };

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, page]);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Problem Library
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              {allQuestions.length.toLocaleString()} algorithmic problems across 18 topics with verified test suites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/lobby"
              className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-medium transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5"
            >
              <Swords className="size-3.5 text-orange-400" />
              Arena Matches
            </Link>

            <Link
              href={`/problems/${randomProblemSlug}`}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <Shuffle className="size-3.5" />
              Pick Random
            </Link>
          </div>
        </div>

        {/* Preset Selector Tabs (shadcn/ui style pill segmented control) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border inline-flex">
          <button
            onClick={() => {
              setSelectedPreset('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              selectedPreset === 'all'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            All Problems <span className="tabular-nums">({allQuestions.length.toLocaleString()})</span>
          </button>
          <button
            onClick={() => {
              setSelectedPreset('top75');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              selectedPreset === 'top75'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Top 75 <span className="tabular-nums">(75)</span>
          </button>
          <button
            onClick={() => {
              setSelectedPreset('core150');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              selectedPreset === 'core150'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Core 150 <span className="tabular-nums">(150)</span>
          </button>
          <button
            onClick={() => {
              setSelectedPreset('mastery250');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              selectedPreset === 'mastery250'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Mastery 250 <span className="tabular-nums">(250)</span>
          </button>
          <button
            onClick={() => {
              setSelectedPreset('list');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
              selectedPreset === 'list'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Curated Track <span className="tabular-nums">({LIST_OF_QUESTIONS.length.toLocaleString()})</span>
          </button>
        </div>

        {/* Filter Controls & Search (shadcn/ui & 21st.dev style) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, slug, or number (e.g. Concatenation of Array, 1929)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-12 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors shadow-sm"
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground select-none">
              /
            </kbd>
          </div>

          {/* Difficulty Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
            >
              <option value="all">All Categories</option>
              {ROADMAP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Mode Toggle */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewLayout('categories')}
              className={`flex-1 py-1.5 text-center text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                viewLayout === 'categories'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grouped by Roadmap Categories"
            >
              <FolderTree className="w-3.5 h-3.5" />
              Roadmap
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`flex-1 py-1.5 text-center text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                viewLayout === 'table'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Flat Table View"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>

        {/* Result Counter */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>
            Showing <strong className="text-foreground tabular-nums">{filteredQuestions.length}</strong> matching questions
          </span>
          {viewLayout === 'table' && totalPages > 1 && (
            <span>
              Page <strong className="text-foreground tabular-nums">{page}</strong> of <strong className="text-foreground tabular-nums">{totalPages}</strong>
            </span>
          )}
        </div>

        {/* View Mode 1: Grouped by Roadmap Category */}
        {viewLayout === 'categories' ? (
          <div className="space-y-4">
            {Object.entries(groupedByCategory).map(([category, questions]) => (
              <div
                key={category}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                    <h2 className="font-semibold text-xs text-foreground">{category}</h2>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                    {questions.length} problems
                  </span>
                </div>

                <div className="divide-y divide-border/60">
                  {questions.map((q) => (
                    <div
                      key={q.slug}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono tabular-nums text-muted-foreground w-12 shrink-0">
                          #{q.number}
                        </span>

                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <Link
                            href={`/problems/${q.slug}/question`}
                            className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate"
                          >
                            {q.title}
                          </Link>

                          {q.core150 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-emerald-500 border border-emerald-500/20">
                              Core 150
                            </span>
                          )}
                          {q.mastery250 && !q.core150 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-purple-400 border border-purple-500/20">
                              Mastery 250
                            </span>
                          )}
                          {q.blind75 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-sky-500 border border-sky-500/20">
                              Top 75
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs font-mono tabular-nums text-muted-foreground hidden sm:inline">
                          {q.acceptanceRate}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getDifficultyColor(
                            q.difficulty
                          )}`}
                        >
                          {q.difficulty}
                        </span>

                        <Link
                          href={`/battle/create?slug=${q.slug}`}
                          className="p-1 rounded-md hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-colors duration-150 active:scale-95"
                          title="Duel a friend 1v1 on this problem"
                          aria-label={`Duel a friend 1v1 on ${q.title}`}
                        >
                          <Swords className="size-3.5" />
                        </Link>

                        <Link
                          href={`/problems/${q.slug}/question`}
                          className="px-2.5 py-1 rounded bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground text-xs font-medium transition-colors duration-150 active:scale-[0.98] flex items-center gap-1 border border-border"
                        >
                          <span>Solve</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* View Mode 2: Flat Table View */
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="py-2.5 px-3.5 w-14 text-center">#</th>
                    <th className="py-2.5 px-3.5">Title</th>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5">Difficulty</th>
                    <th className="py-2.5 px-3.5">Acceptance</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedQuestions.map((q) => (
                    <tr
                      key={q.slug}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 text-center font-mono tabular-nums text-muted-foreground">
                        {q.number}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/problems/${q.slug}/question`}
                            className="font-medium text-foreground group-hover:text-primary transition-colors"
                          >
                            {q.title}
                          </Link>
                          {q.core150 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-emerald-500 border border-emerald-500/20">
                              Core 150
                            </span>
                          )}
                          {q.mastery250 && !q.core150 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-purple-400 border border-purple-500/20">
                              Mastery 250
                            </span>
                          )}
                          {q.blind75 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-sky-500 border border-sky-500/20">
                              Top 75
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-muted-foreground">{q.category}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getDifficultyColor(
                            q.difficulty
                          )}`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono tabular-nums text-muted-foreground">
                        {q.acceptanceRate}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/battle/create?slug=${q.slug}`}
                            className="p-1 rounded-md hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-colors duration-150 active:scale-95"
                            title="Duel a friend 1v1 on this problem"
                            aria-label={`Duel a friend 1v1 on ${q.title}`}
                          >
                            <Swords className="size-3.5" />
                          </Link>
                          <Link
                            href={`/problems/${q.slug}/question`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground font-medium transition-colors duration-150 active:scale-[0.98] border border-border"
                          >
                            <span>Solve</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredQuestions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No questions match your current filters.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  <span>Page</span>
                  <span className="text-foreground tabular-nums font-bold">{page}</span>
                  <span>of</span>
                  <span className="text-foreground tabular-nums font-bold">{totalPages}</span>
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
