'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Swords,
  ArrowLeft,
  X,
  Shuffle,
  Search,
  Check,
  Sparkles,
  Layers,
  GitFork,
  Boxes,
  Network,
  Link2,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getClientAuthToken, getApiUrl } from '../../../lib/api';
import { SpotlightCard } from '../../../components/ui/SpotlightCard';
import {
  getQuestionsByTopics,
  getQuestionBySlug,
  pickQuestionForBattle,
} from '../../../lib/questions/data';
import { LeetCodeQuestion } from '../../../lib/questions/types';

interface TopicOption {
  id: string;
  label: string;
  iconName: string;
}

const PRIMARY_TOPICS: TopicOption[] = [
  { id: 'trees', label: 'Trees & BST', iconName: 'GitFork' },
  { id: 'dynamic_programming', label: 'Dynamic Programming', iconName: 'Boxes' },
  { id: 'graphs', label: 'Graphs & BFS/DFS', iconName: 'Network' },
  { id: 'linked_lists', label: 'Linked Lists', iconName: 'Link2' },
  { id: 'binary_search', label: 'Binary Search', iconName: 'Search' },
  { id: 'arrays', label: 'Arrays & Hashing', iconName: 'Layers' },
  { id: 'two_pointers', label: 'Two Pointers', iconName: 'Layers' },
  { id: 'sliding_window', label: 'Sliding Window', iconName: 'Layers' },
  { id: 'stacks', label: 'Stack & Queue', iconName: 'Layers' },
  { id: 'heaps', label: 'Heap / Priority Queue', iconName: 'Layers' },
  { id: 'backtracking', label: 'Backtracking', iconName: 'Layers' },
  { id: 'greedy', label: 'Greedy', iconName: 'Layers' },
  { id: 'intervals', label: 'Intervals', iconName: 'Layers' },
  { id: 'math', label: 'Math & Geometry', iconName: 'Layers' },
  { id: 'bit_manipulation', label: 'Bit Manipulation', iconName: 'Layers' },
  { id: 'tries', label: 'Tries', iconName: 'Network' },
];

const MODES = [
  { value: 'deathmatch', label: '1v1 Duel', desc: 'Head-to-head duel, synchronized clocks, direct challenge link' },
  { value: 'battle_royale', label: 'Knockout Arena', desc: 'Multiplayer arena with timed elimination phases' },
  { value: 'survival', label: 'Precision Sprint', desc: 'Failed submissions deduct stamina' },
  { value: 'bestof3', label: 'Best of 3', desc: 'Three consecutive rounds across difficulty tiers' },
  { value: 'speedrun', label: 'Speedrun', desc: 'First accepted submission claims the match' },
  { value: 'topicdraft', label: 'Topic Draft', desc: 'Filter by specific DSA patterns' },
];

