'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Swords,
  ExternalLink,
  Trophy,
  Award,
} from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

export interface LeetCodeCardData {
  username: string;
  realName?: string;
  avatar?: string;
  ranking?: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalQuestions?: number;
  easyTotal?: number;
  mediumTotal?: number;
  hardTotal?: number;
  contestRating?: number;
  globalRanking?: number;
  githubUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  countryName?: string;
  company?: string;
}

export function LeetCodeCircularProgress({
  solved,
  total = 4110,
}: {
  solved: number;
  total?: number;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (solved / (total || 4110)) * 100));
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="relative size-24 flex items-center justify-center shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-muted/40"
          strokeWidth="6"
          fill="none"
        />
        {/* Animated solved progress */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-amber-400"
          strokeWidth="6"
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-black font-mono text-foreground leading-none tabular-nums">
          {solved}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
          Solved
        </span>
      </div>
    </div>
  );
}

export function DifficultyProgressBar({
  label,
  solved,
  total,
  color,
  bgColor,
  textColor,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className={`font-semibold ${textColor}`}>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          <strong className="text-foreground">{solved}</strong>
          <span className="text-[10px]">/{total}</span>
        </span>
      </div>
      <div className={`h-1.5 w-full ${bgColor} rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function LeetCodeProfileCard({
  data,
  onDuel,
}: {
  data: LeetCodeCardData;
  onDuel?: (username: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    data.username
  )}`;

  const easyTotal = data.easyTotal || 975;
  const mediumTotal = data.mediumTotal || 2146;
  const hardTotal = data.hardTotal || 989;
  const allTotal = data.totalQuestions || 4110;

  return (
    <SpotlightCard className="p-5 rounded-3xl border-border/80 bg-card/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group">
      {/* Top accent glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Header with Avatar, Identity & Social Links */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="size-14 rounded-2xl bg-secondary/80 border border-border/80 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
              <img
                src={imgError || !data.avatar ? fallbackAvatar : data.avatar}
                alt={data.username}
                onError={() => setImgError(true)}
                className="size-full object-cover"
              />
            </div>

            {/* Name & Handle */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-foreground truncate" title={data.realName || data.username}>
                  {data.realName || data.username}
                </h4>
              </div>
              <a
                href={`https://leetcode.com/u/${data.username}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-muted-foreground hover:text-amber-400 transition-colors truncate block"
              >
                @{data.username}
              </a>

              {/* Rank and Contest Rating */}
              <div className="flex items-center gap-2 mt-1">
                {data.ranking ? (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/60">
                    #{data.ranking.toLocaleString()}
                  </span>
                ) : null}

                {data.contestRating ? (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Trophy className="size-2.5" />
                    <span>{data.contestRating} Elo</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Social Links Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {data.githubUrl && (
              <a
                href={data.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="GitHub Profile"
              >
                <Github className="size-3.5" />
              </a>
            )}
            {data.linkedinUrl && (
              <a
                href={data.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-secondary transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin className="size-3.5" />
              </a>
            )}
            {data.twitterUrl && (
              <a
                href={data.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-secondary transition-colors"
                title="Twitter / X Profile"
              >
                <Twitter className="size-3.5" />
              </a>
            )}
            {data.websiteUrl && (
              <a
                href={data.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-secondary transition-colors"
                title="Personal Website"
              >
                <Globe className="size-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/60 w-full" />

        {/* Stats Section: Circular Solved Progress & Breakdown Bars */}
        <div className="flex items-center gap-4 pt-1">
          <LeetCodeCircularProgress solved={data.totalSolved} total={allTotal} />

          <div className="flex-1 space-y-2 min-w-0">
            <DifficultyProgressBar
              label="Easy"
              solved={data.easySolved}
              total={easyTotal}
              color="bg-emerald-500"
              bgColor="bg-emerald-500/15"
              textColor="text-emerald-400"
            />
            <DifficultyProgressBar
              label="Med"
              solved={data.mediumSolved}
              total={mediumTotal}
              color="bg-amber-500"
              bgColor="bg-amber-500/15"
              textColor="text-amber-400"
            />
            <DifficultyProgressBar
              label="Hard"
              solved={data.hardSolved}
              total={hardTotal}
              color="bg-rose-500"
              bgColor="bg-rose-500/15"
              textColor="text-rose-400"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-2 flex items-center gap-2 border-t border-border/60">
        <Link
          href={`/battle/create?opponent=${encodeURIComponent(data.username)}`}
          className="flex-1 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
        >
          <Swords className="size-3.5" />
          <span>Challenge 1v1</span>
        </Link>

        <a
          href={`https://leetcode.com/u/${data.username}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 transition-colors"
          title="Open in LeetCode"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </SpotlightCard>
  );
}
