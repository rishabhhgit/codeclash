'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export interface RoundClockProps {
  remainingSeconds: number;
  totalSeconds?: number;
  isActive?: boolean;
  className?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'card' | 'compact';
}

// Pre-computed 12 index tick positions for a 44x44 dial (center at 22, 22)
const DIAL_TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = i * 30; // 0, 30, 60, ..., 330 deg
  const rad = ((angle - 90) * Math.PI) / 180;
  const isCardinal = i % 3 === 0; // 12, 3, 6, 9 o'clock
  const innerR = isCardinal ? 15.5 : 17.5;
  const outerR = 19.5;
  return {
    key: i,
    x1: Number((22 + innerR * Math.cos(rad)).toFixed(2)),
    y1: Number((22 + innerR * Math.sin(rad)).toFixed(2)),
    x2: Number((22 + outerR * Math.cos(rad)).toFixed(2)),
    y2: Number((22 + outerR * Math.sin(rad)).toFixed(2)),
    isCardinal,
  };
});

export function RoundClock({
  remainingSeconds,
  totalSeconds = 15 * 60,
  isActive = true,
  className = '',
  showLabel = true,
  label = 'Round Clock',
  variant = 'card',
}: RoundClockProps) {
  // Safe math calculations
  const safeTotal = Math.max(1, totalSeconds);
  const safeRemaining = Math.max(0, remainingSeconds);
  const fraction = Math.max(0, Math.min(1, safeRemaining / safeTotal));

  // Circular dial constants: ViewBox 0 0 44 44, Center (22, 22), Radius 17.5
  const radius = 17.5;
  const circumference = 2 * Math.PI * radius; // ~109.96
  const strokeDashoffset = circumference * (1 - fraction);

  // Rotating second hand: completes a rotation every 60 seconds
  const secondsInMinute = safeRemaining % 60;
  // Clockwise hand angle in degrees (0 at 12 o'clock)
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

  // Format time (HH:MM:SS if >= 1 hour, else MM:SS)
  const formattedTime = useMemo(() => {
    const hours = Math.floor(safeRemaining / 3600);
    const mins = Math.floor((safeRemaining % 3600) / 60);
    const secs = safeRemaining % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [safeRemaining]);

  const percentageLeft = Math.round(fraction * 100);

  // Status subtitle
  const statusLabel = useMemo(() => {
    if (!isActive) return 'Paused';
    if (safeRemaining === 0) return 'Time Expired';
    if (isCritical) return 'Final Minute';
    if (isWarning) return '3m Remaining';
    return label;
  }, [isActive, safeRemaining, isCritical, isWarning, label]);

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono tabular-nums transition-colors ${
          isCritical
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
            : isWarning
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
            : 'border-border/80 bg-card/80 text-foreground'
        } ${className}`}
        title={`${label}: ${formattedTime} remaining (${percentageLeft}%)`}
      >
        <div className="relative size-4 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 44 44" className="size-full" aria-hidden="true">
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              className={`${ringColorClass} transition-[stroke-dashoffset] duration-500 ease-out`}
            />
          </svg>
        </div>
        <span className="font-semibold">{formattedTime}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative inline-flex items-center gap-3 px-3 py-1.5 rounded-lg border bg-card/90 dark:bg-card/80 backdrop-blur-md transition-colors overflow-hidden ${
        isCritical
          ? 'border-rose-500/40 bg-rose-500/[0.04]'
          : isWarning
          ? 'border-amber-500/30 bg-amber-500/[0.03]'
          : 'border-border/80 hover:border-foreground/20'
      } ${className}`}
      title={`${label}: ${formattedTime} remaining (${percentageLeft}% left)`}
    >
      {/* Precision Chronometer Dial SVG */}
      <div className="relative size-8 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 44 44"
          className="size-full select-none"
          aria-hidden="true"
        >
          {/* Subtle Outer Bezel Rim */}
          <circle
            cx="22"
            cy="22"
            r="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            className="text-border/50"
          />

          {/* 12 Hour / 5-Minute Index Marks */}
          {DIAL_TICKS.map((tick) => (
            <line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="currentColor"
              strokeWidth={tick.isCardinal ? 1.5 : 1}
              className={
                tick.isCardinal
                  ? 'text-muted-foreground/80'
                  : 'text-muted-foreground/35'
              }
            />
          ))}

          {/* Background Track Ring */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="text-muted/30"
          />

          {/* Remaining Time Progress Arc */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            className={`${ringColorClass} transition-[stroke-dashoffset] duration-500 ease-out`}
          />

          {/* Precision Rotating Second Hand with Counterbalance Tail */}
          {isActive && safeRemaining > 0 && (
            <g
              transform={`rotate(${handAngle} 22 22)`}
              className="transition-transform duration-300 ease-out"
            >
              {/* Pointer Needle */}
              <line
                x1="22"
                y1="22"
                x2="22"
                y2="10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={ringColorClass}
              />
              {/* Counterbalance Tail */}
              <line
                x1="22"
                y1="22"
                x2="22"
                y2="25.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="text-muted-foreground/60"
              />
              {/* Tail Bead */}
              <circle
                cx="22"
                cy="25.5"
                r="1"
                fill="currentColor"
                className="text-muted-foreground/60"
              />
            </g>
          )}

          {/* Center Jewel / Pivot */}
          <circle
            cx="22"
            cy="22"
            r="2"
            fill="currentColor"
            className={ringColorClass}
          />
          <circle
            cx="22"
            cy="22"
            r="0.8"
            fill="currentColor"
            className="text-background"
          />
        </svg>
      </div>

      {/* Monospace Digital Display & Micro Label */}
      <div className="flex flex-col text-left justify-center">
        <div className="flex items-center gap-1.5">
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
          <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums leading-none">
            {percentageLeft}%
          </span>
        </div>

        {showLabel && (
          <div className="flex items-center gap-1 mt-0.5 leading-none">
            <span
              className={`size-1.5 rounded-full ${
                !isActive
                  ? 'bg-muted-foreground/40'
                  : isCritical
                  ? 'bg-rose-500 animate-pulse'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span
              className={`text-[9px] font-mono tracking-wider uppercase leading-none ${
                isCritical
                  ? 'text-rose-500 font-semibold'
                  : isWarning
                  ? 'text-amber-500 font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {statusLabel}
            </span>
          </div>
        )}
      </div>

      {/* 1.5px Hairline Linear Progress Bar at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-muted/30 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isCritical
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-primary'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%` }}
        />
      </div>
    </motion.div>
  );
}

export default RoundClock;