export default function CreateBattlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [topicQuestionSearch, setTopicQuestionSearch] = useState('');
  const [problemPickerMode, setProblemPickerMode] = useState<'random' | 'choose'>('random');
  const [randomTopicSlug, setRandomTopicSlug] = useState<string>('');

  const [form, setForm] = useState({
    mode: 'deathmatch',
    maxPlayers: 2,
    difficulty: 'medium',
    topics: ['trees'] as string[],
    timeControl: 10,
    isPublic: true,
  });

  // Read URL query parameters for topic, slug, mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const slugParam = params.get('slug');
    const topicParam = params.get('topic');

    if (slugParam) {
      setSelectedSlug(slugParam);
      const q = getQuestionBySlug(slugParam);
      if (q && q.category) {
        const catKey = q.category.toLowerCase().replace(/[-\s&/]+/g, '_');
        setForm((prev) => ({
          ...prev,
          topics: [catKey],
        }));
      }
    } else if (topicParam) {
      const clean = topicParam.toLowerCase().trim().replace(/[-\s&/]+/g, '_');
      setForm((prev) => ({
        ...prev,
        topics: [clean],
      }));
    }

    if (modeParam) {
      const isBR = modeParam === 'battle_royale' || modeParam === 'royal';
      const normalized = isBR ? 'battle_royale' : modeParam;
      setForm((prev) => ({
        ...prev,
        mode: normalized,
        maxPlayers: isBR ? 10 : prev.maxPlayers,
      }));
    }
  }, []);

  const isKnockout = form.mode === 'battle_royale' || form.mode === 'royal';

  // Questions matching the selected topic & difficulty
  const topicQuestions = useMemo(() => {
    const list = getQuestionsByTopics(form.topics, form.difficulty);
    if (list.length === 0) {
      return getQuestionsByTopics(form.topics);
    }
    return list;
  }, [form.topics, form.difficulty]);

  // Pick or re-roll random question from current topic
  const rollRandomTopicQuestion = useCallback(() => {
    if (topicQuestions.length === 0) return;
    const picked = pickQuestionForBattle({
      topics: form.topics,
      difficulty: form.difficulty,
      excludeSlugs: randomTopicSlug ? [randomTopicSlug] : [],
    });
    setRandomTopicSlug(picked.slug);
  }, [topicQuestions, form.topics, form.difficulty, randomTopicSlug]);

  // Auto-sync randomTopicSlug when topic or difficulty changes
  useEffect(() => {
    if (topicQuestions.length > 0) {
      const alreadyMatches = topicQuestions.some((q) => q.slug === randomTopicSlug);
      if (!alreadyMatches) {
        rollRandomTopicQuestion();
      }
    }
  }, [topicQuestions, randomTopicSlug, rollRandomTopicQuestion]);

  // Currently resolved question to use for the battle
  const activeQuestion: LeetCodeQuestion | undefined = useMemo(() => {
    const targetSlug = selectedSlug || randomTopicSlug || topicQuestions[0]?.slug;
    if (!targetSlug) return undefined;
    return getQuestionBySlug(targetSlug);
  }, [selectedSlug, randomTopicSlug, topicQuestions]);

  // Filtered topic questions for manual picker
  const filteredTopicQuestions = useMemo(() => {
    if (!topicQuestionSearch.trim()) return topicQuestions.slice(0, 30);
    const s = topicQuestionSearch.toLowerCase();
    return topicQuestions
      .filter((q) => q.title.toLowerCase().includes(s) || String(q.number).includes(s) || q.slug.includes(s))
      .slice(0, 30);
  }, [topicQuestions, topicQuestionSearch]);

  const selectTopic = (topicId: string) => {
    setForm((prev) => ({
      ...prev,
      topics: [topicId],
    }));
    setSelectedSlug(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getClientAuthToken();
      const apiUrl = getApiUrl();
      const finalSlug = activeQuestion?.slug || selectedSlug || randomTopicSlug || 'two-sum';

      const payload = {
        ...form,
        slug: finalSlug,
        questionSlug: finalSlug,
      };

      const res = await fetch(`${apiUrl}/api/battles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        let errMsg = data.error || 'Failed to create battle';
        if (data.details) {
          if (Array.isArray(data.details)) {
            errMsg = data.details.map((d: any) => d.message || JSON.stringify(d)).join('; ');
          } else if (typeof data.details === 'string') {
            errMsg = data.details;
          }
        }
        throw new Error(errMsg);
      }

      const roomSlug = data.data?.problem?.slug || data.data?.questionSlug || finalSlug;
      const qParams = new URLSearchParams();
      if (roomSlug) qParams.set('slug', roomSlug);
      if (form.mode === 'battle_royale' || form.mode === 'royal') qParams.set('mode', 'battle_royale');
      const qStr = qParams.toString() ? `?${qParams.toString()}` : '';
      router.push(`/battle/${data.data.code}${qStr}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadgeColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/lobby"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Lobby
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
          <span>🏆 KNOCKOUT ARENA &amp; 1v1 DUELS</span>
          <span>•</span>
          <span>TOPIC-BASED MATCHMAKING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
          Deploy Battle Arena
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 text-pretty">
          Select a DSA topic to battle friends on questions specifically from that topic.
        </p>

        {/* Toggle between Create & Join */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-muted rounded-xl w-fit border border-border">
          <span className="px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold text-xs shadow-sm">
            Create Battle
          </span>
          <Link
            href="/battle/join"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Swords className="size-3.5 text-primary" />
            <span>Join Existing Battle</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Battle Mode */}
        <SpotlightCard className="p-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Battle Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODES.map((mode) => {
              const isSelected = form.mode === mode.value || (mode.value === 'battle_royale' && form.mode === 'royal');
              const isBR = mode.value === 'battle_royale' || mode.value === 'royal';
              return (
                <motion.button
                  key={mode.value}
                  type="button"
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => {
                    const newMax = isBR ? (form.maxPlayers === 2 ? 10 : form.maxPlayers) : form.maxPlayers;
                    setForm({ ...form, mode: mode.value, maxPlayers: newMax });
                  }}
                  className={`p-3.5 border rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border/60 hover:border-foreground/30 bg-background/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{mode.label}</span>
                    {isBR && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                        KNOCKOUT ARENA
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{mode.desc}</div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {isKnockout && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-foreground space-y-1.5 text-xs">
                  <div className="font-bold text-primary flex items-center gap-1.5">
                    <span>🏆 Knockout Arena Rules &amp; Checkpoints</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                    <li>
                      <strong className="text-foreground">Phase Checkpoints:</strong> 4 timed stages. Coders must pass minimum test cases before cutoff.
                    </li>
                    <li>
                      <strong className="text-foreground">Accuracy Stamina:</strong> Failed submissions deduct 25 stamina buffer.
                    </li>
                    <li>
                      <strong className="text-foreground">1st Place Victory:</strong> Solve all tests first or lead benchmark score at final stage cutoff.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>

        {/* Player Count & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <label className="block text-xs font-medium text-foreground">Max Players</label>
            <select
              value={form.maxPlayers}
              onChange={(e) => setForm({ ...form, maxPlayers: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border bg-background text-foreground text-xs rounded-lg focus:outline-none focus:border-foreground/40 transition-colors"
            >
              <option value={2}>2 Players (1v1)</option>
              <option value={4}>4 Players</option>
              <option value={10}>10 Players</option>
              <option value={25}>25 Players</option>
              <option value={50}>50 Players</option>
            </select>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <label className="block text-xs font-medium text-foreground">Difficulty</label>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard'].map((diff) => (
                <motion.button
                  key={diff}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={() => setForm({ ...form, difficulty: diff })}
                  className={`flex-1 py-2 text-xs border rounded-lg transition-colors capitalize ${
                    form.difficulty === diff
                      ? 'border-foreground bg-muted font-medium text-foreground'
                      : 'border-border hover:border-foreground/30 bg-background text-muted-foreground'
                  }`}
                >
                  {diff}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* DSA Topic Selector */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-foreground">
              Battle Topic <span className="text-muted-foreground">(only questions from this topic will appear)</span>
            </label>
            <span className="text-[11px] font-mono text-primary font-semibold">
              {PRIMARY_TOPICS.find((t) => t.id === form.topics[0])?.label || form.topics[0]}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIMARY_TOPICS.map((topic) => {
              const isSelected = form.topics.includes(topic.id);
              return (
                <motion.button
                  key={topic.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={() => selectTopic(topic.id)}
                  className={`px-3 py-2 text-xs border rounded-xl text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary'
                      : 'border-border hover:border-foreground/30 bg-background text-muted-foreground'
                  }`}
                >
                  <div className="truncate">{topic.label}</div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Topic Question Allocation & Preview */}
        <SpotlightCard className="p-4 space-y-3 border-primary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles className="size-3.5 text-primary" />
                <span>Question for this Battle</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {topicQuestions.length} questions available for {PRIMARY_TOPICS.find((t) => t.id === form.topics[0])?.label || form.topics[0]}.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => {
                  setProblemPickerMode('random');
                  setSelectedSlug(null);
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  problemPickerMode === 'random' && !selectedSlug
                    ? 'bg-card text-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Random
              </button>
              <button
                type="button"
                onClick={() => setProblemPickerMode('choose')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  problemPickerMode === 'choose' || selectedSlug
                    ? 'bg-card text-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Choose Exact
              </button>
            </div>
          </div>

          {/* Active Question Preview Card */}
          {activeQuestion && (
            <div className="p-3.5 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    #{activeQuestion.number}
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {activeQuestion.title}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-medium border capitalize ${getDifficultyBadgeColor(
                      activeQuestion.difficulty
                    )}`}
                  >
                    {activeQuestion.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Category: <strong className="text-foreground">{activeQuestion.category || form.topics[0]}</strong></span>
                  {activeQuestion.acceptanceRate && (
                    <>
                      <span>•</span>
                      <span>Acceptance: <strong className="text-foreground">{activeQuestion.acceptanceRate}</strong></span>
                    </>
                  )}
                  {selectedSlug && (
                    <span className="text-primary font-medium ml-1">
                      (Manually Selected)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedSlug ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlug(null);
                      setProblemPickerMode('random');
                      rollRandomTopicQuestion();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <X className="size-3" />
                    <span>Clear Exact</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={rollRandomTopicQuestion}
                    className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs text-foreground flex items-center gap-1 transition-colors active:scale-95"
                    title="Roll another random question from this topic"
                  >
                    <Shuffle className="size-3 text-primary" />
                    <span>Re-roll Random</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Manual Problem Selector Mode */}
          {problemPickerMode === 'choose' && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${topicQuestions.length} questions in this topic...`}
                  value={topicQuestionSearch}
                  onChange={(e) => setTopicQuestionSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-border/60 border border-border rounded-lg bg-background/50">
                {filteredTopicQuestions.map((q) => {
                  const isCurrent = (selectedSlug || randomTopicSlug) === q.slug;
                  return (
                    <button
                      key={q.slug}
                      type="button"
                      onClick={() => {
                        setSelectedSlug(q.slug);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs transition-colors hover:bg-muted/50 ${
                        isCurrent ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[11px] font-mono text-muted-foreground w-10 shrink-0">
                          #{q.number}
                        </span>
                        <span className="truncate">{q.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium border capitalize ${getDifficultyBadgeColor(
                            q.difficulty
                          )}`}
                        >
                          {q.difficulty}
                        </span>
                        {isCurrent && <Check className="size-3.5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SpotlightCard>

        {/* Time Control */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-foreground">
              Time Limit
            </label>
            <span className="text-xs font-mono tabular-nums font-medium text-foreground">
              {form.timeControl} minutes
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={form.timeControl}
            onChange={(e) => setForm({ ...form, timeControl: parseInt(e.target.value) })}
            className="w-full accent-foreground"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
            <span>5 min</span>
            <span>60 min</span>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <label className="block text-xs font-medium text-foreground">Visibility</label>
          <div className="flex gap-2.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={() => setForm({ ...form, isPublic: true })}
              className={`flex-1 py-2 text-xs border rounded-lg transition-colors ${
                form.isPublic
                  ? 'border-foreground bg-muted font-medium text-foreground'
                  : 'border-border hover:border-foreground/30 bg-background text-muted-foreground'
              }`}
            >
              Public Battle
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={() => setForm({ ...form, isPublic: false })}
              className={`flex-1 py-2 text-xs border rounded-lg transition-colors ${
                !form.isPublic
                  ? 'border-foreground bg-muted font-medium text-foreground'
                  : 'border-border hover:border-foreground/30 bg-background text-muted-foreground'
              }`}
            >
              Private Battle
            </motion.button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading || form.topics.length === 0}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="btn-radiant-primary w-full py-4 text-primary-foreground rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Swords className="size-4" />
          {loading ? 'Deploying Arena...' : `Launch Battle Arena (${activeQuestion?.title || 'Ready'})`}
        </motion.button>
      </form>
    </div>
  );
}
