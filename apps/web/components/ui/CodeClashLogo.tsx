'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface CodeClashLogoProps {
  className?: string;
  size?: number;
  withGlow?: boolean;
}

/**
 * Authoritative CodeClash brand logo icon.
 * Vector-sharp clashing dual blades with algorithmic code brackets.
 */
export function CodeClashLogo({
  className = '',
  size = 28,
  withGlow = false,
}: CodeClashLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Left Blade Blue Gradient */}
        <linearGradient id="ccl_blue" x1="8" y1="40" x2="38" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Right Blade Orange Gradient */}
        <linearGradient id="ccl_orange" x1="40" y1="40" x2="10" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>

        {/* Center Spark Glow */}
        <radialGradient id="ccl_spark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="60%" stopColor="#93C5FD" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>

        {withGlow && (
          <filter id="ccl_filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={withGlow ? 'url(#ccl_filter)' : undefined}>
        {/* Left Code Bracket < */}
        <path
          d="M 9 17 L 3.5 24 L 9 31"
          stroke="url(#ccl_blue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Right Code Bracket > */}
        <path
          d="M 39 17 L 44.5 24 L 39 31"
          stroke="url(#ccl_orange)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* --- LEFT BLADE (Blue / Electric Cyan) Angled to (37, 11) --- */}
        {/* Pommel */}
        <circle cx="11.5" cy="36.5" r="2.2" fill="url(#ccl_blue)" />
        {/* Grip */}
        <line x1="12.5" y1="35.5" x2="17.5" y2="30.5" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
        {/* Crossguard */}
        <path
          d="M 14 28.5 L 21 35.5"
          stroke="#93C5FD"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Blade */}
        <path
          d="M 17.5 30.5 L 36.5 11.5 L 37 13 L 19 32 Z"
          fill="url(#ccl_blue)"
        />
        {/* Blade Spine / Edge Highlight */}
        <line x1="18.5" y1="29.5" x2="36.5" y2="11.5" stroke="#BFDBFE" strokeWidth="1" strokeLinecap="round" />

        {/* --- RIGHT BLADE (Orange / Searing Flame) Angled to (11, 11) --- */}
        {/* Pommel */}
        <circle cx="36.5" cy="36.5" r="2.2" fill="url(#ccl_orange)" />
        {/* Grip */}
        <line x1="35.5" y1="35.5" x2="30.5" y2="30.5" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
        {/* Crossguard */}
        <path
          d="M 34 28.5 L 27 35.5"
          stroke="#FDBA74"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Blade */}
        <path
          d="M 30.5 30.5 L 11.5 11.5 L 11 13 L 29 32 Z"
          fill="url(#ccl_orange)"
        />
        {/* Blade Spine / Edge Highlight */}
        <line x1="29.5" y1="29.5" x2="11.5" y2="11.5" stroke="#FED7AA" strokeWidth="1" strokeLinecap="round" />

        {/* --- CENTER IMPACT SPARK --- */}
        {/* Radial Glow Halo */}
        <circle cx="24" cy="22" r="5" fill="url(#ccl_spark)" opacity="0.9" />

        {/* 4-Point Impact Diamond Star */}
        <polygon
          points="24,18 25.5,21.5 28.5,22 25.5,22.5 24,26 22.5,22.5 19.5,22 22.5,21.5"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

/**
 * Animated High-Impact Clash Emblem for Arena Announcements & Modals.
 * Dynamic blade clashing animation with synchronized particle shockwave.
 */
export function CodeClashEmblem({
  size = 72,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Expanding Shockwave Ripple */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: [0.6, 1.8, 2.4], opacity: [0.9, 0.4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full border border-primary/50 shadow-[0_0_24px_rgba(59,130,246,0.5)] pointer-events-none"
      />

      {/* Radiant Background Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/15 via-orange-500/15 to-transparent blur-md pointer-events-none" />

      {/* Precision Vector Emblem with Entrance Animation */}
      <motion.div
        initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
        className="relative z-10 flex items-center justify-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
      >
        <CodeClashLogo size={size} withGlow />
      </motion.div>
    </div>
  );
}

export default CodeClashLogo;
