'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, ArrowRight } from 'lucide-react';
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
  questionCategory = 'Two Pointers',
  timeLimitMinutes = 20,
}: BattleBeginsModalProps) {
  // Auto-dismiss after 3.2 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3200);
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
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'medium':
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer select-none"
        >
          {/* Dual Atmospheric Ambient Wash (Cyan vs Orange) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="absolute top-1/4 -left-20 size-[450px] rounded-full bg-cyan-600/10 blur-[130px]" />
            <div className="absolute top-1/4 -right-20 size-[450px] rounded-full bg-orange-600/10 blur-[130px]" />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="relative max-w-[430px] w-full text-center space-y-5 p-6 sm:p-7 rounded-3xl border border-white/10 bg-[#0C1017]/95 shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Match Tag */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-800/60 border border-white/10 text-neutral-400 text-[11px] font-mono tracking-wider uppercase shadow-xs"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>
                {isBattleRoyale ? 'Knockout Arena Commenced' : '1V1 CODE DUEL COMMENCED'}
              </span>
            </motion.div>

            {/* Central Brand Clash Emblem */}
            <div className="relative py-1 flex items-center justify-center">
              <CodeClashEmblem size={88} />
            </div>

            {/* Title & Subtitle */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="space-y-1"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-white">
                BATTLE BEGINS!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-normal max-w-sm mx-auto">
                {isBattleRoyale
                  ? `${playerCount} combatants deployed. Survive benchmarks to win!`
                  : 'Synchronized duel clocks started. Solve and submit first!'}
              </p>
            </motion.div>

            {/* Combatants Showcase (Duel VS or Royale Grid) */}
            {!isBattleRoyale ? (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="relative grid grid-cols-5 items-center gap-2 p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-[#121622]/80 backdrop-blur-sm"
              >
                {/* You */}
                <div className="col-span-2 text-center space-y-1">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase inline-block">
                    YOU
                  </span>
                  <div className="text-sm sm:text-base font-bold text-white truncate px-1">
                    {currentUsername}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span className="text-[11px] font-mono text-neutral-400">Ready</span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="size-8 sm:size-9 rounded-full bg-neutral-800/90 border border-neutral-700/80 flex items-center justify-center text-xs font-mono font-bold text-neutral-300 shadow-sm">
                    VS
                  </div>
                </div>

                {/* Opponent */}
                <div className="col-span-2 text-center space-y-1">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-orange-400 uppercase inline-block">
                    OPPONENT
                  </span>
                  <div className="text-sm sm:text-base font-bold text-white truncate px-1">
                    {opponentUsername}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    <span className="text-[11px] font-mono text-neutral-400">Connected</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-[#121622]/80 border border-white/10 text-xs font-mono"
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
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-[#121622]/80 flex items-center justify-between text-xs text-left backdrop-blur-sm"
            >
              <div className="min-w-0 pr-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  TARGET BENCHMARK
                </div>
                <div className="font-bold text-white truncate text-sm sm:text-base pt-0.5">
                  {questionTitle}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-neutral-800/80 border border-neutral-700/60 text-neutral-300">
                  {questionCategory}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border ${getDifficultyColor(
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
              <div className="flex items-center gap-2 text-sky-400 font-medium">
                <Clock className="size-3.5 text-sky-400" />
                <span>
                  Round Clock: <strong className="text-white font-bold tabular-nums">{timeLimitMinutes}:00</strong> Running
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-mono text-xs font-semibold transition-colors active:scale-95 group"
              >
                <span>Code Now</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono leading-none">
                  ↵
                </kbd>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Bottom Gradient Combat Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-sky-400 to-orange-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BattleBeginsModal;
