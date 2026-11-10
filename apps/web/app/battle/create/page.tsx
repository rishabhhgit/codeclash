'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getClientAuthToken, getApiUrl } from '../../../lib/api';
import { SpotlightCard } from '../../../components/ui/SpotlightCard';

const TOPICS = [
  'arrays', 'strings', 'linked_lists', 'stacks', 'queues', 'heaps',
  'binary_search', 'sliding_window', 'greedy', 'dynamic_programming',
  'trees', 'graphs', 'backtracking', 'bit_manipulation', 'math', 'intervals',
  'two_pointers', 'hash_map', 'recursion', 'depth_first_search', 'breadth_first_search',
  'monotonic_stack', 'prefix_sum', 'topological_sort', 'design', 'divide_and_conquer', 'sorting',
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
  const [form, setForm] = useState({
    mode: 'deathmatch',
    maxPlayers: 2,
    difficulty: 'medium',
    topics: ['arrays'] as string[],
    timeControl: 10,
    isPublic: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const slugParam = params.get('slug');

    if (slugParam) {
      setSelectedSlug(slugParam);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getClientAuthToken();
      const apiUrl = getApiUrl();

      const payload = {
        ...form,
        slug: selectedSlug || undefined,
        questionSlug: selectedSlug || undefined,
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

      const finalSlug = data.data?.problem?.slug || data.data?.questionSlug || selectedSlug;
      const qParams = new URLSearchParams();
      if (finalSlug) qParams.set('slug', finalSlug);
      if (form.mode === 'battle_royale' || form.mode === 'royal') qParams.set('mode', 'battle_royale');
      const qStr = qParams.toString() ? `?${qParams.toString()}` : '';
      router.push(`/battle/${data.data.code}${qStr}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
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
          <span>CHALLENGE YOUR FRIENDS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">Deploy Battle Arena</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 text-pretty">
          Create an instant Knockout Arena or 1v1 Blitz Duel, copy your invite link, and challenge your friends.
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

        {selectedSlug && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground mt-4 shadow-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Swords className="size-3.5 text-primary" />
              <span>Challenging with problem: <strong className="font-mono text-primary">{selectedSlug}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedSlug(null)}
              aria-label="Clear selected problem"
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors p-1"
            >
              <X className="size-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Battle Mode */}
        <SpotlightCard className="p-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">Battle Mode</label>
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
                    <span>🏆 Knockout Arena Rules &amp; Phase Checkpoints</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                    <li><strong className="text-foreground">Phase Checkpoints:</strong> Progresses through 4 timed stages. Coders must pass minimum testcases before each phase cutoff.</li>
                    <li><strong className="text-foreground">100 Accuracy Stamina:</strong> Passing test cases strengthens your buffer. Non-accepted submissions (WA, TLE, syntax errors) deduct 25 stamina.</li>
                    <li><strong className="text-foreground">Algorithmic Blueprints:</strong> Mid-match intel unlocks optimal complexity hints and provides +50 stamina recovery.</li>
                    <li><strong className="text-foreground">1st Place Victory:</strong> Solve all test benchmarks first or have the highest benchmark score at the final stage cutoff!</li>
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
              <option value={100}>100+ Players</option>
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

        {/* Topics */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-foreground">Topics</label>
            <span className="text-[11px] text-muted-foreground">{form.topics.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {TOPICS.map((topic) => (
              <motion.button
                key={topic}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => toggleTopic(topic)}
                className={`px-2.5 py-1 text-xs border rounded-full transition-colors ${
                  form.topics.includes(topic)
                    ? 'border-foreground bg-foreground text-background font-medium'
                    : 'border-border hover:border-foreground/30 bg-background text-muted-foreground'
                }`}
              >
                {topic.replace(/_/g, ' ')}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Control */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-foreground">
              Time Limit
            </label>
            <span className="text-xs font-mono tabular-nums font-medium text-foreground">{form.timeControl} minutes</span>
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
          {loading ? 'Deploying Arena...' : 'Launch Battle Arena'}
        </motion.button>
      </form>
    </div>
  );
}
