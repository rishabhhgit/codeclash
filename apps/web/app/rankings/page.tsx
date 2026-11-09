'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import {
  Trophy,
  Flame,
  Shield,
  Eye,
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Radio,
  Zap,
  Code2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { getWsUrl } from '@/lib/api';

export interface LeaderboardEntry {
  rank: number;
  rankDelta: number;
  user: {
    id: string;
    username: string;
    avatar: string;
    rating: number;
    rank: string;
    rankLabel: string;
    totalBattles: number;
    wins: number;
    losses: number;
    winStreak: number;
    dsaSolved?: number;
    dsaTotal?: number;
    trustScore: number;
  };
  winRate: number;
  score: number;
  liveStatus: 'in_duel' | 'in_exam' | 'solving' | 'online' | 'offline';
  activeBattleCode?: string;
  activeExamId?: string;
  solvingProblem?: string;
  lastSolveAgo?: string;
  weeklyWins: number;
  monthlyWins: number;
}

export interface ActivityFeedItem {
  id: string;
  player: string;
  action: string;
  target: string;
  time: string;
  delta?: string;
  type?: 'solve' | 'win' | 'milestone' | 'exam';
}

type TabType = 'live' | 'global' | 'streaks' | 'core150' | 'weekly';

const RANK_BADGES: Record<string, { label: string; color: string; border: string; bg: string }> = {
  legendary_grandmaster: { label: 'Legendary Grandmaster', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  international_grandmaster: { label: 'International GM', color: 'text-rose-400', border: 'border-rose-400/20', bg: 'bg-rose-400/10' },
  grandmaster: { label: 'Grandmaster', color: 'text-rose-400', border: 'border-rose-400/20', bg: 'bg-rose-500/10' },
  international_master: { label: 'International Master', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
  master: { label: 'Master', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
  candidate_master: { label: 'Candidate Master', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
  expert: { label: 'Expert', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  specialist: { label: 'Specialist', color: 'text-teal-400', border: 'border-teal-500/20', bg: 'bg-teal-500/10' },
  pupil: { label: 'Pupil', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  newbie: { label: 'Newbie', color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted' },
};

export default function LiveLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCoders: 0,
    activeInDuels: 0,
    inProctoredExams: 0,
    onlineNow: 0,
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('battle_username');
      if (stored) {
        setCurrentUsername(stored);
      }
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    try {
      const socket = io(getWsUrl(), {
        transports: ['websocket', 'polling'],
        auth: { token: typeof window !== 'undefined' ? localStorage.getItem('token') || 'guest-token' : 'guest-token' },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketConnected(true);
        socket.emit('leaderboard:subscribe');
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('leaderboard:activity', (item: ActivityFeedItem) => {
        setActivityFeed((prev) => [item, ...prev.slice(0, 6)]);
        setLastUpdated(new Date().toLocaleTimeString());
      });

      socket.on('leaderboard:update', (updated: LeaderboardEntry[]) => {
        if (Array.isArray(updated) && updated.length > 0) {
          setLeaderboard(updated);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      });
    } catch {
      // Offline fallback
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/rankings/leaderboard`;
      if (activeTab === 'weekly') endpoint += `?period=weekly`;
      else if (activeTab === 'live') endpoint += `?period=live`;
      else if (activeTab === 'core150') endpoint = `/api/rankings/leetcode`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`);
      const data = await res.json();
      if (data.success) {
        let items: LeaderboardEntry[] = data.data.items || [];
        if (activeTab === 'streaks') {
          items = [...items].sort((a, b) => b.user.winStreak - a.user.winStreak);
        }
        setLeaderboard(items);
        if (data.data.stats) setStats(data.data.stats);
        if (data.data.activityFeed) setActivityFeed(data.data.activityFeed);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      entry.user.username.toLowerCase().includes(query) ||
      entry.user.rankLabel.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header and Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Global competitive rankings, active arena battles, and proctored assessment records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-foreground">
            <span
              className={`size-1.5 rounded-full ${
                socketConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="font-mono text-muted-foreground text-[11px]">
              {socketConnected ? 'Live stream connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border card-elevated motion-enter">
          <div className="text-xs text-muted-foreground font-medium mb-1">Ranked coders</div>
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            {stats.totalCoders.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono">
            Active participants
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border card-elevated motion-enter">
          <div className="text-xs text-muted-foreground font-medium mb-1">Active in duels</div>
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            {stats.activeInDuels}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            <Link href="/lobby" className="hover:text-foreground transition-colors duration-150 underline underline-offset-2">
              Browse Arena Lobby &rarr;
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border card-elevated motion-enter">
          <div className="text-xs text-muted-foreground font-medium mb-1">Active Assessments</div>
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            {stats.inProctoredExams}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            <Link href="/exam/demo-sync-session" className="hover:text-foreground transition-colors duration-150 underline underline-offset-2">
              Assessment Monitor &rarr;
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border card-elevated motion-enter">
          <div className="text-xs text-muted-foreground font-medium mb-1">Your status</div>
          <div className="text-2xl font-semibold text-emerald-500 tabular-nums">
            {currentUsername ? `#${leaderboard.findIndex(e => e.user.username === currentUsername) + 1 || '—'}` : 'Guest'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
            {currentUsername ? currentUsername : 'Sign in to track rank'}
          </div>
        </div>
      </div>

      {/* Activity Feed Bar */}
      {activityFeed.length > 0 && (
        <div className="mb-6 px-3.5 py-2.5 rounded-lg bg-card/60 border border-border flex items-center gap-3 overflow-hidden text-xs card-elevated motion-enter">
          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px] shrink-0">
            <Radio className="size-3 text-emerald-500" />
            Feed:
          </div>
          <div className="overflow-x-auto no-scrollbar whitespace-nowrap text-foreground flex items-center gap-4">
            {activityFeed.slice(0, 4).map((feed) => (
              <div key={feed.id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{feed.player}</span>
                <span>{feed.action}</span>
                <span className="text-foreground font-medium">{feed.target}</span>
                {feed.delta && (
                  <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 rounded bg-muted">
                    {feed.delta}
                  </span>
                )}
                <span className="text-muted-foreground/60 text-[10px]">&middot; {feed.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs and Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-1 p-1 bg-muted/80 rounded-lg border border-border w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'global'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Global rating
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            In active match
          </button>

          <button
            onClick={() => setActiveTab('streaks')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'streaks'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Win streaks
          </button>

          <button
            onClick={() => setActiveTab('core150')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'core150'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Core 150
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-150 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly sprint
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors duration-150"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm card-elevated motion-enter">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-medium">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Competitor</th>
                <th className="py-3 px-4">Status &amp; Action</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Core 150</th>
                <th className="py-3 px-4">Duels</th>
                <th className="py-3 px-4 text-right">Trust score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-muted-foreground" />
                    Loading leaderboard...
                  </td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    No coders match this query.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry) => {
                  const isUser = currentUsername && entry.user.username === currentUsername;
                  const rankMeta =
                    RANK_BADGES[entry.user.rank.toLowerCase()] || RANK_BADGES.expert;

                  return (
                    <tr
                      key={entry.user.id}
                      className={`hover:bg-muted/40 transition-colors duration-150 ${
                        isUser ? 'bg-muted/30 font-medium' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-mono text-xs tabular-nums">
                          {entry.rank === 1 ? (
                            <span className="size-6 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 font-semibold flex items-center justify-center text-xs">
                              1
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="size-6 rounded-md bg-muted border border-border text-foreground font-semibold flex items-center justify-center text-xs">
                              2
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="size-6 rounded-md bg-amber-700/10 border border-amber-700/30 text-amber-600 font-semibold flex items-center justify-center text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-medium">#{entry.rank}</span>
                          )}

                          <span className="text-[10px] text-muted-foreground">
                            {entry.rankDelta > 0 ? (
                              <span className="text-emerald-500">+{entry.rankDelta}</span>
                            ) : entry.rankDelta < 0 ? (
                              <span className="text-rose-500">{entry.rankDelta}</span>
                            ) : null}
                          </span>
                        </div>
                      </td>

                      {/* Competitor Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.user.username}`}
                            alt={entry.user.username}
                            className="size-8 rounded-lg border border-border bg-muted object-cover"
                          />

                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <span>{entry.user.username}</span>
                              {isUser && (
                                <span className="px-1 py-0.2 rounded text-[10px] font-mono text-muted-foreground bg-muted">
                                  you
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${rankMeta.bg} ${rankMeta.border} ${rankMeta.color}`}
                              >
                                {entry.user.rankLabel}
                              </span>
                              {entry.lastSolveAgo && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {entry.lastSolveAgo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Live Status & Action */}
                      <td className="py-3 px-4">
                        {entry.liveStatus === 'in_duel' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              {entry.activeBattleCode || 'Arena'}
                            </span>
                            <Link
                              href={entry.activeBattleCode ? `/battle/${entry.activeBattleCode}?role=spectator` : '/lobby'}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors duration-150 active:scale-[0.98] flex items-center gap-1"
                            >
                              <Eye className="size-3" />
                              Spectate
                            </Link>
                          </div>
                        ) : entry.liveStatus === 'in_exam' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Shield className="size-3 text-purple-400" />
                              Assessment
                            </span>
                            <Link
                              href={`/exam/${entry.activeExamId || 'demo-sync-session'}`}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors duration-150 active:scale-[0.98] flex items-center gap-1"
                            >
                              Monitor
                            </Link>
                          </div>
                        ) : entry.liveStatus === 'solving' ? (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            Solving {entry.solvingProblem || 'Problem'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px]">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Online
                            </span>
                            {!isUser && (
                              <Link
                                href="/battle/create"
                                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors duration-150"
                              >
                                Duel
                              </Link>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-foreground">
                        <div className="font-semibold">{entry.user.rating}</div>
                        <div className="text-[10px] text-muted-foreground">{entry.score} pts</div>
                      </td>

                      {/* Core 150 Progress */}
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-foreground">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span>{entry.user.dsaSolved ?? 0}</span>
                          <span className="text-muted-foreground text-[11px]">/ {entry.user.dsaTotal ?? 150}</span>
                        </div>
                        <div className="w-24 bg-muted h-1 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-foreground/50 h-full rounded-full transition-[width] duration-200 ease-out"
                            style={{
                              width: `${((entry.user.dsaSolved ?? 0) / (entry.user.dsaTotal ?? 150)) * 100}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Duel Record */}
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{entry.winRate}%</span>
                          {entry.user.winStreak >= 3 && (
                            <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                              <Flame className="size-2.5" />
                              {entry.user.winStreak} streak
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {entry.user.wins}W &middot; {entry.user.losses}L
                        </div>
                      </td>

                      {/* Trust Score */}
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Shield className="size-3 text-muted-foreground" />
                          {entry.user.trustScore}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
