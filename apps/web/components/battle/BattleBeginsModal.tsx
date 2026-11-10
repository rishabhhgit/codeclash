'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, ArrowRight, Code2 } from 'lucide-react';
import { CodeClashEmblem } from '../ui/CodeClashLogo';

interface BattleBeginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: string;
  isBattleRoyale?: boolean;
  currentUsername: string;
  opponentUsername?: string;
  playerCount?: number;
  questionTitle: string;
  questionDifficulty?: string;
  questionCategory?: string;
  timeLimitMinutes?: number;
}

export function BattleBeginsModal({
  isOpen,
  onClose,
  isBattleRoyale = false,
  currentUsername,
  opponentUsername = 'Challenger',
  playerCount = 2,
  questionTitle,
  questionDifficulty = 'Medium',
  questionCategory = 'DSA',
  timeLimitMinutes = 15,
}: BattleBeginsModalProps) {
  // Auto-dismiss after 2.8 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  // Handle Enter or Space key to dismiss instantly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'hard':
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      case 'medium':
      default:
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl cursor-pointer select-none"
        >
          {/* Dual Atmospheric Ambient Wash (Cyan vs Orange) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="absolute -left-20 size-[450px] rounded-full bg-cyan-600/15 blur-[120px]" />
            <div className="absolute -right-20 size-[450px] rounded-full bg-orange-600/15 blur-[120px]" />
          </div>

          <motion.div
            initial={{ scale: 0.88, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="relative max-w-md w-full text-center space-y-5 p-6 sm:p-7 rounded-3xl border border-white/12 bg-[#0B0F17]/95 shadow-[0_0_80px_rgba(0,0,0,0.85),0_0_30px_rgba(59,130,246,0.12)] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-400/60 via-white/80 before:to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Match Tag */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-semibold tracking-wider uppercase shadow-xs"
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>
                {isBattleRoyale ? 'Knockout Arena Commenced' : '1v1 Synchronized Duel'}
              </span>
            </motion.div>

            {/* Central Brand Clash Emblem */}
            <div className="relative py-1 flex items-center justify-center">
              <CodeClashEmblem size={92} />
            </div>

            {/* Title & Subtitle */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 400 }}
              className="space-y-1"
            >
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm text-balance">
                BATTLE BEGINS!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium text-pretty max-w-sm mx-auto">
                {isBattleRoyale
                  ? `${playerCount} combatants deployed. Survive benchmarks to win!`
                  : 'Synchronized duel clocks started. Solve and submit first!'}
              </p>
            </motion.div>

            {/* Combatants Showcase (Duel VS or Royale Grid) */}
            {!isBattleRoyale ? (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="relative grid grid-cols-5 items-center gap-2 p-3.5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-sm overflow-hidden"
              >
                {/* Left Subtle Aura */}
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                {/* Right Subtle Aura */}
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />

                {/* You */}
                <div className="col-span-2 text-center space-y-1 relative z-10">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 uppercase inline-block">
                    YOU
                  </span>
                  <div className="text-sm sm:text-base font-black text-foreground truncate px-1">
                    {currentUsername}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">Ready</span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="col-span-1 flex items-center justify-center relative z-10">
                  <div className="size-10 rounded-full bg-gradient-to-br from-cyan-500/20 via-neutral-900 to-orange-500/20 border-2 border-white/20 flex items-center justify-center text-xs font-mono font-black text-white shadow-[0_0_16px_rgba(255,255,255,0.15)]">
                    VS
                  </div>
                </div>

                {/* Opponent */}
                <div className="col-span-2 text-center space-y-1 relative z-10">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-orange-500/15 border border-orange-500/30 text-orange-400 uppercase inline-block">
                    OPPONENT
                  </span>
                  <div className="text-sm sm:text-base font-black text-foreground truncate px-1">
                    {opponentUsername}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">Connected</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-mono"
              >
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <Users className="size-4" />
                  <span>{playerCount} Combatants in Arena</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Phase 1 Active</span>
              </motion.div>
            )}

            {/* Assigned Problem Badge */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-between text-xs text-left backdrop-blur-sm"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <Code2 className="size-3 text-cyan-400" />
                  <span>Target Benchmark</span>
                </div>
                <div className="font-bold text-foreground truncate text-sm sm:text-base pt-0.5">
                  {questionTitle}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/[0.05] border border-white/10 text-slate-300 font-medium">
                  {questionCategory}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${getDifficultyColor(
                    questionDifficulty
                  )}`}
                >
                  {questionDifficulty}
                </span>
              </div>
            </motion.div>

            {/* Bottom Bar: Clock Status & Tactile Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 }}
              className="flex items-center justify-between pt-1 text-[11px] font-mono"
            >
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <Clock className="size-3.5 text-cyan-400" />
                <span>
                  ROUND CLOCK: <strong className="text-white font-bold tabular-nums text-sm">{timeLimitMinutes}:00</strong> RUNNING
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95 group"
              >
                <span>Code Now</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/20 rounded text-white font-semibold">
                  ↵
                </kbd>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Bottom Auto-Dismiss Progress Bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.8, ease: 'linear' }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-primary to-orange-500 origin-left shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BattleBeginsModal;
