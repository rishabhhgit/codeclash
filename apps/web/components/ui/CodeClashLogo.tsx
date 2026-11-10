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
 * Features faceted dual tournament blades clashing at 45-degree angles,
 * flanked by precision code brackets and an intense central impact spark.
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
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Blue Blade (Electric Cobalt / Cyan) */}
        <linearGradient id="ccl_blue_blade" x1="16" y1="48" x2="52" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="40%" stopColor="#2563EB" />
          <stop offset="80%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        <linearGradient id="ccl_blue_bevel" x1="18" y1="50" x2="54" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="60%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Orange Blade (Searing Ember / Forge Flame) */}
        <linearGradient id="ccl_orange_blade" x1="48" y1="48" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C2410C" />
          <stop offset="40%" stopColor="#EA580C" />
          <stop offset="80%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>

        <linearGradient id="ccl_orange_bevel" x1="46" y1="50" x2="10" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C2D12" />
          <stop offset="60%" stopColor="#9A3412" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>

        {/* Spark Flare Radial */}
        <radialGradient id="ccl_spark_radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="35%" stopColor="#BAE6FD" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>

        {/* Outer Glow Filter */}
        {withGlow && (
          <filter id="ccl_duel_glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={withGlow ? 'url(#ccl_duel_glow)' : undefined}>
        {/* Background Shield Outline (Subtle Combat Frame) */}
        <path
          d="M 32 4 L 54 14 L 54 36 C 54 48 32 58 32 58 C 32 58 10 48 10 36 L 10 14 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.12"
          strokeDasharray="2 3"
        />

        {/* Left Code Bracket < (Integrated Cyber-Frame) */}
        <path
          d="M 14 22 L 6 32 L 14 42"
          stroke="#38BDF8"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />

        {/* Right Code Bracket > (Integrated Cyber-Frame) */}
        <path
          d="M 50 22 L 58 32 L 50 42"
          stroke="#F97316"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />

        {/* ================= LEFT SWORD (Blue Katana / Rapier) ================= */}
        {/* Grip */}
        <line x1="16" y1="48" x2="22" y2="42" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
        <line x1="16" y1="48" x2="22" y2="42" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 2.5" strokeLinecap="round" />
        {/* Pommel */}
        <polygon points="12.5,48.5 15.5,45.5 18.5,48.5 15.5,51.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.8" />
        {/* Angular Crossguard */}
        <polygon points="18,37.5 27,46.5 25.5,48 16.5,39" fill="#0EA5E9" stroke="#E0F2FE" strokeWidth="0.6" />
        {/* Blade Upper Bevel (Bright light reflection) */}
        <polygon points="21,41 51.5,10.5 50,9 20,39" fill="url(#ccl_blue_blade)" />
        {/* Blade Lower Bevel (Shadow steel depth) */}
        <polygon points="21,41 51.5,10.5 53,12 23,43" fill="url(#ccl_blue_bevel)" />
        {/* Blade Center Spine (Hairline specular flash) */}
        <line x1="21.5" y1="41.5" x2="51.5" y2="10.5" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />

        {/* ================= RIGHT SWORD (Orange Saber / Scimitar) ================= */}
        {/* Grip */}
        <line x1="48" y1="48" x2="42" y2="42" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
        <line x1="48" y1="48" x2="42" y2="42" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="1 2.5" strokeLinecap="round" />
        {/* Pommel */}
        <polygon points="51.5,48.5 48.5,45.5 45.5,48.5 48.5,51.5" fill="#F97316" stroke="#9A3412" strokeWidth="0.8" />
        {/* Angular Crossguard */}
        <polygon points="46,37.5 37,46.5 38.5,48 47.5,39" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="0.6" />
        {/* Blade Upper Bevel (Bright molten reflection) */}
        <polygon points="43,41 12.5,10.5 14,9 44,39" fill="url(#ccl_orange_blade)" />
        {/* Blade Lower Bevel (Shadow forge depth) */}
        <polygon points="43,41 12.5,10.5 11,12 41,43" fill="url(#ccl_orange_bevel)" />
        {/* Blade Center Spine (Hairline specular flash) */}
        <line x1="42.5" y1="41.5" x2="12.5" y2="10.5" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />

        {/* ================= CLASH COLLISION EPICENTER ================= */}
        {/* Radiant Radial Flare */}
        <circle cx="32" cy="26" r="10" fill="url(#ccl_spark_radial)" opacity="0.85" />

        {/* 8-Point Diamond Starburst Spark */}
        {/* Vertical/Horizontal Flare */}
        <polygon points="32,17 33.5,24.5 41,26 33.5,27.5 32,35 30.5,27.5 23,26 30.5,24.5" fill="#FFFFFF" />
        {/* Diagonal Cross Spark */}
        <polygon points="32,21 34,24 37,26 34,28 32,31 30,28 27,26 30,24" fill="#E0F2FE" opacity="0.8" />

        {/* Impact Embers */}
        <circle cx="37" cy="20" r="1" fill="#FBBF24" />
        <circle cx="26" cy="21" r="0.9" fill="#38BDF8" />
        <circle cx="38" cy="31" r="0.8" fill="#F97316" />
        <circle cx="25" cy="30" r="1" fill="#60A5FA" />
      </g>
    </svg>
  );
}

/**
 * Animated High-Impact Tournament Clash Crest for Arena Announcements & Modals.
 * Features an illuminated glass backplate, synchronized shockwave pulse, and vector blades.
 */
export function CodeClashEmblem({
  size = 80,
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
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: [0.65, 1.45, 1.85], opacity: [0.8, 0.35, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-2xl border border-cyan-400/40 shadow-[0_0_24px_rgba(56,189,248,0.45)] pointer-events-none"
      />

      {/* Radiant Dual-Colored Backlight Aura */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/25 via-cyan-500/10 to-orange-500/25 blur-lg pointer-events-none" />

      {/* Beveled Specular Glass Shield Backplate */}
      <div className="relative size-full rounded-2xl bg-gradient-to-b from-neutral-800/80 via-neutral-900/90 to-neutral-950 border border-white/15 flex items-center justify-center shadow-2xl shadow-black/80 overflow-hidden">
        {/* Subtle internal corner glare */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Entrance Animation Vector Logo */}
        <motion.div
          initial={{ scale: 0.75, rotate: -6, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="relative z-10 flex items-center justify-center drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
        >
          <CodeClashLogo size={Math.round(size * 0.78)} withGlow />
        </motion.div>
      </div>
    </div>
  );
}

export default CodeClashLogo;
