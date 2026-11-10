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
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer select-none"
        >
          {/* Subtle Backlight Glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="size-[420px] rounded-full bg-gradient-to-r from-blue-600/15 via-orange-500/10 to-transparent blur-3xl" />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="relative max-w-md w-full text-center space-y-5 p-6 sm:p-7 rounded-2xl border border-white/10 bg-card/95 shadow-2xl overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-500/50 before:to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Match Tag */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border text-foreground text-[11px] font-mono font-medium tracking-wide uppercase shadow-xs"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-muted-foreground">
                {isBattleRoyale ? 'Knockout Arena Commenced' : '1v1 Code Duel Commenced'}
              </span>
            </motion.div>

            {/* Central Brand Clash Emblem */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="relative size-20 sm:size-22 rounded-2xl bg-gradient-to-b from-secondary/80 to-background border border-border/80 flex items-center justify-center shadow-lg shadow-black/40">
                <CodeClashEmblem size={52} />
              </div>
            </div>

            {/* Title & Subtitle */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 400 }}
              className="space-y-1"
            >
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase text-balance">
                BATTLE BEGINS!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium text-pretty">
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
                className="grid grid-cols-5 items-center gap-2 p-3 rounded-xl bg-background/80 border border-border"
              >
                {/* You */}
                <div className="col-span-2 text-center space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    You
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate px-1">
                    {currentUsername}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-muted-foreground">Ready</span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="size-8 rounded-full bg-gradient-to-br from-blue-500/20 via-muted to-orange-500/20 border border-border text-foreground font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    VS
                  </div>
                </div>

                {/* Opponent */}
                <div className="col-span-2 text-center space-y-1">
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Opponent
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate px-1">
                    {opponentUsername}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-mono text-muted-foreground">Connected</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="flex items-center justify-center gap-3 p-3 rounded-xl bg-background/80 border border-border text-xs font-mono"
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
              className="p-3 rounded-xl border border-border bg-background/60 flex items-center justify-between text-xs text-left"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Target Benchmark
                </div>
                <div className="font-bold text-foreground truncate text-xs sm:text-sm">
                  {questionTitle}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground border border-border">
                  {questionCategory}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getDifficultyColor(
                    questionDifficulty
                  )}`}
                >
                  {questionDifficulty}
                </span>
              </div>
            </motion.div>

            {/* Bottom Bar: Clock Status & Dismiss Prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 }}
              className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-mono"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Clock className="size-3.5 text-primary" />
                <span>Round Clock: <strong className="text-foreground tabular-nums">{timeLimitMinutes}:00</strong> Running</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="hover:text-foreground text-primary font-semibold inline-flex items-center gap-1.5 transition-colors group"
              >
                <span>Code Now</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-muted border border-border rounded text-muted-foreground group-hover:text-foreground">
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
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-primary to-orange-500 origin-left"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BattleBeginsModal;
