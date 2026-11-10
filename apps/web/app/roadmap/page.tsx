'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  MoveHorizontal,
  Sliders,
  Layers,
  Search,
  Link2,
  GitFork,
  Network,
  Flame,
  Undo2,
  Boxes,
  Zap,
  Timer,
  Compass,
  Binary,
  Cpu,
  CheckCircle2,
  Circle,
  Swords,
  ArrowRight,
  BookOpen,
  Shuffle,
  Sparkles,
  Trophy,
  Code2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import { CURATED_ALL_QUESTIONS, LIST_OF_QUESTIONS } from '../../lib/questions/data';
import { LeetCodeQuestion, Difficulty } from '../../lib/questions/types';

type TrackFilter = 'core150' | 'blind75' | 'mastery250' | 'all';

interface RoadmapTopicNode {
  id: string;
  name: string;
  categoryName: string;
  topicKey: string;
  tier: number;
  tierName: string;
  description: string;
  cheatSheet: string;
  prerequisites: string[];
  icon: any;
}

const ROADMAP_TOPICS: RoadmapTopicNode[] = [
  // Phase 1: Foundations
  {
    id: 'arrays-hashing',
    name: 'Arrays & Hashing',
    categoryName: 'Arrays & Hashing',
    topicKey: 'arrays',
    tier: 1,
    tierName: 'Phase 1: Foundations',
    description: 'Hash tables, frequency counts, prefix products, and matrix coordinate indexing.',
    cheatSheet: 'Look for lookup bottlenecks (O(N) to O(1)). Use HashMaps for frequency counting and HashSets for seen elements.',
    prerequisites: [],
    icon: Hash,
  },
  // Phase 2: Linear Structures & Search
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    categoryName: 'Two Pointers',
    topicKey: 'two_pointers',
    tier: 2,
    tierName: 'Phase 2: Linear Structures & Search',
    description: 'Opposite direction pointers, slow and fast runners, sorted array transformations.',
    cheatSheet: 'Requires sorted arrays or palindromes. Move left/right inwards based on target comparison.',
    prerequisites: ['Arrays & Hashing'],
    icon: MoveHorizontal,
  },
  {
    id: 'stack',
    name: 'Stack',
    categoryName: 'Stack',
    topicKey: 'stacks',
    tier: 2,
    tierName: 'Phase 2: Linear Structures & Search',
    description: 'LIFO evaluations, monotonic stack patterns, bracket validation.',
    cheatSheet: 'Use when previous elements need to be remembered in reverse order or for next-greater/smaller element problems.',
    prerequisites: ['Arrays & Hashing'],
    icon: Layers,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    categoryName: 'Binary Search',
    topicKey: 'binary_search',
    tier: 2,
    tierName: 'Phase 2: Linear Structures & Search',
    description: 'Logarithmic reduction, rotated array pivots, search space bisection.',
    cheatSheet: 'Key condition: monotonic search space. Check mid vs target, carefully handle edge bounds (left <= right vs left < right).',
    prerequisites: ['Two Pointers'],
    icon: Search,
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    categoryName: 'Sliding Window',
    topicKey: 'sliding_window',
    tier: 2,
    tierName: 'Phase 2: Linear Structures & Search',
    description: 'Dynamic subarray windows, longest substring patterns, max continuous sums.',
    cheatSheet: 'Expand right pointer to satisfy condition; shrink left pointer once condition is violated.',
    prerequisites: ['Two Pointers'],
    icon: Sliders,
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    categoryName: 'Linked List',
    topicKey: 'linked_lists',
    tier: 2,
    tierName: 'Phase 2: Linear Structures & Search',
    description: 'Pointers, cycle detection, list reversal, merge sort on nodes.',
    cheatSheet: 'Always use a dummy head node to simplify edge cases. Fast/slow pointers for cycles and finding middle nodes.',
    prerequisites: ['Two Pointers', 'Stack'],
    icon: Link2,
  },
  // Phase 3: Trees & Recursive Search
  {
    id: 'trees',
    name: 'Trees & BST',
    categoryName: 'Trees',
    topicKey: 'trees',
    tier: 3,
    tierName: 'Phase 3: Trees & Recursive Search',
    description: 'Binary trees, BST traversal, depth calculations, lowest common ancestor.',
    cheatSheet: 'Recursion (DFS) solves 90% of tree problems. Use queue for level-order (BFS). BST in-order traversal is sorted.',
    prerequisites: ['Binary Search', 'Linked List'],
    icon: GitFork,
  },
  {
    id: 'tries',
    name: 'Tries',
    categoryName: 'Tries',
    topicKey: 'tries',
    tier: 3,
    tierName: 'Phase 3: Trees & Recursive Search',
    description: 'Prefix trees, word searches, autocomplete dictionaries.',
    cheatSheet: '26-way tree node with isEndOfWord boolean. Perfect for prefix searching and dictionary lookups.',
    prerequisites: ['Trees & BST'],
    icon: Network,
  },
  {
    id: 'heap',
    name: 'Heap / Priority Queue',
    categoryName: 'Heap / Priority Queue',
    topicKey: 'heaps',
    tier: 3,
    tierName: 'Phase 3: Trees & Recursive Search',
    description: 'Min/max heaps, top-K frequent elements, running median trackers.',
    cheatSheet: 'Whenever you see "Top K", "Smallest K", or dynamic median, reach for a priority queue.',
    prerequisites: ['Trees & BST'],
    icon: Flame,
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    categoryName: 'Backtracking',
    topicKey: 'backtracking',
    tier: 3,
    tierName: 'Phase 3: Trees & Recursive Search',
    description: 'Combinations, permutations, N-Queens, recursive search pruning.',
    cheatSheet: 'Template: Choose -> Explore (recurse) -> Unchoose (backtrack). Prune invalid branches early.',
    prerequisites: ['Trees & BST'],
    icon: Undo2,
  },
  // Phase 4: Graphs & Dynamic Programming
  {
    id: 'graphs',
    name: 'Graphs & BFS/DFS',
    categoryName: 'Graphs',
    topicKey: 'graphs',
    tier: 4,
    tierName: 'Phase 4: Non-Linear Graphs & DP',
    description: 'BFS, DFS, connected components, cycle detection, topological sort.',
    cheatSheet: 'Build adjacency list. Use visited set to prevent infinite loops. BFS for shortest path in unweighted graphs.',
    prerequisites: ['Backtracking'],
    icon: Network,
  },
  {
    id: '1d-dp',
    name: '1-D Dynamic Programming',
    categoryName: '1-D Dynamic Programming',
    topicKey: 'dynamic_programming',
    tier: 4,
    tierName: 'Phase 4: Non-Linear Graphs & DP',
    description: 'Climbing stairs, coin change, house robber, memoization & tabulation.',
    cheatSheet: 'Identify subproblem: dp[i] depends on dp[i-1], dp[i-2]. Start top-down with memo, convert to bottom-up table.',
    prerequisites: ['Backtracking'],
    icon: Boxes,
  },
  {
    id: 'advanced-graphs',
    name: 'Advanced Graphs',
    categoryName: 'Advanced Graphs',
    topicKey: 'advanced_graphs',
    tier: 4,
    tierName: 'Phase 4: Non-Linear Graphs & DP',
    description: "Dijkstra's shortest path, Kruskal's MST, Bellman-Ford paths.",
    cheatSheet: 'Weighted shortest path: Dijkstra with Min-Heap. Disjoint set (Union-Find) for Kruskal and connectivity checks.',
    prerequisites: ['Graphs & BFS/DFS', 'Heap / Priority Queue'],
    icon: Cpu,
  },
  {
    id: '2d-dp',
    name: '2-D Dynamic Programming',
    categoryName: '2-D Dynamic Programming',
    topicKey: '2_d_dynamic_programming',
    tier: 4,
    tierName: 'Phase 4: Non-Linear Graphs & DP',
    description: 'Grid paths, 0/1 knapsack, edit distance, longest common subsequence.',
    cheatSheet: 'Two states (i, j). Look at decisions: take or skip, match or replace. Check previous row and column.',
    prerequisites: ['1-D Dynamic Programming'],
    icon: Boxes,
  },
  // Phase 5: Patterns & Applied Mastery
  {
    id: 'greedy',
    name: 'Greedy',
    categoryName: 'Greedy',
    topicKey: 'greedy',
    tier: 5,
    tierName: 'Phase 5: Patterns & Applied Mastery',
    description: 'Locally optimal choices, jump games, gas stations, interval scheduling.',
    cheatSheet: 'Sort by end time or weight first. If locally optimal choice leads to global optimum without backtracking, use greedy.',
    prerequisites: ['1-D Dynamic Programming'],
    icon: Zap,
  },
  {
    id: 'intervals',
    name: 'Intervals',
    categoryName: 'Intervals',
    topicKey: 'intervals',
    tier: 5,
    tierName: 'Phase 5: Patterns & Applied Mastery',
    description: 'Merge intervals, non-overlapping intervals, insert intervals.',
    cheatSheet: 'Always sort intervals by start time first! Compare current interval start with previous interval end.',
    prerequisites: ['Arrays & Hashing', 'Greedy'],
    icon: Timer,
  },
  {
    id: 'math-geometry',
    name: 'Math & Geometry',
    categoryName: 'Math & Geometry',
    topicKey: 'math',
    tier: 5,
    tierName: 'Phase 5: Patterns & Applied Mastery',
    description: 'Matrix rotations, spiral matrix, GCD, prime factorizations.',
    cheatSheet: 'Boundary pointers (top/bottom/left/right) for spiral. Transpose then reverse rows for matrix rotation.',
    prerequisites: ['Arrays & Hashing'],
    icon: Compass,
  },
  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    categoryName: 'Bit Manipulation',
    topicKey: 'bit_manipulation',
    tier: 5,
    tierName: 'Phase 5: Patterns & Applied Mastery',
    description: 'Bitwise XOR, hamming weight, counting bits, bit shifts.',
    cheatSheet: 'XOR cancels identical numbers (a ^ a = 0). Clear lowest set bit: n & (n - 1). Check i-th bit: (n >> i) & 1.',
    prerequisites: ['Math & Geometry'],
    icon: Binary,
  },
];

