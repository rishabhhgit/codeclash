'use client';

import React from 'react';

export interface CodeClashLogoProps {
  className?: string;
  size?: number;
  withGlow?: boolean;
}

/**
 * Official CodeClash Brand Logo: Code Brackets & Clashing Dual Neon Blades.
 * Features `<` in electric cyan, `>` in forge flame orange, with two crossed
 * tournament blades intersecting at an intense 4-point star lens flare.
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
        {/* Cyan Blade & Chevron Gradients */}
        <linearGradient id="ccl_cyan" x1="10" y1="30" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="ccl_blue_blade" x1="26" y1="74" x2="72" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="40%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>

        {/* Orange Blade & Chevron Gradients */}
        <linearGradient id="ccl_orange" x1="90" y1="30" x2="20" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="ccl_orange_blade" x1="74" y1="74" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C2410C" />
          <stop offset="40%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#FED7AA" />
        </linearGradient>

        {/* Center Clash Radial Spark Glow */}
        <radialGradient id="ccl_clash_radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="35%" stopColor="#BAE6FD" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>

        {withGlow && (
          <filter id="ccl_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={withGlow ? 'url(#ccl_glow)' : undefined}>
        {/* ================= 1. LEFT CHEVRON `<` (Electric Cyan) ================= */}
        <path
          d="M 23 32 L 13 50 L 23 68"
          stroke="#38BDF8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ================= 2. RIGHT CHEVRON `>` (Forge Orange) ================= */}
        <path
          d="M 77 32 L 87 50 L 77 68"
          stroke="#FB923C"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ================= 3. BLUE SWORD (Bottom-Left to Top-Right) ================= */}
        {/* Handle / Grip */}
        <line x1="25" y1="75" x2="33" y2="67" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
        <line x1="25" y1="75" x2="33" y2="67" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        {/* Pommel */}
        <circle cx="24.5" cy="75.5" r="2.2" fill="#38BDF8" />
        {/* Crossguard */}
        <line x1="28.5" y1="62.5" x2="37.5" y2="71.5" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
        {/* Glowing Blade */}
        <line x1="33" y1="67" x2="71" y2="29" stroke="url(#ccl_blue_blade)" strokeWidth="4.5" strokeLinecap="round" />
        {/* Specular Spine Core */}
        <line x1="34" y1="66" x2="70" y2="30" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />

        {/* ================= 4. ORANGE SWORD (Bottom-Right to Top-Left) ================= */}
        {/* Handle / Grip */}
        <line x1="75" y1="75" x2="67" y2="67" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
        <line x1="75" y1="75" x2="67" y2="67" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
        {/* Pommel */}
        <circle cx="75.5" cy="75.5" r="2.2" fill="#FB923C" />
        {/* Crossguard */}
        <line x1="71.5" y1="62.5" x2="62.5" y2="71.5" stroke="#FB923C" strokeWidth="3.5" strokeLinecap="round" />
        {/* Glowing Blade */}
        <line x1="67" y1="67" x2="29" y2="29" stroke="url(#ccl_orange_blade)" strokeWidth="4.5" strokeLinecap="round" />
        {/* Specular Spine Core */}
        <line x1="66" y1="66" x2="30" y2="30" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />

        {/* ================= 5. CLASH EPICENTER IMPACT (At (50, 50)) ================= */}
        {/* Radial Flare Glow */}
        <circle cx="50" cy="50" r="14" fill="url(#ccl_clash_radial)" />

        {/* 4-Point Primary Star Lens Flare */}
        <path
          d="M 50 36 Q 50.8 48 64 50 Q 50.8 52 50 64 Q 49.2 52 36 50 Q 49.2 48 50 36 Z"
          fill="#FFFFFF"
        />

        {/* Diagonal Secondary Flare Spark */}
        <polygon
          points="50,44 52,48 56,50 52,52 50,56 48,52 44,50 48,48"
          fill="#BAE6FD"
          opacity="0.85"
        />

        {/* Intense Center White Dot */}
        <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * High-Impact Tournament Clash Crest for Arena Announcements & Modals.
 * Features the CodeClash mark inside an illuminated dark squircle shield.
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
      {/* Radiant Cyan & Orange Backlight Aura */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-cyan-500/15 to-orange-500/30 blur-xl pointer-events-none" />

      {/* Dark Specular Squircle Shield */}
      <div className="relative size-full rounded-2xl bg-[#111622]/90 border border-white/10 flex items-center justify-center shadow-2xl shadow-black/80 overflow-hidden">
        {/* Subtle top glare */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

        {/* Centered CodeClash Mark */}
        <div className="relative z-10 flex items-center justify-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          <CodeClashLogo size={Math.round(size * 0.64)} withGlow />
        </div>
      </div>
    </div>
  );
}

export default CodeClashLogo;
