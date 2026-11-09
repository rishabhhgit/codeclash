'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Swords,
  Eye,
  Search,
  Users,
  Plus,
  RefreshCw,
  Hash,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { getWsUrl, getClientAuthToken } from '@/lib/api';

interface Battle {
  id: string;
  code: string;
  title?: string;
  questionSlug?: string;
  mode: string;
  difficulty: string;
  playerCount: number;
  maxPlayers: number;
  spectatorCount?: number;
  status?: string;
}

export default function LobbyPage() {
  const router = useRouter();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchBattles();

    try {
      const socket = io(getWsUrl(), {
        transports: ['websocket', 'polling'],
        auth: {
          token: getClientAuthToken(),
        },
      });
      socketRef.current = socket;

      socket.on('lobby:battles', (data: Battle[]) => {
        if (Array.isArray(data)) setBattles(data);
        setLoading(false);
      });

      socket.on('battle:created', (battle: Battle) => {
        setBattles((prev) => [battle, ...prev]);
      });

      socket.on('battle:updated', (battle: Battle) => {
        setBattles((prev) =>
          prev.map((b) => (b.code === battle.code ? battle : b))
        );
      });

      socket.on('battle:ended', (code: string) => {
        setBattles((prev) => prev.filter((b) => b.code !== code));
      });
    } catch {
      setLoading(false);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchBattles = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/battles?status=open`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBattles(data.data);
      }
    } catch {
      // Network unavailable — show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = (role: 'fighter' | 'spectator' = 'fighter') => {
    let clean = joinCode.trim();
    if (!clean) return;

    // Support pasting full URLs (e.g. http://localhost:3000/battle/DUEL-XXXX?slug=...)
    if (clean.includes('/battle/')) {
      try {
        const urlObj = new URL(clean, window.location.origin);
        const match = urlObj.pathname.match(/\/battle\/([A-Za-z0-9_-]+)/);
        if (match) {
          clean = match[1];
          const slugParam = urlObj.searchParams.get('slug');
          router.push(`/battle/${clean.toUpperCase()}?role=${role}${slugParam ? `&slug=${slugParam}` : ''}`);
          return;
        }
      } catch {
        const match = clean.match(/\/battle\/([A-Za-z0-9_-]+)/);
        if (match) clean = match[1];
      }
    }

    clean = clean.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean) {
      router.push(`/battle/${clean}?role=${role}`);
    }
  };

  const filteredBattles = battles.filter(
    (b) =>
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.title && b.title.toLowerCase().includes(search.toLowerCase())) ||
      (b.questionSlug &&
        b.questionSlug.toLowerCase().includes(search.toLowerCase()))
  );

  const getDifficultyBadge = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (d === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (d === 'hard') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header and Quick Join */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Competitive Match Lobby
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-primary/10 text-primary border border-primary/20 font-semibold">
              🏆 Knockout Arenas &amp; 1v1 Blitz Duels
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-xl">
            Enter multi-player knockout arenas or challenge your friends to 1v1 blitz duels. Spectate active matches live.
          </p>
        </div>

        {/* Join by Unique Code or Link */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="relative">
            <Hash className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode('fighter')}
              placeholder="Room code (e.g. DUEL-ABCD) or paste link"
              className="pl-8 pr-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary w-72 transition-colors"
            />
          </div>
          <button
            onClick={() => handleJoinByCode('fighter')}
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            Join Battle
          </button>
          <button
            onClick={() => handleJoinByCode('spectator')}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-medium transition-colors active:scale-[0.98]"
          >
            Spectate
          </button>
        </div>
      </div>

      {/* Rooms Section */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-muted-foreground">
              {loading
                ? 'Loading rooms...'
                : `Available rooms (${filteredBattles.length})`}
            </div>
            <button
              onClick={fetchBattles}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 w-40 transition-colors"
              />
            </div>
            <Link
              href="/battle/create"
              className="text-xs text-foreground font-medium flex items-center gap-1 px-3 py-1.5 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create room
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Loading active rooms...
            </p>
          </div>
        ) : filteredBattles.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-xl">
            <Swords className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground mb-1">
              No active rooms
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Be the first to create a battle room.
            </p>
            <Link
              href="/battle/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground hover:opacity-90 text-background text-xs font-medium rounded-lg transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Battle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBattles.map((b) => (
              <div
                key={b.code}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-muted border border-border">
                      {b.code}
                    </span>
                    {b.mode === 'battle_royale' || b.mode === 'royal' ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        🏆 Knockout Arena
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        ⚔️ 1v1 Duel
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(b.difficulty)}`}>
                      {b.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 border border-border text-muted-foreground">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        b.status === 'active'
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="capitalize">{b.status || 'waiting'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {b.title || `Duel ${b.code}`}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {b.playerCount} / {b.maxPlayers} Fighters
                    </span>
                    {b.spectatorCount != null && b.spectatorCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        {b.spectatorCount} Spectating
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    href={`/battle/${b.code}?role=spectator`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Spectate
                  </Link>
                  <Link
                    href={`/battle/${b.code}?role=fighter`}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Enter Duel
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
