'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  FolderTree,
  ListFilter,
  Shuffle,
  Swords,
  GitFork,
  Boxes,
  Network,
  Link2,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
  Hash,
  MoveHorizontal,
  Sliders,
  Flame,
  Undo2,
  Zap,
  Timer,
  Compass,
  Binary,
  Cpu,
} from 'lucide-react';
import { getAllQuestions, LIST_OF_QUESTIONS, ROADMAP_CATEGORIES } from '../../lib/questions/data';
import { Difficulty, LeetCodeQuestion } from '../../lib/questions/types';

type ListPreset = 'all' | 'top75' | 'core150' | 'mastery250' | 'list';

interface TopicMeta {
  name: string;
  key: string;
  description: string;
  icon: any;
}

const TOPIC_DEFINITIONS: TopicMeta[] = [
  {
    name: 'Arrays & Hashing',
    key: 'arrays',
    description: 'Hash tables, frequency counts, prefix products, matrix hashing',
    icon: Hash,
  },
  {
    name: 'Two Pointers',
    key: 'two_pointers',
    description: 'Opposite direction pointers, slow and fast runners, sorted array combos',
    icon: MoveHorizontal,
  },
  {
    name: 'Sliding Window',
    key: 'sliding_window',
    description: 'Dynamic subarray windows, longest substring patterns, max continuous sums',
    icon: Sliders,
  },
  {
    name: 'Stack',
    key: 'stacks',
    description: 'LIFO evaluations, monotonic stack patterns, bracket validation',
    icon: Layers,
  },
  {
    name: 'Binary Search',
    key: 'binary_search',
    description: 'Logarithmic search, rotated array pivots, search space bisection',
    icon: Search,
  },
  {
    name: 'Linked List',
    key: 'linked_lists',
    description: 'Pointers, cycle detection, list reversal, merge sort on nodes',
    icon: Link2,
  },
  {
    name: 'Trees',
    key: 'trees',
    description: 'Binary trees, BST traversal, depth calculations, lowest common ancestor',
    icon: GitFork,
  },
  {
    name: 'Tries',
    key: 'tries',
    description: 'Prefix trees, word searches, autocomplete dictionaries',
    icon: Network,
  },
  {
    name: 'Heap / Priority Queue',
    key: 'heaps',
    description: 'Min/max heaps, top-K frequent elements, running median trackers',
    icon: Flame,
  },
  {
    name: 'Backtracking',
    key: 'backtracking',
    description: 'Combinations, permutations, N-Queens, recursive search pruning',
    icon: Undo2,
  },
  {
    name: 'Graphs',
    key: 'graphs',
    description: 'BFS, DFS, connected components, cycle detection, topological sort',
    icon: Network,
  },
  {
    name: 'Advanced Graphs',
    key: 'advanced_graphs',
    description: "Dijkstra's shortest path, Kruskal's MST, Bellman-Ford paths",
    icon: Cpu,
  },
  {
    name: '1-D Dynamic Programming',
    key: 'dynamic_programming',
    description: 'Climbing stairs, coin change, house robber, memoization & tabulation',
    icon: Boxes,
  },
  {
    name: '2-D Dynamic Programming',
    key: '2_d_dynamic_programming',
    description: 'Grid paths, 0/1 knapsack, edit distance, longest common subsequence',
    icon: Boxes,
  },
  {
    name: 'Greedy',
    key: 'greedy',
    description: 'Locally optimal choices, jump games, gas stations, interval scheduling',
    icon: Zap,
  },
  {
    name: 'Intervals',
    key: 'intervals',
    description: 'Merge intervals, non-overlapping intervals, insert intervals',
    icon: Timer,
  },
  {
    name: 'Math & Geometry',
    key: 'math',
    description: 'Matrix rotations, spiral matrix, GCD, prime factorizations',
    icon: Compass,
  },
  {
    name: 'Bit Manipulation',
    key: 'bit_manipulation',
    description: 'Bitwise XOR, hamming weight, counting bits, bit shifts',
    icon: Binary,
  },
  {
    name: 'JavaScript',
    key: 'javascript',
    description: 'Closures, promises, event loop, functional transformations',
    icon: Code2,
  },
];

