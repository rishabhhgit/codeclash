import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { AppError } from '../../middleware/error';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { serializeUser } from '../../utils/serializers';

const router = Router();

export interface LiveLeaderboardPlayer {
  rank: number;
  rankDelta: number;
  user: {
    id: string;
    username: string;
    handle: string;
    avatar: string;
    rating: number;
    rank: string;
    rankLabel: string;
    totalBattles: number;
    wins: number;
    losses: number;
    winStreak: number;
    dsaSolved: number;
    dsaTotal: number;
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

// In-memory authentic activity feed (records real platform events)
export const LIVE_ACTIVITY_FEED: Array<{
  id: string;
  player: string;
  action: string;
  target: string;
  time: string;
  delta?: string;
  type?: 'solve' | 'win' | 'milestone' | 'exam';
}> = [];

/**
 * Record a real platform activity
 */
export function recordLiveActivity(item: {
  player: string;
  action: string;
  target: string;
  delta?: string;
  type?: 'solve' | 'win' | 'milestone' | 'exam';
}) {
  const newActivity = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    ...item,
    time: 'Just now',
  };
  LIVE_ACTIVITY_FEED.unshift(newActivity);
  if (LIVE_ACTIVITY_FEED.length > 30) {
    LIVE_ACTIVITY_FEED.pop();
  }
}

/**
 * Helper to fetch real users from database or memory
 */
async function fetchRealLeaderboard(): Promise<LiveLeaderboardPlayer[]> {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find().sort({ rating: -1, battleWins: -1 }).limit(100);
      if (users && users.length > 0) {
        return users.map((u, idx) => {
          const totalBattles = u.totalBattles || 0;
          const wins = u.battleWins || 0;
          const losses = u.battleLosses || 0;
          const winRate = totalBattles > 0 ? parseFloat(((wins / totalBattles) * 100).toFixed(1)) : 0;
          const rating = u.rating || 1200;
          const rank = u.rank || 'newbie';
          const rankLabel = rank.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

          return {
            rank: idx + 1,
            rankDelta: 0,
            user: {
              id: u._id.toString(),
              username: u.username || u.handle,
              handle: u.handle,
              avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.handle}`,
              rating,
              rank,
              rankLabel,
              totalBattles,
              wins,
              losses,
              winStreak: u.winStreak || 0,
              dsaSolved: 0,
              dsaTotal: 3129,
              trustScore: 100,
            },
            winRate,
            score: rating * 2 + wins * 25,
            liveStatus: (u.isOnline ? 'online' : 'offline') as any,
            weeklyWins: wins,
            monthlyWins: wins,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Leaderboard DB query error:', err);
  }

  return [];
}

router.get('/leaderboard', async (req, res) => {
  const period = req.query.period as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const realPlayers = await fetchRealLeaderboard();
  let sorted = [...realPlayers];

  if (period === 'weekly') {
    sorted.sort((a, b) => b.weeklyWins - a.weeklyWins);
  } else if (period === 'monthly') {
    sorted.sort((a, b) => b.monthlyWins - a.monthlyWins);
  } else if (period === 'live') {
    sorted.sort((a, b) => {
      const liveA = a.liveStatus === 'in_duel' || a.liveStatus === 'in_exam' ? 1 : 0;
      const liveB = b.liveStatus === 'in_duel' || b.liveStatus === 'in_exam' ? 1 : 0;
      return liveB - liveA || b.user.rating - a.user.rating;
    });
  } else {
    sorted.sort((a, b) => b.user.rating - a.user.rating);
  }

  const paginated = sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const start = (page - 1) * limit;
  const items = paginated.slice(start, start + limit);

  res.json({
    success: true,
    data: {
      items,
      total: paginated.length,
      page,
      limit,
      totalPages: Math.ceil(paginated.length / limit) || 1,
      stats: {
        totalCoders: paginated.length,
        activeInDuels: paginated.filter((p) => p.liveStatus === 'in_duel').length,
        inProctoredExams: paginated.filter((p) => p.liveStatus === 'in_exam').length,
        onlineNow: paginated.filter((p) => p.liveStatus !== 'offline').length,
      },
      activityFeed: LIVE_ACTIVITY_FEED,
    },
  });
});

router.get('/leetcode', async (_req, res) => {
  const realPlayers = await fetchRealLeaderboard();
  const sorted = [...realPlayers].sort((a, b) => b.user.dsaSolved - a.user.dsaSolved);
  res.json({
    success: true,
    data: {
      items: sorted.map((p, idx) => ({ ...p, rank: idx + 1 })),
      total: sorted.length,
      totalPages: 1,
    },
  });
});

router.get('/live', async (_req, res) => {
  const realPlayers = await fetchRealLeaderboard();
  const activePlayers = realPlayers.filter(
    (p) => p.liveStatus === 'in_duel' || p.liveStatus === 'in_exam' || p.liveStatus === 'solving'
  );
  res.json({
    success: true,
    data: {
      items: activePlayers,
      total: activePlayers.length,
      activityFeed: LIVE_ACTIVITY_FEED,
    },
  });
});

router.get('/rank/:userId', async (req, res) => {
  const realPlayers = await fetchRealLeaderboard();
  const user = realPlayers.find(
    (p) =>
      p.user.id === req.params.userId ||
      p.user.handle.toLowerCase() === req.params.userId.toLowerCase()
  );
  if (user) {
    return res.json({
      success: true,
      data: { rank: user.rank, rating: user.user.rating, rankTitle: user.user.rankLabel },
    });
  }

  res.json({
    success: true,
    data: { rank: 1, rating: 1200, rankTitle: 'Newbie' },
  });
});

router.get('/top', async (_req, res) => {
  const realPlayers = await fetchRealLeaderboard();
  const top10 = realPlayers.slice(0, 10).map((p) => ({
    ...p.user,
    winRate: p.winRate,
    score: p.score,
    liveStatus: p.liveStatus,
    activeBattleCode: p.activeBattleCode,
  }));

  res.json({ success: true, data: top10 });
});

export const rankingRouter = router;
