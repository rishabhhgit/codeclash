'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Sparkles, Clock, Shield, Users, ArrowRight } from 'lucide-react';

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
  // Auto-dismiss after 2.6 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2600);
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
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer select-none"
        >
          {/* Radial Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.8, 1.4, 2], opacity: [0.7, 0.4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              className="size-[500px] rounded-full bg-gradient-to-r from-primary/30 via-orange-500/20 to-transparent blur-3xl"
            />
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 25, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="relative max-w-lg w-full text-center space-y-5 p-6 sm:p-8 rounded-3xl border border-primary/30 bg-card/95 shadow-[0_0_60px_rgba(59,130,246,0.3)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Match Tag */}
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold tracking-widest uppercase shadow-sm"
            >
              <Sparkles className="size-3 text-primary animate-spin" />
              <span>
                {isBattleRoyale ? 'KNOCKOUT ARENA COMMENCED' : '1v1 CODE DUEL COMMENCED'}
              </span>
            </motion.div>

            {/* Clashing Swords Centerpiece */}
            <div className="relative py-2 flex items-center justify-center">
              {/* Expanding Shockwave Circle */}
              <motion.div
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
                className="absolute size-24 rounded-full border-2 border-primary/60 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
              />

              {/* Clash Glow */}
              <div className="relative size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-primary/20 via-orange-500/20 to-primary/10 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/25">
                {/* Left Sword swinging in */}
                <motion.div
                  initial={{ x: -40, y: -20, rotate: -60, opacity: 0 }}
                  animate={{ x: 0, y: 0, rotate: -25, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute"
                >
                  <Swords className="size-10 sm:size-12 text-primary drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                </motion.div>

                {/* Right Sword swinging in */}
                <motion.div
                  initial={{ x: 40, y: -20, rotate: 60, opacity: 0 }}
                  animate={{ x: 0, y: 0, rotate: 25, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute"
                >
                  <Swords className="size-10 sm:size-12 text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                </motion.div>
              </div>
            </div>

            {/* Giant Title */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
              className="space-y-1"
            >
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground uppercase drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
                BATTLE BEGINS!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {isBattleRoyale
                  ? `${playerCount} combatants deployed. Survive benchmarks to win!`
                  : 'Synchronized duel clocks started. Solve and submit first!'}
              </p>
            </motion.div>

            {/* Combatants Showcase (Duel VS or Royale Grid) */}
            {!isBattleRoyale ? (
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-5 items-center gap-2 p-3 rounded-2xl bg-muted/40 border border-border"
              >
                {/* You */}
                <div className="col-span-2 text-center space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    You
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {currentUsername}
                  </div>
                  <span className="inline-block size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                </div>

                {/* VS Badge */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="size-8 rounded-full bg-gradient-to-br from-primary to-orange-500 text-white font-mono font-black text-xs flex items-center justify-center shadow-md">
                    VS
                  </div>
                </div>

                {/* Opponent */}
                <div className="col-span-2 text-center space-y-1">
                  <div className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">
                    Opponent
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {opponentUsername}
                  </div>
                  <span className="inline-block size-2 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-4 p-3 rounded-2xl bg-muted/40 border border-border text-xs font-mono"
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
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="p-3 rounded-xl border border-border/80 bg-background/80 flex items-center justify-between text-xs text-left"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">
                  Problem Target
                </div>
                <div className="font-bold text-foreground truncate text-xs sm:text-sm">
                  {questionTitle}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
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
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-mono"
            >
              <div className="flex items-center gap-1.5 text-primary font-semibold">
                <Clock className="size-3.5" />
                <span>Round Clock: {timeLimitMinutes}:00 Running</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="hover:text-foreground text-primary font-bold inline-flex items-center gap-1 transition-colors"
              >
                <span>Code Now</span>
                <ArrowRight className="size-3" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BattleBeginsModal;
