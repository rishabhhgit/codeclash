'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Swords,
  ExternalLink,
  Trophy,
  Trash2,
} from 'lucide-react';
import ChallengeInviteModal from './ChallengeInviteModal';

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

export default function LeetCodeProfileCard({
  data,
  onRemove,
  onChallenge,
}: {
  data: LeetCodeCardData;
  onRemove?: (username: string) => void;
  onChallenge?: (data: LeetCodeCardData) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    data.username
  )}`;

  const easyTotal = data.easyTotal || 975;
  const mediumTotal = data.mediumTotal || 2146;
  const hardTotal = data.hardTotal || 989;
  const allTotal = data.totalQuestions || 4110;

  const easyPct = Math.min(100, (data.easySolved / allTotal) * 100);
  const medPct = Math.min(100, (data.mediumSolved / allTotal) * 100);
  const hardPct = Math.min(100, (data.hardSolved / allTotal) * 100);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/leetcode/showcase/${encodeURIComponent(data.username)}`, {
        method: 'DELETE',
      });
      if (onRemove) {
        onRemove(data.username);
      }
    } catch {
      // Ignore
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card hover:border-border transition-colors p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
      {/* Header with Avatar, Details & Actions */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="size-11 rounded-lg bg-secondary border border-border/70 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={imgError || !data.avatar ? fallbackAvatar : data.avatar}
                alt={data.username}
                onError={() => setImgError(true)}
                className="size-full object-cover"
              />
            </div>

            {/* Identity & Badges */}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate" title={data.realName || data.username}>
                {data.realName || data.username}
              </h4>
              <a
                href={`https://leetcode.com/u/${data.username}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors truncate block"
              >
                @{data.username}
              </a>

              <div className="flex items-center gap-1.5 mt-1">
                {data.ranking ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                    #{data.ranking.toLocaleString()}
                  </span>
                ) : null}

                {data.contestRating ? (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                    <Trophy className="size-2.5" />
                    <span>{data.contestRating} Elo</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Social Links & Unpin Button */}
          <div className="flex items-center gap-1 shrink-0">
            {data.githubUrl && (
              <a
                href={data.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="GitHub"
              >
                <Github className="size-3.5" />
              </a>
            )}
            {data.linkedinUrl && (
              <a
                href={data.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="size-3.5" />
              </a>
            )}
            {data.twitterUrl && (
              <a
                href={data.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Twitter / X"
              >
                <Twitter className="size-3.5" />
              </a>
            )}
            {data.websiteUrl && (
              <a
                href={data.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Website"
              >
                <Globe className="size-3.5" />
              </a>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                title="Unpin profile from Hall of Fame"
                className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/60 w-full" />

        {/* Problem Solving Telemetry */}
        <div className="space-y-2.5 pt-0.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Solved questions</span>
            <div className="text-xs font-mono tabular-nums">
              <span className="text-sm font-semibold text-foreground">{data.totalSolved}</span>
              <span className="text-muted-foreground"> / {allTotal}</span>
            </div>
          </div>

          {/* Clean Segmented Ratio Bar */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              style={{ width: `${easyPct}%` }}
              className="bg-emerald-500 h-full"
              title={`Easy: ${data.easySolved}`}
            />
            <div
              style={{ width: `${medPct}%` }}
              className="bg-amber-500 h-full"
              title={`Medium: ${data.mediumSolved}`}
            />
            <div
              style={{ width: `${hardPct}%` }}
              className="bg-rose-500 h-full"
              title={`Hard: ${data.hardSolved}`}
            />
          </div>

          {/* 3 Difficulty Metric Columns */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
            <div className="p-2 rounded-lg bg-background border border-border/70 space-y-0.5">
              <div className="text-[10px] text-emerald-500 font-medium">Easy</div>
              <div className="text-foreground font-semibold tabular-nums">{data.easySolved}</div>
              <div className="text-[10px] text-muted-foreground tabular-nums">/{easyTotal}</div>
            </div>

            <div className="p-2 rounded-lg bg-background border border-border/70 space-y-0.5">
              <div className="text-[10px] text-amber-500 font-medium">Medium</div>
              <div className="text-foreground font-semibold tabular-nums">{data.mediumSolved}</div>
              <div className="text-[10px] text-muted-foreground tabular-nums">/{mediumTotal}</div>
            </div>

            <div className="p-2 rounded-lg bg-background border border-border/70 space-y-0.5">
              <div className="text-[10px] text-rose-500 font-medium">Hard</div>
              <div className="text-foreground font-semibold tabular-nums">{data.hardSolved}</div>
              <div className="text-[10px] text-muted-foreground tabular-nums">/{hardTotal}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-2 flex items-center gap-2 border-t border-border/60">
        <button
          type="button"
          onClick={() => {
            if (onChallenge) {
              onChallenge(data);
            } else {
              setShowInviteModal(true);
            }
          }}
          className="flex-1 py-2 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Swords className="size-3.5" />
          <span>Invite to Duel</span>
        </button>

        <a
          href={`https://leetcode.com/u/${data.username}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border transition-colors shrink-0"
          title="Open profile on LeetCode"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <ChallengeInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        opponent={data}
      />
    </div>
  );
}
