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
} from '../../services/matchmaking.service';
import { isUserInActiveBattle } from '../../services/battle-persistence.service';
import { createOrGetLiveBattle } from '../../socket';
import { getMatchmakingRange } from '@codeclash/shared';

const router = Router();

// Automatically purge expired queue entries every 30 seconds
setInterval(() => {
  purgeExpiredQueueEntries(90);
}, 30000);

const matchRequestSchema = z.object({
  preferredDifficulty: z.enum(['easy', 'medium', 'hard', 'all', 'any']).default('all'),
  preferredTopics: z.array(z.string()).default([]),
  mode: z.string().default('quick'),
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
      maxWaitTime: 60,
    };

    const preferredDifficulty = body.preferredDifficulty === 'any' ? 'all' : body.preferredDifficulty;
    const preferredTopics = body.preferredTopics;
    const mode = rawMode;
    const maxWaitTime = body.maxWaitTime;

    const user = req.user!;
    const userId = user._id ? user._id.toString() : 'guest-' + Date.now();
    const username = user.username || user.handle || 'Coder';
    const rating = user.rating || 1000;

    // Prevent duplicate active ranked participation
    const activeCheck = isUserInActiveBattle(userId);
    if (activeCheck.inBattle) {
      return res.status(400).json({
        success: false,
        error: `Already participating in active battle [${activeCheck.battleCode}]. Complete or leave your current match first.`,
        data: { activeBattleCode: activeCheck.battleCode },
      });
    }

    // Remove stale queue entry if re-joining
    if (isInQueue(userId)) {
      leaveQueue(userId);
    }

    const range = getMatchmakingRange(rating);
    const entry = joinQueue(userId, {
      username,
      rating,
      preferredTopics,
      preferredDifficulty,
      mode,
    });

    // Atomic match check to prevent concurrent race condition pairing
    const opponent = findAndRemoveMatch(entry);

    if (opponent) {
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

      const io = req.app.get('io');
      const payloadA = {
        battleCode,
        questionSlug,
        difficulty: matchedDifficulty,
        mode,
        opponent: {
          userId: opponent.userId,
          username: opponent.username || 'Challenger',
          rating: opponent.rating,
        },
      };

      const payloadB = {
        battleCode,
        questionSlug,
        difficulty: matchedDifficulty,
        mode,
        opponent: {
          userId: entry.userId,
          username: entry.username || 'Challenger',
          rating: entry.rating,
        },
      };

      io?.to(`user:${entry.userId}`).emit('match:found', payloadA);
      io?.to(`user:${opponent.userId}`).emit('match:found', payloadB);

      return res.json({
        success: true,
        data: {
          status: 'matched',
          battleCode,
          questionSlug,
          ratingRange: range,
          opponent: payloadA.opponent,
        },
      });
    }

    // Schedule timeout
    setTimeout(() => {
      if (leaveQueue(userId)) {
        req.app.get('io')?.to(`user:${userId}`).emit('match:timeout', {
          message: 'No opponent found within matchmaking time window. Try expanding criteria or inviting a friend!',
        });
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
  const userId = req.user?._id?.toString() || 'guest';
  leaveQueue(userId);
  res.json({ success: true, message: 'Left matchmaking queue' });
});

router.get('/status', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?._id?.toString() || 'guest';
  const inQueue = isInQueue(userId);
  const stats = getQueueStats();
  res.json({
    success: true,
    data: {
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
