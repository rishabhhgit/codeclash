'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface RoundClockProps {
  remainingSeconds: number;
  totalSeconds?: number;
  isActive?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function RoundClock({
  remainingSeconds,
  totalSeconds = 15 * 60,
  isActive = true,
  className = '',
  showLabel = true,
}: RoundClockProps) {
  // Safe math calculations
  const safeTotal = Math.max(1, totalSeconds);
  const safeRemaining = Math.max(0, remainingSeconds);
  const fraction = Math.max(0, Math.min(1, safeRemaining / safeTotal));

  // Circular dial constants
  // ViewBox: 0 0 44 44. Center: (22, 22). Radius: 17
  const radius = 17;
  const circumference = 2 * Math.PI * radius; // ~106.81
  const strokeDashoffset = circumference * (1 - fraction);

  // Rotating second hand: completes a rotation every 60 seconds
  const secondsInMinute = safeRemaining % 60;
  // Hand angle in degrees (0 at 12 o'clock, rotates clockwise)
  const handAngle = ((60 - secondsInMinute) % 60) * 6;

  // Urgency states
  const isCritical = safeRemaining <= 60 && isActive;
  const isWarning = safeRemaining > 60 && safeRemaining <= 180 && isActive;

  // Theme colors based on urgency
  const ringColorClass = isCritical
    ? 'text-rose-500'
    : isWarning
    ? 'text-amber-500'
    : 'text-primary';

  const glowShadowClass = isCritical
    ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
    : isWarning
    ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
    : 'drop-shadow-[0_0_5px_rgba(59,130,246,0.4)]';

  // Format time MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(safeRemaining / 60);
    const secs = safeRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [safeRemaining]);

  // Second hand tip coordinates
  const handLength = 10;
  const tipX = 22 + handLength * Math.sin((handAngle * Math.PI) / 180);
  const tipY = 22 - handLength * Math.cos((handAngle * Math.PI) / 180);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border bg-card/90 backdrop-blur-sm shadow-sm transition-colors ${
        isCritical
          ? 'border-rose-500/40 bg-rose-500/5'
          : isWarning
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-border/80 hover:border-foreground/20'
      } ${className}`}
      title={`Round Clock: ${formattedTime} remaining (${Math.round(fraction * 100)}% time left)`}
    >
      {/* Round Clock Dial SVG */}
      <div className="relative size-8 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 44 44"
          className={`size-full ${glowShadowClass}`}
          aria-hidden="true"
        >
          {/* Subtle Outer Dial Rim */}
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border/40"
          />

          {/* Background Track */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-muted/40"
          />

          {/* Minute Dial Ticks at 12, 3, 6, 9 o'clock */}
          <line x1="22" y1="4.5" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/60" />
          <line x1="39.5" y1="22" x2="37" y2="22" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/60" />
          <line x1="22" y1="39.5" x2="22" y2="37" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/60" />
          <line x1="4.5" y1="22" x2="7" y2="22" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/60" />

          {/* Dynamic Progress Ring */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            className={`${ringColorClass} transition-[stroke-dashoffset] duration-500 ease-out`}
          />

          {/* Dynamic Rotating Second Hand */}
          {isActive && (
            <line
              x1="22"
              y1="22"
              x2={tipX}
              y2={tipY}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className={ringColorClass}
            />
          )}

          {/* Center Pivot Point */}
          <circle
            cx="22"
            cy="22"
            r="2.5"
            fill="currentColor"
            className={ringColorClass}
          />
        </svg>

        {/* Pulsing Dot in Critical State */}
        {isCritical && (
          <span className="absolute size-1.5 rounded-full bg-rose-500 animate-ping" />
        )}
      </div>

      {/* Monospace Digital Display */}
      <div className="flex flex-col text-left">
        <span
          className={`font-mono text-xs sm:text-sm font-bold tracking-tight tabular-nums leading-none ${
            isCritical
              ? 'text-rose-500'
              : isWarning
              ? 'text-amber-500'
              : 'text-foreground'
          }`}
        >
          {formattedTime}
        </span>
        {showLabel && (
          <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground mt-0.5 leading-none">
            {isCritical ? 'Overtime' : 'Round Clock'}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default RoundClock;
