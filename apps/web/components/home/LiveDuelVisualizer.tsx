'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Clock, ShieldCheck, Play, CheckCircle2 } from 'lucide-react';

type VisualizerTab = 'race' | 'benchmarks' | 'terminal';

export function LiveDuelVisualizer() {
  const [activeTab, setActiveTab] = useState<VisualizerTab>('race');
  const [progress, setProgress] = useState<number>(38);
  const [opponentProgress, setOpponentProgress] = useState<number>(29);
  const [timer, setTimer] = useState<number>(284); // 04:44
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(84);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 300));
      setProgress((p) => {
        if (p >= 50) {
          setIsFinished(true);
          return 50;
        }
        return p + (Math.random() > 0.45 ? 1 : 0);
      });
      setOpponentProgress((op) => {
        if (op >= 41) return 41;
        return op + (Math.random() > 0.65 ? 1 : 0);
      });
      setWpm((w) => 82 + Math.floor(Math.sin(Date.now() / 1000) * 6));
    }, 900);

    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    setProgress(14);
    setOpponentProgress(9);
    setIsFinished(false);
    setTimer(300);
  };

  const handleFastForward = () => {
    setProgress(50);
    setIsFinished(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors shadow-sm">
      {/* Top Window Chrome */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border/70 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <span className="font-mono text-muted-foreground ml-1">
            CLASH-8941 &middot; Two Sum &middot; Medium
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background border border-border/80 text-foreground">
            <Clock className="size-3 text-muted-foreground" />
            <span className="tabular-nums font-medium">{formatTime(timer)}</span>
          </div>
          <button
            onClick={handleRestart}
            title="Reset race simulation"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-muted/15 border-b border-border/60 text-xs">
        {(
          [
            { id: 'race', label: 'Live code duel' },
            { id: 'benchmarks', label: '50 Hidden tests' },
            { id: 'terminal', label: 'Sandboxed runner' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-1.5 font-medium rounded-t-lg transition-colors ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="visualizerTab"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="p-4 min-h-[300px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {activeTab === 'race' && (
            <motion.div
              key="race"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Combatant 1: You */}
              <div className="p-3 rounded-lg bg-background border border-border/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground font-mono">You (AlphaCoder)</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      1,842 Elo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-muted-foreground tabular-nums">{wpm} wpm</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      {progress} / 50 tests
                    </span>
                  </div>
                </div>

                {/* Single crisp fill progress bar */}
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    animate={{ width: `${(progress / 50) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  />
                </div>

                {/* Code Snippet Preview */}
                <pre className="text-[11px] font-mono text-muted-foreground/90 overflow-x-auto leading-relaxed pt-1 select-none">
                  <code>
                    <span className="text-blue-400">vector</span>&lt;<span className="text-blue-400">int</span>&gt; twoSum(
                    <span className="text-blue-400">vector</span>&lt;<span className="text-blue-400">int</span>&gt;& nums,{' '}
                    <span className="text-blue-400">int</span> target) &#123;
                    {'\n'}  unordered_map&lt;<span className="text-blue-400">int</span>, <span className="text-blue-400">int</span>&gt; seen;
                    {'\n'}  <span className="text-purple-400">for</span> (<span className="text-blue-400">int</span> i = 0; i &lt; nums.size(); ++i) &#123;
                    {'\n'}    <span className="text-purple-400">int</span> complement = target - nums[i];
                    {'\n'}    <span className="text-purple-400">if</span> (seen.count(complement)) <span className="text-purple-400">return</span> &#123;seen[complement], i&#125;;
                    {'\n'}    seen[nums[i]] = i;
                    {'\n'}  &#125;
                    {'\n'}  <span className="text-purple-400">return</span> &#123;&#125;;
                    {'\n'}&#125;
                  </code>
                </pre>
              </div>

              {/* Combatant 2: Opponent */}
              <div className="p-3 rounded-lg bg-background/50 border border-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-muted-foreground/50" />
                    <span className="font-semibold text-foreground font-mono">ByteSlayer</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      1,815 Elo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3 text-muted-foreground" /> Hidden until verdict
                    </span>
                    <span className="text-muted-foreground font-semibold tabular-nums">
                      {opponentProgress} / 50 tests
                    </span>
                  </div>
                </div>

                {/* Opponent Progress bar */}
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-muted-foreground/60 h-full rounded-full"
                    animate={{ width: `${(opponentProgress / 50) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'benchmarks' && (
            <motion.div
              key="benchmarks"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-1.5 text-xs font-mono"
            >
              {[
                { name: 'Case 1: Standard positive target', time: '1.2ms', status: 'Passed' },
                { name: 'Case 2: Duplicate values in array', time: '1.8ms', status: 'Passed' },
                { name: 'Case 3: Large negative bounds (-10^9)', time: '2.4ms', status: 'Passed' },
                { name: 'Case 4: Hidden stress test (N = 100,000)', time: '8.6ms', status: 'Passed' },
                { name: 'Case 5: Zero-sum paired complement', time: '1.9ms', status: 'Passed' },
              ].map((tc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-md bg-background border border-border/70"
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[11px]">{tc.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] tabular-nums">
                    <span className="text-muted-foreground">{tc.time}</span>
                    <span className="text-emerald-500 font-medium">{tc.status}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'terminal' && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="p-3 rounded-lg bg-black/90 font-mono text-[11px] text-zinc-300 space-y-1 border border-border/80"
            >
              <div className="text-muted-foreground">$ clang++ -O3 -std=c++17 solution.cpp -o runner</div>
              <div className="text-emerald-400">Binary compiled in 62ms with zero warnings</div>
              <div className="text-muted-foreground">$ ./runner --verify-suite --suite=two-sum-hidden-50</div>
              <div className="text-emerald-400">50/50 hidden benchmark cases passed</div>
              <div className="text-muted-foreground">Memory: 11.4 MB | CPU runtime: 18ms</div>
              <div className="text-primary font-medium pt-1">Verdict: Accepted (Winner)</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Verdict Footer with Interactive Action */}
        <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs mt-3">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Verdict:</span>
            <span className={isFinished ? 'text-emerald-500 font-semibold' : 'text-foreground'}>
              {isFinished ? 'Accepted (+24 Elo)' : `${progress}/50 benchmarks`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isFinished && (
              <button
                type="button"
                onClick={handleFastForward}
                className="px-2 py-1 rounded-md bg-secondary hover:bg-muted border border-border text-[11px] text-foreground font-mono transition-colors"
              >
                Submit code
              </button>
            )}
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              Rating: 1,866
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
