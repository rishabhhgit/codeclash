import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Room } from '../../models/Room';
import { User } from '../../models/User';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import {
  joinQueue,
  leaveQueue,
  findAndRemoveMatch,
  getQueueStats,
  isInQueue,
  pickBattleProblem,
  purgeExpiredQueueEntries,
  getAllQueueEntries,
  setMatchedResult,
  getMatchedResult,
  clearMatchedResult,
  QueueEntry,
  MatchedResult,
} from '../../services/matchmaking.service';
import { isUserInActiveBattle } from '../../services/battle-persistence.service';
import { createOrGetLiveBattle } from '../../socket';
import { getMatchmakingRange } from '@codeclash/shared';

const router = Router();

let activeMatchmakingIo: any = null;

/**
 * Initialize and start the background matchmaking tick loop
 */
export function startMatchmakingEngine(io: any) {
  activeMatchmakingIo = io;
  // Run matchmaker loop every 1 second
  setInterval(() => {
    try {
      runMatchmakingTick(activeMatchmakingIo);
    } catch (err) {
      console.error('Matchmaking background tick error:', err);
    }
  }, 1000);
}

/**
 * Creates matched battle room, stores results, and emits socket events to both combatants
 */
export async function createMatchedBattle(
  entry: QueueEntry,
  opponent: QueueEntry,
  io?: any
): Promise<{ payloadA: MatchedResult; payloadB: MatchedResult }> {
  const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codeSuffix = '';
  for (let i = 0; i < 6; i++) {
    codeSuffix += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
  }
  const battleCode = `DUEL-${codeSuffix}`;

  const matchedDifficulty =
    entry.preferredDifficulty !== 'all'
      ? entry.preferredDifficulty
      : opponent.preferredDifficulty !== 'all'
        ? opponent.preferredDifficulty
        : 'medium';

  const matchedTopics = entry.preferredTopics.length ? entry.preferredTopics : opponent.preferredTopics;
  const questionSlug = pickBattleProblem(matchedDifficulty, matchedTopics);
  const mode = entry.mode || opponent.mode || 'quick';

  // Pre-initialize authoritative battle state
  createOrGetLiveBattle(battleCode, {
    title: `${entry.username || 'Player 1'} vs ${opponent.username || 'Player 2'}`,
    questionSlug,
    difficulty: matchedDifficulty.charAt(0).toUpperCase() + matchedDifficulty.slice(1),
    mode,
    durationMinutes: 20,
    status: 'waiting',
  });

  // Optionally persist room to Mongo if online
  if (mongoose.connection.readyState === 1) {
    try {
      await Room.create({
        code: battleCode,
        name: `${entry.username || 'Player 1'} vs ${opponent.username || 'Player 2'}`,
        mode,
        maxPlayers: 2,
        difficulty: matchedDifficulty,
        timeControl: 20 * 60,
        isPublic: false,
      });
    } catch {
      // Durable local persistence is active
    }
  }

  const payloadA: MatchedResult = {
    battleCode,
    questionSlug,
    difficulty: matchedDifficulty,
    mode,
    matchedAt: Date.now(),
    opponent: {
      userId: opponent.userId,
      username: opponent.username || 'Challenger',
      rating: opponent.rating,
    },
  };

  const payloadB: MatchedResult = {
    battleCode,
    questionSlug,
    difficulty: matchedDifficulty,
    mode,
    matchedAt: Date.now(),
    opponent: {
      userId: entry.userId,
      username: entry.username || 'Challenger',
      rating: entry.rating,
    },
  };

  // Cache matched results for active polling
  setMatchedResult(entry.userId, payloadA);
  setMatchedResult(opponent.userId, payloadB);

  // Deliver via Socket.IO
  const socketIo = io || activeMatchmakingIo;
  if (socketIo) {
    socketIo.to(`user:${entry.userId}`).emit('match:found', payloadA);
    socketIo.to(`user:${opponent.userId}`).emit('match:found', payloadB);

    // Also notify base user room if queue ID had a tab suffix
    const baseA = entry.userId.split(':')[0];
    const baseB = opponent.userId.split(':')[0];
    if (baseA && baseA !== entry.userId) {
      socketIo.to(`user:${baseA}`).emit('match:found', payloadA);
    }
    if (baseB && baseB !== opponent.userId) {
      socketIo.to(`user:${baseB}`).emit('match:found', payloadB);
    }
  }

  return { payloadA, payloadB };
}

/**
 * Matchmaking tick function executed every 1 second
 */
export function runMatchmakingTick(io: any) {
  // Purge expired entries (> 90 seconds)
  purgeExpiredQueueEntries(90);

  const stats = getQueueStats();
  if (stats.totalSize < 2) return;

  const entries = getAllQueueEntries();
  for (const entry of entries) {
    if (!isInQueue(entry.userId)) continue; // Already paired in this tick

    const opponent = findAndRemoveMatch(entry);
    if (!opponent) continue;

    createMatchedBattle(entry, opponent, io).catch((err) => {
      console.error('Error creating matched battle in tick:', err);
    });
  }
}

const matchRequestSchema = z.object({
  preferredDifficulty: z.enum(['easy', 'medium', 'hard', 'all', 'any']).default('all'),
  preferredTopics: z.array(z.string()).default([]),
  mode: z.string().default('quick'),
  tabId: z.string().optional(),
  force: z.boolean().optional(),
  maxWaitTime: z.number().min(10).max(300).default(60),
});