export default function ProblemsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedPreset, setSelectedPreset] = useState<ListPreset>('all');
  const [viewLayout, setViewLayout] = useState<'topic' | 'table'>('topic');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const allQuestions = useMemo(() => getAllQuestions(), []);

  // Filter based on selected preset track
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

  // Normalize topic key for category matching
  const normalizeCat = (cat?: string) => {
    if (!cat) return 'other';
    return cat.toLowerCase().replace(/[-\s&/]+/g, '_');
  };

  // Filtered Questions by search, difficulty, and selected topic
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

      const matchTopic =
        selectedTopic === 'all' ||
        normalizeCat(q.category) === normalizeCat(selectedTopic) ||
        (q.topics && q.topics.some((t) => normalizeCat(t) === normalizeCat(selectedTopic)));

      return matchSearch && matchDifficulty && matchTopic;
    });
  }, [presetQuestions, search, difficultyFilter, selectedTopic]);

  // Questions organized topic-wise in canonical roadmap sequence
  const topicWiseSections = useMemo(() => {
    const sections: {
      meta: TopicMeta;
      questions: LeetCodeQuestion[];
      counts: { easy: number; medium: number; hard: number; total: number };
    }[] = [];

    // Map questions by category and topic tags
    const questionBuckets = new Map<string, LeetCodeQuestion[]>();
    for (const q of filteredQuestions) {
      const normCat = normalizeCat(q.category);
      if (!questionBuckets.has(normCat)) {
        questionBuckets.set(normCat, []);
      }
      questionBuckets.get(normCat)!.push(q);
    }

    for (const def of TOPIC_DEFINITIONS) {
      const normKey = normalizeCat(def.name);
      const list = questionBuckets.get(normKey) || [];

      if (list.length > 0 || selectedTopic === def.name || selectedTopic === def.key) {
        let easy = 0;
        let medium = 0;
        let hard = 0;
        for (const q of list) {
          const d = q.difficulty.toLowerCase();
          if (d === 'easy') easy++;
          else if (d === 'medium') medium++;
          else if (d === 'hard') hard++;
        }

        sections.push({
          meta: def,
          questions: list,
          counts: { easy, medium, hard, total: list.length },
        });
      }
    }

    // Capture any leftovers under "Other"
    const knownKeys = new Set(TOPIC_DEFINITIONS.map((d) => normalizeCat(d.name)));
    const otherQuestions: LeetCodeQuestion[] = [];
    for (const [key, qs] of questionBuckets.entries()) {
      if (!knownKeys.has(key)) {
        otherQuestions.push(...qs);
      }
    }

    if (otherQuestions.length > 0) {
      let easy = 0;
      let medium = 0;
      let hard = 0;
      for (const q of otherQuestions) {
        const d = q.difficulty.toLowerCase();
        if (d === 'easy') easy++;
        else if (d === 'medium') medium++;
        else if (d === 'hard') hard++;
      }
      sections.push({
        meta: {
          name: 'Other Algorithmic Patterns',
          key: 'other',
          description: 'Specialized competitive programming and system interview questions',
          icon: Code2,
        },
        questions: otherQuestions,
        counts: { easy, medium, hard, total: otherQuestions.length },
      });
    }

    return sections;
  }, [filteredQuestions, selectedTopic]);

  // Overall topic counts for the quick ribbon
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of presetQuestions) {
      const k = normalizeCat(q.category);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return counts;
  }, [presetQuestions]);

  // Random problem selector
  const randomProblemSlug = useMemo(() => {
    if (filteredQuestions.length === 0) return 'concatenation-of-array';
    const rand = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
    return rand.slug;
  }, [filteredQuestions]);

  const toggleTopicExpand = (topicName: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicName]: !prev[topicName],
    }));
  };

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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mb-2">
              <span>TOPIC-BASED PROBLEM DIRECTORY</span>
              <span>•</span>
              <span>18 DSA TRACKS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              DSA Problem Library
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
              Arranged topic-wise with verified test suites, 1v1 duel links, and curated tracks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/roadmap"
              className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <span>🗺️ Practice Roadmap</span>
            </Link>

            <Link
              href="/lobby"
              className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <Swords className="size-3.5 text-primary" />
              <span>Battle Lobby</span>
            </Link>

            <Link
              href={`/problems/${randomProblemSlug}`}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <Shuffle className="size-3.5" />
              <span>Solve Random</span>
            </Link>
          </div>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border inline-flex">
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
            Blind 75 <span className="tabular-nums">(75)</span>
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

        {/* Prominent Topic Ribbon (Quick Filter by Topic) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Topic Explorer
            </span>
            <span className="text-[11px] text-muted-foreground">
              Click any topic to filter or launch a duel
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => {
                setSelectedTopic('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                selectedTopic === 'all'
                  ? 'bg-foreground text-background font-bold shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30'
              }`}
            >
              All Topics
            </button>

            {TOPIC_DEFINITIONS.map((def) => {
              const IconComp = def.icon;
              const count = topicCounts.get(normalizeCat(def.name)) || 0;
              const isSelected = selectedTopic === def.name || selectedTopic === def.key;
              return (
                <button
                  key={def.key}
                  onClick={() => {
                    setSelectedTopic(isSelected ? 'all' : def.name);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm ring-1 ring-primary'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30'
                  }`}
                >
                  <IconComp className="size-3" />
                  <span>{def.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-mono opacity-80 tabular-nums">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Search Box */}
          <div className="sm:col-span-7 relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, number, or pattern (e.g. Invert Binary Tree, 226)..."
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
          <div className="sm:col-span-3">
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Layout Mode Toggle */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1 bg-muted/60 p-0.5 rounded-xl border border-border">
            <button
              onClick={() => setViewLayout('topic')}
              className={`flex-1 py-1.5 text-center text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors ${
                viewLayout === 'topic'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Organized topic by topic"
            >
              <FolderTree className="size-3.5" />
              <span>Topic-Wise</span>
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`flex-1 py-1.5 text-center text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors ${
                viewLayout === 'table'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Flat Table View"
            >
              <ListFilter className="size-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Result Counter */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>
            Showing <strong className="text-foreground tabular-nums">{filteredQuestions.length}</strong> matching questions
            {selectedTopic !== 'all' && (
              <span> in <strong className="text-primary">{selectedTopic}</strong></span>
            )}
          </span>
          {viewLayout === 'table' && totalPages > 1 && (
            <span>
              Page <strong className="text-foreground tabular-nums">{page}</strong> of <strong className="text-foreground tabular-nums">{totalPages}</strong>
            </span>
          )}
        </div>

        {/* View Mode 1: Topic-Wise Arrangement */}
        {viewLayout === 'topic' ? (
          <div className="space-y-6">
            {topicWiseSections.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-border bg-card">
                <p className="text-xs text-muted-foreground">
                  No questions match your current search or difficulty filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setDifficultyFilter('all');
                    setSelectedTopic('all');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              topicWiseSections.map((sec) => {
                const IconComp = sec.meta.icon;
                const isSingleTopicSelected = selectedTopic !== 'all';
                const isExpanded = expandedTopics[sec.meta.name] || isSingleTopicSelected;
                const displayedQuestions = isExpanded ? sec.questions : sec.questions.slice(0, 10);
                const hasMore = sec.questions.length > 10 && !isSingleTopicSelected;

                return (
                  <div
                    key={sec.meta.name}
                    className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                  >
                    {/* Topic Header */}
                    <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                          <IconComp className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm text-foreground">{sec.meta.name}</h2>
                            <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-muted text-muted-foreground border border-border">
                              {sec.counts.total} problems
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {sec.meta.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {/* Difficulty breakdown pills */}
                        <div className="hidden md:flex items-center gap-1 text-[10px] font-mono">
                          {sec.counts.easy > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {sec.counts.easy} Easy
                            </span>
                          )}
                          {sec.counts.medium > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {sec.counts.medium} Med
                            </span>
                          )}
                          {sec.counts.hard > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              {sec.counts.hard} Hard
                            </span>
                          )}
                        </div>

                        {/* Duel topic shortcut */}
                        <Link
                          href={`/battle/create?topic=${sec.meta.key}`}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95"
                          title={`Launch Battle strictly on ${sec.meta.name}`}
                        >
                          <Swords className="size-3.5" />
                          <span>Duel Topic</span>
                        </Link>
                      </div>
                    </div>

                    {/* Question List in this Topic */}
                    <div className="divide-y divide-border/60">
                      {displayedQuestions.map((q) => (
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
                              className="p-1.5 rounded-md hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-colors active:scale-95"
                              title={`Duel a friend on ${q.title}`}
                              aria-label={`Duel a friend on ${q.title}`}
                            >
                              <Swords className="size-3.5" />
                            </Link>

                            <Link
                              href={`/problems/${q.slug}/question`}
                              className="px-2.5 py-1 rounded-lg bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground text-xs font-medium transition-colors active:scale-[0.98] flex items-center gap-1 border border-border"
                            >
                              <span>Solve</span>
                              <ArrowRight className="size-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Expand/Collapse Toggle if topic has more problems */}
                    {hasMore && (
                      <div className="p-2 bg-muted/20 border-t border-border text-center">
                        <button
                          type="button"
                          onClick={() => toggleTopicExpand(sec.meta.name)}
                          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 py-1"
                        >
                          {isExpanded ? (
                            <>
                              <span>Collapse to top 10</span>
                              <ChevronUp className="size-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Show all {sec.questions.length} problems in {sec.meta.name}</span>
                              <ChevronDown className="size-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* View Mode 2: Flat Table View */
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
                            className="p-1 rounded-md hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-colors active:scale-95"
                            title={`Duel a friend on ${q.title}`}
                            aria-label={`Duel a friend on ${q.title}`}
                          >
                            <Swords className="size-3.5" />
                          </Link>
                          <Link
                            href={`/problems/${q.slug}/question`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground font-medium transition-colors active:scale-[0.98] border border-border"
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
