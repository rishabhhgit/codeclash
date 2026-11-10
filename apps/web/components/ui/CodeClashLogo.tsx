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
 * Features mathematically balanced, bold faceted tournament dual blades
 * clashing at 45-degree angles, flanked by precision code chevrons and
 * an illuminated 8-point central impact starburst.
 */
export function CodeClashLogo({
  className = '',
  size = 32,
  withGlow = false,
}: CodeClashLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Blue / Electric Cyan Blade Top Highlight */}
        <linearGradient id="blade_blue_top" x1="28" y1="68" x2="82" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="60%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#F0F9FF" />
        </linearGradient>

        {/* Blue / Deep Cobalt Blade Bottom Shadow */}
        <linearGradient id="blade_blue_bot" x1="28" y1="68" x2="82" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Orange / Molten Gold Blade Top Highlight */}
        <linearGradient id="blade_orange_top" x1="72" y1="68" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FFFBEB" />
        </linearGradient>

        {/* Orange / Burning Crimson Blade Bottom Shadow */}
        <linearGradient id="blade_orange_bot" x1="72" y1="68" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C2D12" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>

        {/* Center Spark Glow Radial */}
        <radialGradient id="spark_glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="35%" stopColor="#BAE6FD" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>

        {withGlow && (
          <filter id="ccl_duel_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={withGlow ? 'url(#ccl_duel_glow)' : undefined}>
        {/* Left Code Bracket < (Electric Cyan) */}
        <path
          d="M 20 31 L 8 46 L 20 61"
          stroke="#38BDF8"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Code Bracket > (Forge Flame) */}
        <path
          d="M 80 31 L 92 46 L 80 61"
          stroke="#FB923C"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ================= LEFT SWORD (Blue / Katana Blade) ================= */}
        {/* Grip */}
        <line x1="19" y1="77" x2="29" y2="67" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <line x1="19" y1="77" x2="29" y2="67" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
        {/* Pommel Diamond */}
        <polygon points="15,77 19,73 23,77 19,81" fill="#38BDF8" />
        {/* Angular Crossguard */}
        <path d="M 21 61 L 37 77" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" />
        <path d="M 22 62 L 36 76" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        {/* Blade Top Half */}
        <polygon points="28,68 82,14 77,12 24,64" fill="url(#blade_blue_top)" />
        {/* Blade Bottom Half */}
        <polygon points="28,68 82,14 84,19 32,72" fill="url(#blade_blue_bot)" />
        {/* Specular Center Spine */}
        <line x1="28" y1="68" x2="82" y2="14" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.95" />

        {/* ================= RIGHT SWORD (Orange / Saber Blade) ================= */}
        {/* Grip */}
        <line x1="81" y1="77" x2="71" y2="67" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <line x1="81" y1="77" x2="71" y2="67" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
        {/* Pommel Diamond */}
        <polygon points="85,77 81,73 77,77 81,81" fill="#F97316" />
        {/* Angular Crossguard */}
        <path d="M 79 61 L 63 77" stroke="#EA580C" strokeWidth="6" strokeLinecap="round" />
        <path d="M 78 62 L 64 76" stroke="#FED7AA" strokeWidth="2" strokeLinecap="round" />
        {/* Blade Top Half */}
        <polygon points="72,68 18,14 23,12 76,64" fill="url(#blade_orange_top)" />
        {/* Blade Bottom Half */}
        <polygon points="72,68 18,14 16,19 68,72" fill="url(#blade_orange_bot)" />
        {/* Specular Center Spine */}
        <line x1="72" y1="68" x2="18" y2="14" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.95" />

        {/* ================= CLASH BURST COLLISION ================= */}
        {/* Radiant Center Glow Halo */}
        <circle cx="50" cy="46" r="16" fill="url(#spark_glow)" />
        {/* 8-Point Primary Starburst */}
        <polygon points="50,30 52.5,43.5 66,46 52.5,48.5 50,62 47.5,48.5 34,46 47.5,43.5" fill="#FFFFFF" />
        {/* Diagonal Cross Secondary Flare */}
        <polygon points="50,37 51.5,44 57,46 51.5,48 50,55 48.5,48 43,46 48.5,44" fill="#BAE6FD" opacity="0.85" />
        {/* Kinetic Energy Embers */}
        <circle cx="58" cy="38" r="1.5" fill="#FBBF24" />
        <circle cx="42" cy="39" r="1.4" fill="#38BDF8" />
        <circle cx="59" cy="53" r="1.2" fill="#F97316" />
        <circle cx="41" cy="52" r="1.3" fill="#60A5FA" />
      </g>
    </svg>
  );
}

/**
 * Animated High-Impact Tournament Clash Crest for Arena Announcements & Modals.
 * Features an illuminated glass backplate, synchronized shockwave pulse, and vector blades.
 */
export function CodeClashEmblem({
  size = 88,
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
      {/* Expanding Combat Shockwave Ring */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: [0.7, 1.4, 1.8], opacity: [0.9, 0.35, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-2xl border border-cyan-400/40 shadow-[0_0_24px_rgba(56,189,248,0.45)] pointer-events-none"
      />

      {/* Radiant Dual-Colored Backlight Aura */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-cyan-500/15 to-orange-500/30 blur-lg pointer-events-none" />

      {/* Beveled Specular Glass Shield Backplate */}
      <div className="relative size-full rounded-2xl bg-gradient-to-b from-neutral-800/85 via-neutral-900/95 to-neutral-950 border border-white/20 flex items-center justify-center shadow-2xl shadow-black/90 overflow-hidden">
        {/* Subtle internal corner glare */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent pointer-events-none" />

        {/* Entrance Animation Vector Logo */}
        <motion.div
          initial={{ scale: 0.75, rotate: -6, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="relative z-10 flex items-center justify-center drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]"
        >
          <CodeClashLogo size={Math.round(size * 0.82)} withGlow />
        </motion.div>
      </div>
    </div>
  );
}

export default CodeClashLogo;