async function handleMatchmaking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rawMode = (req.params as any).mode || req.body?.mode || 'quick';
    const parsed = matchRequestSchema.safeParse(req.body || {});
    const body = parsed.success ? parsed.data : {
      preferredDifficulty: 'all' as const,
      preferredTopics: [] as string[],
      mode: rawMode,
      tabId: undefined,
      force: true,
      maxWaitTime: 60,
    };

    const preferredDifficulty = body.preferredDifficulty === 'any' ? 'all' : body.preferredDifficulty;
    const preferredTopics = body.preferredTopics;
    const mode = rawMode;
    const maxWaitTime = body.maxWaitTime;

    const user = req.user!;
    const rawUserId = user._id ? user._id.toString() : 'guest-' + Date.now();
    const tabId = (req.headers['x-tab-id'] as string) || body.tabId || '';
    // Unique identifier in queue per tab to allow multi-tab testing
    const queueUserId = tabId ? `${rawUserId}:${tabId}` : rawUserId;

    let username = user.username || user.handle || 'Coder';
    const rating = user.rating || 1000;

    // Check if another tab for the same user is already in queue
    const allQueued = getAllQueueEntries();
    const existingSameUser = allQueued.find((e) => e.userId !== queueUserId && e.userId.startsWith(rawUserId));
    if (existingSameUser) {
      username = `${username} (Tab 2)`;
    }

    // Check active battle; if force requested, proceed cleanly
    const activeCheck = isUserInActiveBattle(rawUserId);
    if (activeCheck.inBattle && !body.force) {
      return res.status(400).json({
        success: false,
        error: `Already participating in active battle [${activeCheck.battleCode}]. Complete or leave your current match first.`,
        data: { activeBattleCode: activeCheck.battleCode },
      });
    }

    // Remove stale queue entry if re-joining
    if (isInQueue(queueUserId)) {
      leaveQueue(queueUserId);
    }
    clearMatchedResult(queueUserId);

    const range = getMatchmakingRange(rating);
    const entry = joinQueue(queueUserId, {
      username,
      tabId,
      rating,
      preferredTopics,
      preferredDifficulty,
      mode,
    });

    // Immediate atomic match check
    const opponent = findAndRemoveMatch(entry);

    if (opponent) {
      const io = req.app.get('io') || activeMatchmakingIo;
      const { payloadA } = await createMatchedBattle(entry, opponent, io);

      return res.json({
        success: true,
        data: {
          status: 'matched',
          battleCode: payloadA.battleCode,
          questionSlug: payloadA.questionSlug,
          ratingRange: range,
          opponent: payloadA.opponent,
        },
      });
    }

    // Schedule timeout notification
    setTimeout(() => {
      if (leaveQueue(queueUserId)) {
        const io = req.app.get('io') || activeMatchmakingIo;
        io?.to(`user:${queueUserId}`).emit('match:timeout', {
          message: 'No opponent found within matchmaking time window. Try expanding criteria or inviting a friend!',
        });
        if (tabId) {
          io?.to(`user:${rawUserId}`).emit('match:timeout', {
            message: 'No opponent found within matchmaking time window. Try expanding criteria or inviting a friend!',
          });
        }
      }
    }, maxWaitTime * 1000);

    return res.json({
      success: true,
      data: {
        status: 'searching',
        message: 'Searching for an opponent with similar skill rating...',
        ratingRange: range,
        maxWaitTime,
        queueSize: getQueueStats().totalSize,
      },
    });
  } catch (error) {
    next(error);
  }
}

router.post('/cancel', authenticate, (req: AuthRequest, res) => {
  const tabId = (req.headers['x-tab-id'] as string) || (req.body?.tabId as string) || '';
  const rawUserId = req.user?._id?.toString() || 'guest';
  const queueUserId = tabId ? `${rawUserId}:${tabId}` : rawUserId;

  leaveQueue(queueUserId);
  leaveQueue(rawUserId);
  clearMatchedResult(queueUserId);
  clearMatchedResult(rawUserId);

  res.json({ success: true, message: 'Left matchmaking queue' });
});

router.get('/status', authenticate, (req: AuthRequest, res) => {
  const tabId = (req.headers['x-tab-id'] as string) || (req.query.tabId as string) || '';
  const rawUserId = req.user?._id?.toString() || 'guest';
  const queueUserId = tabId ? `${rawUserId}:${tabId}` : rawUserId;

  // Check if match was already found for this tab/user
  const matched = getMatchedResult(queueUserId) || getMatchedResult(rawUserId);
  if (matched) {
    return res.json({
      success: true,
      data: {
        status: 'matched',
        inQueue: false,
        ...matched,
      },
    });
  }

  const inQueue = isInQueue(queueUserId) || isInQueue(rawUserId);
  const stats = getQueueStats();

  res.json({
    success: true,
    data: {
      status: inQueue ? 'searching' : 'idle',
      inQueue,
      queueSize: stats.totalSize,
    },
  });
});

// Handlers for matchmaking modes
router.post('/quick', authenticate, handleMatchmaking);
router.post('/ranked', authenticate, handleMatchmaking);
router.post('/casual', authenticate, handleMatchmaking);
router.post('/:mode', authenticate, handleMatchmaking);

export const matchmakingRouter = router;
