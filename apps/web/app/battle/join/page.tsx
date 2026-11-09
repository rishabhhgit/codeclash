'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Swords,
  Hash,
  User,
  Eye,
  ArrowRight,
  Shield,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { getClientUsername, getApiUrl } from '../../../lib/api';

interface BattleSummary {
  id: string;
  code: string;
  title?: string;
  questionSlug?: string;
  mode: string;
  difficulty: string;
  playerCount: number;
  maxPlayers: number;
  status?: string;
}

function JoinBattleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomInput, setRoomInput] = useState<string>(() => {
    return searchParams.get('code') || '';
  });
  const [handle, setHandle] = useState<string>(() => {
    return getClientUsername();
  });
  const [selectedRole, setSelectedRole] = useState<'fighter' | 'spectator'>('fighter');
  const [error, setError] = useState<string>('');
  const [openBattles, setOpenBattles] = useState<BattleSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

  useEffect(() => {
    fetchOpenBattles();
  }, []);

  const fetchOpenBattles = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/battles?status=open`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOpenBattles(data.data);
      }
    } catch {
      // API may be quiet or empty
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    let clean = roomInput.trim();
    if (!clean) {
      setError('Please enter a room code or paste an invitation link.');
      return;
    }

    // Persist handle
    const cleanHandle = handle.trim() || 'Player';
    if (typeof window !== 'undefined') {
      localStorage.setItem('battle_username', cleanHandle);
    }

    // Support pasting full URLs (e.g. http://localhost:3000/battle/DUEL-XXXX?slug=...)
    if (clean.includes('/battle/')) {
      try {
        const urlObj = new URL(clean, window.location.origin);
        const match = urlObj.pathname.match(/\/battle\/([A-Za-z0-9_-]+)/);
        if (match) {
          const roomCode = match[1].toUpperCase();
          const slugParam = urlObj.searchParams.get('slug');
          router.push(`/battle/${roomCode}?role=${selectedRole}${slugParam ? `&slug=${slugParam}` : ''}`);
          return;
        }
      } catch {
        const match = clean.match(/\/battle\/([A-Za-z0-9_-]+)/);
        if (match) {
          clean = match[1];
        }
      }
    }

    clean = clean.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean) {
      setError('Invalid battle room code format. Please check and try again.');
      return;
    }

    router.push(`/battle/${clean}?role=${selectedRole}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Top Breadcrumb & Header */}
      <div className="mb-6">
        <Link
          href="/lobby"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Arena Lobby
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
            Join Battle Arena
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-primary/10 text-primary border border-primary/20 font-semibold">
            1v1 &amp; Spectate
          </span>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 text-pretty">
          Enter a room code or paste an invite link to jump into a real-time coding duel.
        </p>
      </div>

      {/* Main Join Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl card-shine relative space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-5">
          {/* Room Code or Link Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Room Code or Invitation Link</span>
              <span className="text-[11px] text-muted-foreground font-normal">e.g. DUEL-9X7B or paste URL</span>
            </label>
            <div className="relative">
              <Hash className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter 6-char room code or paste full battle link..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase"
              />
            </div>
          </div>

          {/* Fighter Handle Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Your Fighter Handle / Display Name</span>
              <span className="text-[11px] text-muted-foreground font-normal">Visible to your opponent</span>
            </label>
            <div className="relative">
              <User className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter handle..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Role Selector: Fighter vs Spectator */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Participation Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('fighter')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedRole === 'fighter'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="size-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                  <Swords className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Fighter (1v1 Competitor)</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed text-pretty">
                    Compete in the duel. Submit code, pass test cases, and race to first Accepted verdict.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('spectator')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedRole === 'spectator'
                    ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Eye className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Spectator (Observer)</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed text-pretty">
                    Watch the match unfold in real time. View pass telemetry and chat with referees.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm tracking-wide transition-all duration-150 shadow-md active:scale-[0.99] flex items-center justify-center gap-2 group"
            >
              <Swords className="size-4 group-hover:rotate-12 transition-transform" />
              <span>Enter Battle Arena</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Need to host a match instead?</span>
          <Link href="/battle/create" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <Plus className="size-3.5" />
            Create a New Battle Room
          </Link>
        </div>
      </div>

      {/* Available Public Rooms Section */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Live Public Arenas</h2>
            <p className="text-xs text-muted-foreground">Join or spectate matches currently waiting for challengers.</p>
          </div>
          <button
            onClick={fetchOpenBattles}
            aria-label="Refresh active rooms"
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh active rooms"
          >
            <RefreshCw className={`size-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingRooms ? (
          <div className="py-10 text-center text-xs text-muted-foreground border border-border rounded-xl">
            <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-primary" />
            Loading active rooms...
          </div>
        ) : openBattles.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-border rounded-xl space-y-2">
            <p className="text-xs text-muted-foreground text-pretty">No public rooms currently waiting.</p>
            <Link
              href="/battle/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-muted text-foreground text-xs font-medium rounded-lg transition-colors border border-border"
            >
              <Plus className="size-3.5" />
              Host First Battle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {openBattles.map((b) => (
              <div
                key={b.code}
                className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-primary">{b.code}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {b.difficulty || 'Medium'}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-foreground mt-1 line-clamp-1">
                    {b.title || b.questionSlug || 'Algorithmic Duel'}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono tabular-nums">
                    Fighters: {b.playerCount} / {b.maxPlayers || 2}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/battle/${b.code}?role=fighter`}
                    className="flex-1 py-1.5 text-center bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors"
                  >
                    Fight (Join)
                  </Link>
                  <Link
                    href={`/battle/${b.code}?role=spectator`}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors border border-border"
                  >
                    Watch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinBattlePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="size-4 animate-spin text-primary" />
          <span>Loading Battle Arena Join...</span>
        </div>
      }
    >
      <JoinBattleContent />
    </Suspense>
  );
}

