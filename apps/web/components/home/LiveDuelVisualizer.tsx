'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Check, Zap, Play, RotateCcw, Terminal, Trophy, Shield, Clock } from 'lucide-react';

type VisualizerTab = 'race' | 'benchmarks' | 'terminal';

export function LiveDuelVisualizer() {
  const [activeTab, setActiveTab] = useState<VisualizerTab>('race');
  const [progress, setProgress] = useState<number>(34);
  const [opponentProgress, setOpponentProgress] = useState<number>(28);
  const [timer, setTimer] = useState<number>(284); // 04:44
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(86);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 300));
      setProgress((p) => {
        if (p >= 50) {
          setIsFinished(true);
          return 50;
        }
        return p + (Math.random() > 0.4 ? 1 : 0);
      });
      setOpponentProgress((op) => {
        if (op >= 42) return 42;
        return op + (Math.random() > 0.6 ? 1 : 0);
      });
      setWpm((w) => 82 + Math.floor(Math.sin(Date.now() / 1000) * 8));
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    setProgress(12);
    setOpponentProgress(8);
    setIsFinished(false);
    setTimer(300);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative rounded-2xl border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden card-elevated">
      {/* Top Window Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="size-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="size-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2 font-medium">
            ARENA-9214 &bull; Two Sum
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-semibold">
            <Clock className="size-3 text-primary animate-pulse" />
            <span>{formatTime(timer)}</span>
          </div>
          <button
            onClick={handleRestart}
            title="Reset Race Simulation"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-muted/20 border-b border-border/60 text-xs">
        {(
          [
            { id: 'race', label: 'Live Code Race' },
            { id: 'benchmarks', label: '50 Hidden Tests' },
            { id: 'terminal', label: 'Isolated Runner' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-1.5 font-medium rounded-t-lg transition-colors duration-150 ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="visualizerTab"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="p-4 min-h-[290px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {activeTab === 'race' && (
            <motion.div
              key="race"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-4"
            >
              {/* Combatant 1: You */}
              <div className="p-3 rounded-xl bg-background/90 border border-primary/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-foreground font-mono">You (AlphaCoder)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-semibold">
                      1,842 Elo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-muted-foreground">{wpm} WPM</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {progress} / 50 Tests
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full"
                    animate={{ width: `${(progress / 50) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                </div>

                {/* Code Snippet Preview */}
                <pre className="text-[11px] font-mono text-muted-foreground/90 overflow-x-auto leading-relaxed pt-1">
                  <code>
                    <span className="text-blue-400">vector</span>&lt;<span className="text-blue-400">int</span>&gt; twoSum(
                    <span className="text-blue-400">vector</span>&lt;<span className="text-blue-400">int</span>&gt;& nums,{' '}
                    <span className="text-blue-400">int</span> target) &#123;
                    {'\n'}  unordered_map&lt;<span className="text-blue-400">int</span>, <span className="text-blue-400">int</span>&gt; seen;
                    {'\n'}  <span className="text-purple-400">for</span> (<span className="text-blue-400">int</span> i = 0; i &lt; nums.size(); ++i) &#123;
                    {'\n'}    <span className="text-purple-400">int</span> complement = target - nums[i];
                    <span className="inline-block w-1.5 h-3 bg-primary ml-1 animate-pulse" />
                  </code>
                </pre>
              </div>

              {/* Combatant 2: Opponent */}
              <div className="p-3 rounded-xl bg-background/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-foreground font-mono">ByteSlayer</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                      1,815 Elo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="size-3 text-muted-foreground" /> Code Shielded
                    </span>
                    <span className="text-amber-400 font-bold tabular-nums">
                      {opponentProgress} / 50 Tests
                    </span>
                  </div>
                </div>

                {/* Opponent Progress bar */}
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-amber-500 h-full rounded-full"
                    animate={{ width: `${(opponentProgress / 50) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
              transition={{ duration: 0.16 }}
              className="space-y-2 text-xs font-mono"
            >
              {[
                { name: 'Case 1: Standard positive target', time: '1.2ms', status: 'Passed' },
                { name: 'Case 2: Duplicate values in nums', time: '1.8ms', status: 'Passed' },
                { name: 'Case 3: Large negative bounds (-10^9)', time: '2.4ms', status: 'Passed' },
                { name: 'Case 4: Hidden stress test (N = 100,000)', time: '8.6ms', status: 'Passed' },
                { name: 'Case 5: Zero-sum paired complement', time: '1.9ms', status: 'Passed' },
              ].map((tc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    <span className="text-foreground text-[11px]">{tc.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-muted-foreground">{tc.time}</span>
                    <span className="text-emerald-400 font-semibold">{tc.status}</span>
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
              transition={{ duration: 0.16 }}
              className="p-3 rounded-xl bg-black/80 font-mono text-[11px] text-emerald-400/90 space-y-1.5 border border-border"
            >
              <div>$ clang++ -O3 -std=c++17 solution.cpp -o runner</div>
              <div className="text-muted-foreground">✓ Binary compiled in 62ms with zero warnings</div>
              <div>$ ./runner --verify-suite --suite=two-sum-hidden-50</div>
              <div className="text-emerald-400">✓ 50/50 hidden benchmark cases passed</div>
              <div className="text-muted-foreground">Memory usage: 11.4 MB | CPU runtime: 18ms</div>
              <div className="text-primary font-bold pt-1">Authoritative Verdict: ACCEPTED (Winner)</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Victory Banner */}
        <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            <Trophy className="size-4 text-amber-400" />
            <span>Match Verdict:</span>
            <span className="text-emerald-400 font-bold">Victory (+24 Elo)</span>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground">
            Ranked Rating: 1,866
          </span>
        </div>
      </div>
    </div>
  );
}
