'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Swords,
  Users,
  Copy,
  Check,
  Share2,
  UserX,
  Play,
  CheckCircle2,
  Clock,
  Shield,
  AlertCircle,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export interface BattleLobbyQueueProps {
  battle: any;
  code: string;
  question: any;
  isHost: boolean;
  currentPlayer: any;
  playersList: any[];
  onStartBattle: () => void;
  onToggleReady: () => void;
  onKickPlayer: (targetUserId: string) => void;
  onCopyInviteLink: () => void;
  onCopyCode: () => void;
  copiedLink: boolean;
  copiedCode: boolean;
  lobbyError?: string;
  onSendMessage?: (msg: string) => void;
  chatMessages?: { id: string; sender: string; message: string; time: string }[];
}

export function BattleLobbyQueue({
  battle,
  code,
  question,
  isHost,
  currentPlayer,
  playersList,
  onStartBattle,
  onToggleReady,
  onKickPlayer,
  onCopyInviteLink,
  onCopyCode,
  copiedLink,
  copiedCode,
  lobbyError = '',
  onSendMessage,
  chatMessages = [],
}: BattleLobbyQueueProps) {
  const [chatInput, setChatInput] = useState('');
  const [playerToKick, setPlayerToKick] = useState<any | null>(null);

  const isBattleRoyale = useMemo(() => {
    return (
      battle?.mode === 'battle_royale' ||
      battle?.mode === 'royal' ||
      code.toUpperCase().startsWith('ROYAL') ||
      code.toUpperCase().startsWith('BR-') ||
      (battle?.maxPlayers && battle.maxPlayers > 2)
    );
  }, [battle?.mode, battle?.maxPlayers, code]);

  const maxSlots = battle?.maxPlayers || (isBattleRoyale ? 10 : 2);

  // Separate host from guest combatants
  const hostPlayer = useMemo(() => {
    if (battle?.hostId) {
      return playersList.find((p) => p.userId === battle.hostId) || playersList[0];
    }
    return playersList[0];
  }, [playersList, battle?.hostId]);

  const guestPlayers = useMemo(() => {
    if (!hostPlayer) return playersList.slice(1);
    return playersList.filter((p) => p.userId !== hostPlayer.userId);
  }, [playersList, hostPlayer]);

  // Check readiness of all guests
  const allGuestsReady = useMemo(() => {
    if (guestPlayers.length === 0) return false;
    return guestPlayers.every((p) => p.isReady);
  }, [guestPlayers]);

  const canStartBattle = useMemo(() => {
    if (!isHost) return false;
    // For single player testing mode
    if (maxSlots === 1) return true;
    // For multiplayer battles, require at least one guest and all guests ready
    return guestPlayers.length > 0 && allGuestsReady;
  }, [isHost, maxSlots, guestPlayers.length, allGuestsReady]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !onSendMessage) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/95 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start">
      <div className="w-full max-w-4xl space-y-6">
        {/* ================= TOP HEADER BANNER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card/80 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
                Battle Staging Room
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">
                {isBattleRoyale ? 'Knockout Arena Queue' : '1v1 Duel Lobby'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {battle?.title || (isBattleRoyale ? `Knockout Arena: ${code}` : `1v1 Duel: ${code}`)}
            </h1>
            <p className="text-xs text-muted-foreground">
              Share the unique code or invite link. Invited friends will appear below in real time.
            </p>
          </div>

          {/* Match Parameters Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted border border-border text-xs font-mono text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              <span>{battle?.durationMinutes || 15} Min</span>
            </div>
            <div
              className={`px-2.5 py-1 rounded-md border text-xs font-mono font-semibold ${
                (battle?.difficulty || question?.difficulty)?.toLowerCase() === 'easy'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : (battle?.difficulty || question?.difficulty)?.toLowerCase() === 'hard'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}
            >
              {battle?.difficulty || question?.difficulty || 'Medium'}
            </div>
            <div className="px-2.5 py-1 rounded-md bg-muted border border-border text-xs text-muted-foreground font-mono">
              DSA: {question?.category || 'Algorithms'}
            </div>
          </div>
        </div>

        {/* ================= ERROR TOAST (IF ANY) ================= */}
        <AnimatePresence>
          {lobbyError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs"
            >
              <AlertCircle className="size-4 shrink-0 text-rose-500" />
              <span>{lobbyError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= INVITE SHARE BOX ================= */}
        <div className="p-5 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Share2 className="size-4 text-primary" />
              <span>Invite Friends to this Battle</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Slot Capacity: {playersList.length} / {maxSlots}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Room Code Card */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/90">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
                  Room Code
                </span>
                <span className="text-base font-mono font-bold tracking-wider text-foreground">
                  {code}
                </span>
              </div>
              <button
                onClick={onCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 border border-border text-xs font-mono font-medium text-foreground transition-colors active:scale-95 cursor-pointer"
                title="Copy room code"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Direct Link Card */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/90">
              <div className="truncate pr-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
                  Direct Challenge Link
                </span>
                <span className="text-xs font-mono text-muted-foreground truncate block">
                  /battle/{code}
                </span>
              </div>
              <button
                onClick={onCopyInviteLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-colors active:scale-95 shrink-0 cursor-pointer shadow-xs"
                title="Copy direct invite link"
              >
                {copiedLink ? <Check className="size-3.5 text-white" /> : <Share2 className="size-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= REAL-TIME COMBATANT ROSTER ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" />
              <span>Joined Combatants ({playersList.length}/{maxSlots})</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {isHost ? '👑 You are the room host' : 'Challenger view'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Host Player Card */}
            {hostPlayer && (
              <div className="relative p-4 rounded-xl border border-primary/30 bg-card/90 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    <Crown className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-foreground">
                        {hostPlayer.username}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-500">
                        Host
                      </span>
                      {hostPlayer.userId === currentPlayer?.userId && (
                        <span className="text-[10px] font-mono text-muted-foreground">(You)</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Rating: 1450 Elo • Room Owner
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono font-semibold">
                  <CheckCircle2 className="size-3.5" />
                  <span>Host (Ready)</span>
                </div>
              </div>
            )}

            {/* 2. Guest Player Cards */}
            {guestPlayers.map((player) => (
              <div
                key={player.userId}
                className="relative p-4 rounded-xl border border-border bg-card/90 shadow-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg bg-muted border border-border text-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    <Swords className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-foreground">
                        {player.username}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-muted border border-border text-muted-foreground">
                        Challenger
                      </span>
                      {player.userId === currentPlayer?.userId && (
                        <span className="text-[10px] font-mono text-muted-foreground">(You)</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Rating: 1200 Elo • Contender
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Ready Status Badge */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                      player.isReady
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                    }`}
                  >
                    {player.isReady ? (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        <span>Ready ✓</span>
                      </>
                    ) : (
                      <>
                        <Clock className="size-3.5" />
                        <span>Not Ready</span>
                      </>
                    )}
                  </div>

                  {/* Owner Kick Control */}
                  {isHost && (
                    <button
                      onClick={() => setPlayerToKick(player)}
                      className="p-1.5 rounded-md hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title={`Kick ${player.username} from lobby`}
                      aria-label={`Kick ${player.username}`}
                    >
                      <UserX className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* 3. Empty Slots Placeholder */}
            {Array.from({ length: Math.max(0, maxSlots - playersList.length) }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 flex items-center justify-between text-muted-foreground"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg border border-dashed border-border flex items-center justify-center font-mono text-xs">
                    {playersList.length + idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      Waiting for Challenger...
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Send the invite link above to fill this slot
                    </span>
                  </div>
                </div>
                <button
                  onClick={onCopyInviteLink}
                  className="px-2.5 py-1 rounded text-xs font-mono bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= ACTION BAR & READY TOGGLE ================= */}
        <div className="p-5 rounded-xl border border-border bg-card/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isHost ? 'Launch Control' : 'Readiness Confirmation'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isHost
                  ? guestPlayers.length === 0
                    ? 'Waiting for at least 1 friend to join before starting.'
                    : !allGuestsReady
                    ? 'Invited combatants must click READY before you can start.'
                    : 'All combatants are ready! Launch battle when ready.'
                  : currentPlayer?.isReady
                  ? 'You are marked READY. Waiting for the host to start the battle.'
                  : 'Click below to confirm readiness so the host can start.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Ready Toggle for Guest Combatants */}
              {!isHost && (
                <button
                  onClick={onToggleReady}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold font-mono transition-all duration-150 shadow-xs cursor-pointer active:scale-95 ${
                    currentPlayer?.isReady
                      ? 'bg-secondary hover:bg-muted border border-border text-foreground'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {currentPlayer?.isReady ? 'Cancel Ready' : 'CONFIRM READY ✓'}
                </button>
              )}

              {/* Start Battle Button EXCLUSIVELY for Host */}
              {isHost && (
                <button
                  onClick={onStartBattle}
                  disabled={!canStartBattle}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all duration-150 shadow-sm cursor-pointer ${
                    canStartBattle
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30 active:scale-95'
                      : 'bg-muted border border-border text-muted-foreground opacity-60 cursor-not-allowed'
                  }`}
                  title={
                    guestPlayers.length === 0
                      ? 'Need at least 1 opponent to start'
                      : !allGuestsReady
                      ? 'All invited players must be ready'
                      : 'Start battle now'
                  }
                >
                  <Play className="size-3.5 fill-current" />
                  <span>START BATTLE NOW</span>
                </button>
              )}

              <Link
                href="/matchmaking"
                className="px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Exit Queue
              </Link>
            </div>
          </div>
        </div>

        {/* ================= REAL-TIME PRE-MATCH FEED & ACTIVITY ================= */}
        {battle?.feed && battle.feed.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
              Lobby Stream
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-xs text-muted-foreground">
              {battle.feed.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60">{item.time}</span>
                  <span className="text-foreground/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= KICK CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {playerToKick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                  <UserX className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Kick {playerToKick.username}?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    They will be removed from this battle lobby.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPlayerToKick(null)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onKickPlayer(playerToKick.userId);
                    setPlayerToKick(null);
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirm Kick
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BattleLobbyQueue;
