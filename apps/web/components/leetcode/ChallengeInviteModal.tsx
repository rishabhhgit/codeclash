'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  X,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Share2,
  Trophy,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { LeetCodeCardData } from './LeetCodeProfileCard';

function LeetCodeBrandIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

export interface ChallengeInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponent: LeetCodeCardData | null;
}

export default function ChallengeInviteModal({
  isOpen,
  onClose,
  opponent,
}: ChallengeInviteModalProps) {
  const router = useRouter();
  const [battleCode, setBattleCode] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (!isOpen || !opponent) return;

    let isMounted = true;
    setCopiedLink(false);
    setCopiedMessage(false);
    setCreating(true);

    const initBattleRoom = async () => {
      const fallbackCode = 'DUEL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      try {
        const token = localStorage.getItem('token') || 'guest-token';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/battles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: 'deathmatch',
            maxPlayers: 2,
            difficulty: 'medium',
            topics: ['arrays', 'two_pointers'],
            timeControl: 15,
            isPublic: false,
            name: `1v1 Duel vs @${opponent.username}`,
          }),
        });
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.data?.code) {
            setBattleCode(data.data.code);
          } else {
            setBattleCode(fallbackCode);
          }
        }
      } catch {
        if (isMounted) {
          setBattleCode(fallbackCode);
        }
      } finally {
        if (isMounted) {
          setCreating(false);
        }
      }
    };

    initBattleRoom();

    return () => {
      isMounted = false;
    };
  }, [isOpen, opponent]);

  if (!isOpen || !opponent) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://codeclash.dev';
  const inviteUrl = `${origin}/battle/${battleCode}?role=fighter`;
  const challengeText = `⚔️ Hey @${opponent.username}, I'm challenging you to a 1v1 DSA duel on CodeClash! Accept match: ${inviteUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(challengeText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleEnterRoom = () => {
    onClose();
    router.push(`/battle/${battleCode}?role=fighter`);
  };

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    opponent.username
  )}`;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 6 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md p-5 sm:p-6 rounded-xl bg-card border border-border shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground">
              <Swords className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">1v1 Duel invite</h3>
              <p className="text-xs text-muted-foreground">Challenge @{opponent.username} to a match</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Target Opponent Card */}
        <div className="p-3.5 rounded-lg bg-background border border-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={opponent.avatar || fallbackAvatar}
                alt={opponent.username}
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {opponent.realName || opponent.username}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground truncate">
                @{opponent.username}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 font-mono text-xs">
            <div className="text-foreground font-semibold tabular-nums">
              {opponent.totalSolved} solved
            </div>
            {opponent.contestRating ? (
              <div className="text-[10px] text-amber-500 font-medium tabular-nums">
                {opponent.contestRating} Elo
              </div>
            ) : null}
          </div>
        </div>

        {/* Invite Instructions Note */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Share this private link with @{opponent.username}. When they open it, they will join your room and the 1v1 battle will begin.
        </p>

        {/* Invite Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground block">
            Duel invite link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 rounded-lg bg-background border border-border font-mono text-xs text-foreground truncate select-all">
              {creating ? (
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Generating room...</span>
                </span>
              ) : (
                inviteUrl
              )}
            </div>

            <button
              type="button"
              disabled={creating || !battleCode}
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40 shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="size-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pre-formatted Challenge Message Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Direct challenge message</span>
            <button
              type="button"
              onClick={handleCopyMessage}
              disabled={creating || !battleCode}
              className="text-foreground hover:underline flex items-center gap-1 text-[11px] disabled:opacity-40"
            >
              {copiedMessage ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-500">Copied message</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy message</span>
                </>
              )}
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground font-mono leading-relaxed select-all">
            {creating ? 'Generating challenge message...' : challengeText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/70">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            Done
          </button>

          <button
            type="button"
            onClick={handleEnterRoom}
            disabled={creating || !battleCode}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-muted border border-border text-foreground font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <span>Enter waiting room</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