export default function RoadmapPracticePage() {
  const [selectedTrack, setSelectedTrack] = useState<TrackFilter>('core150');
  const [activeTopicId, setActiveTopicId] = useState<string>('arrays-hashing');
  const [solvedSlugs, setSolvedSlugs] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // Load persistent solved question list from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('codeclash_practiced_slugs');
      if (stored) {
        setSolvedSlugs(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const toggleSolved = (slug: string) => {
    setSolvedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      try {
        localStorage.setItem('codeclash_practiced_slugs', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Filter curated questions according to selected track
  const trackQuestions = useMemo(() => {
    switch (selectedTrack) {
      case 'blind75':
        return CURATED_ALL_QUESTIONS.filter((q) => q.blind75);
      case 'mastery250':
        return CURATED_ALL_QUESTIONS.filter((q) => q.mastery250 || q.neetcode250);
      case 'all':
        return CURATED_ALL_QUESTIONS;
      case 'core150':
      default:
        return CURATED_ALL_QUESTIONS.filter((q) => q.core150 || q.neetcode150);
    }
  }, [selectedTrack]);

  // Questions mapped by category
  const questionsByCategory = useMemo(() => {
    const map = new Map<string, LeetCodeQuestion[]>();
    for (const q of trackQuestions) {
      const cat = q.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(q);
    }
    return map;
  }, [trackQuestions]);

  // Topic metrics: solved count, total, percent
  const topicStats = useMemo(() => {
    const stats = new Map<string, { total: number; solved: number; easy: number; medium: number; hard: number }>();
    for (const node of ROADMAP_TOPICS) {
      const qs = questionsByCategory.get(node.categoryName) || [];
      let solved = 0;
      let easy = 0;
      let medium = 0;
      let hard = 0;
      for (const q of qs) {
        if (solvedSlugs.has(q.slug)) solved++;
        const d = q.difficulty.toLowerCase();
        if (d === 'easy') easy++;
        else if (d === 'medium') medium++;
        else if (d === 'hard') hard++;
      }
      stats.set(node.id, { total: qs.length, solved, easy, medium, hard });
    }
    return stats;
  }, [questionsByCategory, solvedSlugs]);

  // Overall track progress
  const totalTrackQuestions = trackQuestions.length;
  const totalTrackSolved = useMemo(() => {
    return trackQuestions.filter((q) => solvedSlugs.has(q.slug)).length;
  }, [trackQuestions, solvedSlugs]);

  const progressPercentage = totalTrackQuestions > 0
    ? Math.round((totalTrackSolved / totalTrackQuestions) * 100)
    : 0;

  // Active topic node details
  const activeNode = useMemo(() => {
    return ROADMAP_TOPICS.find((n) => n.id === activeTopicId) || ROADMAP_TOPICS[0];
  }, [activeTopicId]);

  // Active topic questions
  const activeQuestions = useMemo(() => {
    const allInTopic = questionsByCategory.get(activeNode.categoryName) || [];
    if (difficultyFilter === 'all') return allInTopic;
    return allInTopic.filter((q) => q.difficulty.toLowerCase() === difficultyFilter);
  }, [questionsByCategory, activeNode.categoryName, difficultyFilter]);

  // Next recommended question
  const nextRecommended = useMemo(() => {
    for (const node of ROADMAP_TOPICS) {
      const qs = questionsByCategory.get(node.categoryName) || [];
      const unsolved = qs.find((q) => !solvedSlugs.has(q.slug));
      if (unsolved) {
        return { question: unsolved, node };
      }
    }
    return null;
  }, [questionsByCategory, solvedSlugs]);

  // Group topics by tier
  const tiers = useMemo(() => {
    const groups: { tier: number; name: string; nodes: RoadmapTopicNode[] }[] = [];
    for (const node of ROADMAP_TOPICS) {
      let g = groups.find((grp) => grp.tier === node.tier);
      if (!g) {
        g = { tier: node.tier, name: node.tierName, nodes: [] };
        groups.push(g);
      }
      g.nodes.push(node);
    }
    return groups;
  }, []);

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

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-wider uppercase">
              <span>🗺️ DSA PRACTICE ROADMAP</span>
              <span>•</span>
              <span>PREREQUISITE PROGRESSION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
              Algorithmic Practice Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl text-pretty leading-relaxed">
              Step-by-step prerequisite progression across 18 core patterns. Mark problems solved as you practice, or duel friends on specific topics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/problems"
              className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <Code2 className="size-3.5 text-primary" />
              <span>Problem Library</span>
            </Link>

            <Link
              href="/lobby"
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <Swords className="size-3.5" />
              <span>Battle Arena</span>
            </Link>
          </div>
        </div>

        {/* Global Progress & Track Switcher Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Progress Tracker Card */}
          <SpotlightCard className="lg:col-span-7 p-5 rounded-2xl border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Roadmap Mastery Progress
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                {totalTrackSolved} / {totalTrackQuestions} Solved ({progressPercentage}%)
              </span>
            </div>

            <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>Mark problems completed in each topic to track your interview readiness</span>
              {nextRecommended && (
                <Link
                  href={`/problems/${nextRecommended.question.slug}/question`}
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>Up Next: {nextRecommended.question.title}</span>
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          </SpotlightCard>

          {/* Track Segmented Selector */}
          <div className="lg:col-span-5 p-1.5 rounded-2xl border border-border bg-muted/50 flex flex-wrap gap-1.5">
            {[
              { id: 'core150', label: 'Core 150', desc: '150 Standard' },
              { id: 'blind75', label: 'Blind 75', desc: '75 High-Yield' },
              { id: 'mastery250', label: 'Mastery 250', desc: '250 Deep' },
              { id: 'all', label: 'All Curated', desc: 'Full Track' },
            ].map((t) => {
              const isSelected = selectedTrack === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrack(t.id as TrackFilter)}
                  className={`flex-1 py-2 px-3 rounded-xl text-center transition-all ${
                    isSelected
                      ? 'bg-card text-foreground font-bold shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="text-xs font-bold">{t.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Interface: Visual Roadmap Graph on Left + Topic Practice Inspector on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Roadmap Graph Organized by Prerequisite Tiers */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Prerequisite Dependency Tree
              </span>
              <span className="text-[11px] text-muted-foreground">
                Click any topic node to view curated questions
              </span>
            </div>

            <div className="space-y-6">
              {tiers.map((t) => (
                <div key={t.tier} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      {t.name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {t.nodes.map((node) => {
                      const IconComp = node.icon;
                      const stat = topicStats.get(node.id) || { total: 0, solved: 0, easy: 0, medium: 0, hard: 0 };
                      const isSelected = activeTopicId === node.id;
                      const nodePercent = stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0;
                      const isCompleted = stat.total > 0 && stat.solved === stat.total;

                      return (
                        <motion.button
                          key={node.id}
                          type="button"
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                          onClick={() => setActiveTopicId(node.id)}
                          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/40'
                              : 'border-border/80 hover:border-foreground/30 bg-card/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`size-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-muted text-foreground border-border'
                                }`}
                              >
                                <IconComp className="size-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                  <span>{node.name}</span>
                                  {isCompleted && (
                                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {stat.solved} / {stat.total} Solved
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-mono font-bold text-primary tabular-nums">
                              {nodePercent}%
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                            {node.description}
                          </p>

                          {/* Mini Progress Bar */}
                          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full transition-[width] duration-300"
                              style={{ width: `${nodePercent}%` }}
                            />
                          </div>

                          {/* Prerequisites Indicator */}
                          {node.prerequisites.length > 0 && (
                            <div className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                              <span>Prereq:</span>
                              <span className="text-foreground font-semibold truncate">
                                {node.prerequisites.join(', ')}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Topic Practice Inspector */}
          <div className="lg:col-span-5 sticky top-20">
            <SpotlightCard className="p-5 sm:p-6 rounded-3xl border-border bg-card shadow-xl space-y-5">
              {/* Active Topic Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                    <activeNode.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{activeNode.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {questionsByCategory.get(activeNode.categoryName)?.length || 0} practice problems in {selectedTrack.toUpperCase()}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/battle/create?topic=${activeNode.topicKey}`}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors active:scale-95 flex items-center gap-1 shrink-0"
                  title="Challenge a friend 1v1 on this pattern"
                >
                  <Swords className="size-3.5" />
                  <span>Duel Topic</span>
                </Link>
              </div>

              {/* Algorithmic Cheat Sheet Heuristic Box */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1">
                <div className="font-bold text-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
                  <Sparkles className="size-3 text-primary" />
                  <span>Key Pattern Heuristic</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {activeNode.cheatSheet}
                </p>
              </div>

              {/* Difficulty Filter Tabs */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground text-[11px] uppercase font-bold">
                  Filter by Tier
                </span>
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficultyFilter(d)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize transition-colors ${
                        difficultyFilter === d
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problems List in Active Topic */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {activeQuestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-border/50 rounded-2xl">
                    No problems match this difficulty filter.
                  </div>
                ) : (
                  activeQuestions.map((q) => {
                    const isSolved = solvedSlugs.has(q.slug);
                    return (
                      <div
                        key={q.slug}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isSolved
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-background/80 hover:bg-muted/40 border-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Interactive Solved Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleSolved(q.slug)}
                            className="size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                            title={isSolved ? 'Mark as unpracticed' : 'Mark as practiced / solved'}
                            aria-label={`Toggle solved status for ${q.title}`}
                          >
                            {isSolved ? (
                              <CheckCircle2 className="size-4 text-emerald-400" />
                            ) : (
                              <Circle className="size-3.5 text-muted-foreground/60 hover:text-foreground" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                #{q.number}
                              </span>
                              <Link
                                href={`/problems/${q.slug}/question`}
                                className={`text-xs font-semibold hover:text-primary transition-colors truncate ${
                                  isSolved ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {q.title}
                              </Link>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span
                                className={`px-1.5 py-0.2 rounded border capitalize ${getDifficultyColor(
                                  q.difficulty
                                )}`}
                              >
                                {q.difficulty}
                              </span>
                              {q.blind75 && (
                                <span className="text-primary font-bold">Blind 75</span>
                              )}
                              {q.core150 && (
                                <span className="text-muted-foreground">Core 150</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            href={`/battle/create?slug=${q.slug}`}
                            className="p-1.5 rounded-lg hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-colors"
                            title="Duel on this problem"
                            aria-label={`Duel on ${q.title}`}
                          >
                            <Swords className="size-3.5" />
                          </Link>

                          <Link
                            href={`/problems/${q.slug}/question`}
                            className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold transition-colors flex items-center gap-1 border border-border"
                          >
                            <span>Solve</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </div>
  );
}
