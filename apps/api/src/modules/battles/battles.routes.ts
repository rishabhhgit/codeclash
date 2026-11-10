import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Room } from '../../models/Room';
import { User } from '../../models/User';
import { Submission } from '../../models/Submission';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/error';
import {
  uniqueRoomCode,
  assignFairProblem,
  canStartBattle,
  populateUsersMap,
  toProblemPayload,
  generateInviteCode,
  getRequiredPlayers,
  finalizeBattle,
} from '../../services/battle.service';
import { startSubmissionTracker, checkPlayerStatus } from '../../services/submission-tracker.service';
import { serializeRoom } from '../../utils/serializers';
import { getProblemUrl } from '../../services/competitive';
import { getQuestionBySlug, pickQuestionForBattle } from '../../../../web/lib/questions/data';
import { createOrGetLiveBattle, getPersistedBattle } from '../../socket';

const router = Router();

const BATTLE_MODES = [
  '1v1_duel',
  'ranked_duel',
  'unranked_duel',
  'deathmatch',
  'multiplayer',
  'public_room',
  'private_room',
  'topic_battle',
  'battle_royale',
  'royal',
  'arena',
  'survival',
  'bestof3',
  'speedrun',
  'topicdraft',
] as const;

const createBattleSchema = z.object({
  body: z.object({
    mode: z
      .preprocess((v) => (typeof v === 'string' ? v.toLowerCase() : v), z.enum(BATTLE_MODES))
      .default('1v1_duel'),
    maxPlayers: z
      .preprocess((v) => (typeof v === 'string' ? parseInt(v, 10) : v), z.number().min(2).max(100))
      .default(2),
    difficulty: z
      .preprocess(
        (v) => (typeof v === 'string' ? v.toLowerCase() : v),
        z.enum(['easy', 'medium', 'hard', 'all'])
      )
      .default('medium'),
    topics: z.array(z.string()).default([]),
    timeControl: z
      .preprocess((v) => (typeof v === 'string' ? parseInt(v, 10) : v), z.number().min(5).max(120))
      .default(30),
    isPublic: z
      .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
      .default(true),
    joinApproval: z
      .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
      .default(false),
    name: z.string().optional(),
    slug: z.string().optional(),
    questionSlug: z.string().optional(),
  }),
});

const inMemoryRoomsMap = new Map<string, any>();

router.get('/lobby/public', async (req, res, _next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      isPublic: true,
      status: { $in: ['waiting', 'starting', 'active'] },
    };

    let rooms: any[] = [];
    let total = 0;
    let onlineCount = 0;

    try {
      [rooms, total, onlineCount] = await Promise.all([
        Room.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Room.countDocuments(filter),
        User.countDocuments({ isOnline: true }),
      ]);
    } catch {
      // DB offline fallback
    }

    let serialized: any[] = [];
    if (rooms.length > 0) {
      serialized = await Promise.all(
        rooms.map(async (room) => {
          const usersMap = await populateUsersMap(room);
          return serializeRoom(room, usersMap);
        })
      );
    } else {
      // Use in-memory rooms
      serialized = Array.from(inMemoryRoomsMap.values());
      total = serialized.length;
    }

    const activeCount = Array.from(inMemoryRoomsMap.values()).filter((r: any) => r.status === 'active').length;
    const waitingCount = Array.from(inMemoryRoomsMap.values()).filter((r: any) => r.status === 'waiting' || r.status === 'open').length;

    res.json({
      success: true,
      data: {
        items: serialized,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        stats: {
          onlinePlayers: onlineCount || 0,
          activeBattles: activeCount,
          waitingBattles: waitingCount,
        },
        topPlayers: [],
        recentWinners: [],
      },
    });
  } catch (error) {
    const activeCount = Array.from(inMemoryRoomsMap.values()).filter((r: any) => r.status === 'active').length;
    const waitingCount = Array.from(inMemoryRoomsMap.values()).filter((r: any) => r.status === 'waiting' || r.status === 'open').length;

    res.json({
      success: true,
      data: {
        items: Array.from(inMemoryRoomsMap.values()),
        total: inMemoryRoomsMap.size,
        page: 1,
        limit: 20,
        totalPages: 1,
        stats: { onlinePlayers: 0, activeBattles: activeCount, waitingBattles: waitingCount },
        topPlayers: [],
        recentWinners: [],
      },
    });
  }
});

router.get('/lobby/feed', async (_req, res, next) => {
  try {
    const recent = await Room.find({ status: { $in: ['active', 'completed'] } })
      .sort({ updatedAt: -1 })
      .limit(10);

    const feed = await Promise.all(
      recent.map(async (room) => {
        const usersMap = await populateUsersMap(room);
        const winner = room.winner ? usersMap.get(room.winner.toString()) : null;
        return {
          code: room.code,
          mode: room.mode,
          status: room.status,
          playerCount: room.players.length,
          winner: winner?.username || (winner as any)?.handle,
        };
      })
    );

    res.json({ success: true, data: feed });
  } catch (error) {
    res.json({
      success: true,
      data: [],
    });
  }
});

router.post('/', authenticate, validate(createBattleSchema), async (req: AuthRequest, res, _next) => {
  try {
    const { mode: rawMode, maxPlayers, difficulty, topics, timeControl, isPublic, joinApproval, name, slug, questionSlug } =
      req.body;

    const mode = (rawMode === 'royal' || rawMode === 'battle_royale') ? 'battle_royale' : rawMode;
    const isBR = mode === 'battle_royale';

    // Pick topic-based question if explicit slug is not supplied
    let chosenQuestion: any = null;
    const directSlug = slug || questionSlug;
    if (directSlug) {
      chosenQuestion = getQuestionBySlug(directSlug);
    }
    if (!chosenQuestion) {
      chosenQuestion = pickQuestionForBattle({
        topics: Array.isArray(topics) ? topics : [],
        difficulty,
      });
    }

    const selectedSlug = chosenQuestion.slug;

    const hostId = req.user!._id;
    let room: any = null;
    const codePrefix = isBR ? 'BR' : undefined;
    let code = isBR ? `BR-${Math.floor(1000 + Math.random() * 9000)}` : `CLASH-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      code = await uniqueRoomCode(codePrefix);
      room = await Room.create({
        code,
        name: name || `${req.user!.username || (req.user!.username || (req.user as any)!.handle)}'s Battle`,
        host: hostId,
        mode,
        maxPlayers,
        difficulty,
        topics: topics.length ? topics : (chosenQuestion.topics || []),
        timeControl: timeControl * 60,
        isPublic,
        inviteCode: !isPublic ? generateInviteCode() : undefined,
        joinApproval,
        problems: [{
          contestId: 1900,
          index: 'A',
          name: chosenQuestion.title,
          tags: chosenQuestion.topics || [],
        }],
        players: [{
          user: hostId,
          status: 'waiting',
          joinedAt: new Date(),
        }],
      });

      // Pre-initialize authoritative live battle state so socket has the topic question ready immediately
      createOrGetLiveBattle(code, {
        title: name || (isBR ? `Knockout Arena: ${code}` : `1v1 Duel: ${code}`),
        questionSlug: chosenQuestion.slug,
        difficulty: chosenQuestion.difficulty,
        mode,
        maxPlayers,
        durationMinutes: timeControl,
        status: 'waiting',
        hostId: String(hostId),
        creatorUsername: req.user!.username || (req.user as any)!.handle,
      });

      const usersMap = await populateUsersMap(room);
      const serialized = serializeRoom(room, usersMap);
      return res.status(201).json({
        success: true,
        data: {
          ...serialized,
          questionSlug: chosenQuestion.slug,
          problem: {
            title: chosenQuestion.title,
            slug: chosenQuestion.slug,
            difficulty: chosenQuestion.difficulty,
            category: chosenQuestion.category,
            topics: chosenQuestion.topics,
            description: chosenQuestion.description,
          },
        },
      });
    } catch {
      // In-memory room fallback for testing
    }

    // Pre-initialize authoritative live battle state
    createOrGetLiveBattle(code, {
      title: name || (isBR ? `Knockout Arena: ${code}` : `1v1 Duel: ${code}`),
      questionSlug: chosenQuestion.slug,
      difficulty: chosenQuestion.difficulty,
      mode,
      maxPlayers,
      durationMinutes: timeControl,
      status: 'waiting',
    });

    const createdRoom = {
      id: `room-${Date.now()}`,
      code,
      name: name || `${req.user?.username || (req.user?.username || (req.user as any)?.handle) || 'Guest'}'s Arena`,
      creatorId: hostId.toString(),
      host: hostId.toString(),
      mode,
      status: 'waiting',
      difficulty: chosenQuestion.difficulty.toLowerCase(),
      topics: topics || chosenQuestion.topics || ['arrays'],
      timeControl,
      playerCount: 1,
      maxPlayers,
      isPublic,
      joinApproval: !!joinApproval,
      pendingPlayers: [],
      spectators: [],
      currentRound: 0,
      totalRounds: 1,
      contestId: 1900,
      problemIndex: 'A',
      problems: [{
        contestId: 1900,
        index: 'A',
        name: chosenQuestion.title,
        tags: chosenQuestion.topics || [],
      }],
      startedAt: null,
      startTime: null,
      players: [
        {
          id: hostId.toString(),
          user: {
            id: hostId.toString(),
            username: req.user?.username || 'Guest',
            handle: (req.user?.username || (req.user as any)?.handle) || 'Guest',
            rating: req.user?.rating || 1200,
            rank: req.user?.rank || 'newbie',
            avatar: req.user?.avatar || '',
          },
          status: 'ready',
          score: 0,
          rank: 1,
          problemsSolved: 0,
          submissionsCount: 0,
          isAlive: true,
          isReady: true,
        },
      ],
      creator: { username: req.user?.username || 'Guest', rating: req.user?.rating || 1200 },
      createdAt: new Date().toISOString(),
      questionSlug: chosenQuestion.slug,
      problem: {
        title: chosenQuestion.title,
        slug: chosenQuestion.slug,
        difficulty: chosenQuestion.difficulty,
        category: chosenQuestion.category,
        topics: chosenQuestion.topics,
        description: chosenQuestion.description,
      },
    };

    inMemoryRoomsMap.set(code, createdRoom);
    res.status(201).json({ success: true, data: createdRoom });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to create battle' });
  }
});

router.get('/:code', async (req, res, _next) => {
  const codeUpper = req.params.code.toUpperCase();
  const memoryRoom = inMemoryRoomsMap.get(codeUpper);
  if (memoryRoom) {
    return res.json({ success: true, data: memoryRoom });
  }

  const liveBattle = getPersistedBattle(codeUpper);

  try {
    const room = await Room.findOne({ code: codeUpper });
    if (room) {
      const usersMap = await populateUsersMap(room);
      const serialized = serializeRoom(room, usersMap);
      const targetSlug =
        liveBattle?.questionSlug ||
        (room.problems?.[0] as any)?.slug ||
        (room.problems?.[0]?.name ? room.problems[0].name.toLowerCase().replace(/\s+/g, '-') : undefined);
      const problem = targetSlug ? getQuestionBySlug(targetSlug) : await toProblemPayload(serialized.contestId, serialized.problemIndex);
      return res.json({ success: true, data: { ...serialized, problem, questionSlug: targetSlug } });
    }
  } catch {
    // Continue to live battle fallback
  }

  if (liveBattle) {
    const problem = getQuestionBySlug(liveBattle.questionSlug);
    return res.json({
      success: true,
      data: {
        code: codeUpper,
        name: liveBattle.title,
        status: liveBattle.status,
        mode: liveBattle.mode,
        questionSlug: liveBattle.questionSlug,
        problem,
        players: Object.values(liveBattle.players),
      },
    });
  }

  // If not found, generate an open room waiting for combatants
  const generatedRoom = {
    id: `room-${codeUpper}`,
    code: codeUpper,
    name: `Battle Room ${codeUpper}`,
    creatorId: 'host',
    host: 'host',
    mode: '1v1_duel',
    status: 'waiting',
    difficulty: 'medium',
    topics: ['arrays'],
    timeControl: 20,
    playerCount: 0,
    maxPlayers: 2,
    isPublic: true,
    joinApproval: false,
    pendingPlayers: [],
    spectators: [],
    currentRound: 0,
    totalRounds: 1,
    contestId: 1900,
    problemIndex: 'A',
    problems: [{ contestId: 1900, index: 'A', name: 'Concatenation of Array' }],
    startedAt: new Date(),
    startTime: new Date(),
    players: [],
    creator: null,
    createdAt: new Date().toISOString(),
    problem: {
      title: 'Concatenation of Array',
      slug: 'concatenation-of-array',
      difficulty: 'Easy',
      description: 'Given an integer array nums of length n, you want to create an array ans of length 2n where ans[i] == nums[i] and ans[i + n] == nums[i] for 0 <= i < n (0-indexed).'
    }
  };

  inMemoryRoomsMap.set(codeUpper, generatedRoom);
  res.json({ success: true, data: generatedRoom });
});

router.post('/:code/join', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { inviteCode } = req.body ?? {};
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');
    if (room.status !== 'waiting') throw new AppError(400, 'Battle is not in waiting state');
    if (room.players.length >= room.maxPlayers) throw new AppError(400, 'Battle is full');
    if (!room.isPublic && room.inviteCode !== inviteCode) {
      throw new AppError(403, 'Invalid invite code');
    }

    const userId = req.user!._id;
    const alreadyJoined = room.players.some((p) => p.user.equals(userId));
    if (alreadyJoined) {
      return res.json({ success: true, message: 'Already in this battle' });
    }

    if (room.joinApproval && !room.host.equals(userId)) {
      if (!room.pendingPlayers.some((id) => id.equals(userId))) {
        room.pendingPlayers.push(userId);
        await room.save();

        const io = req.app.get('io');
        io?.to(`room:${room.code}`).emit('room:join_request', {
          userId: userId.toString(),
          username: req.user!.username || (req.user!.username || (req.user as any)!.handle),
        });
        io?.to(`user:${room.host.toString()}`).emit('room:join_request', {
          userId: userId.toString(),
          username: req.user!.username || (req.user!.username || (req.user as any)!.handle),
          roomCode: room.code,
        });

        return res.json({ success: true, message: 'Join request sent. Waiting for host approval.' });
      }
      return res.json({ success: true, message: 'Join request already pending' });
    }

    room.players.push({
      user: userId,
      status: 'waiting',
      joinedAt: new Date(),
      score: 0,
      rank: 0,
      problemsSolved: 0,
      submissionsCount: 0,
      solveTime: 0,
      penalty: 0,
    });
    await room.save();

    const usersMap = await populateUsersMap(room);
    const payload = serializeRoom(room, usersMap);

    const io = req.app.get('io');
    io?.to(`room:${room.code}`).emit('battle:player_joined', {
      userId: userId.toString(),
      username: req.user!.username || (req.user!.username || (req.user as any)!.handle),
      room: payload,
    });

    res.json({ success: true, message: 'Joined battle successfully', data: payload });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/approve', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');
    if (!room.host.equals(req.user!._id)) throw new AppError(403, 'Only host can approve');

    const pendingId = new Types.ObjectId(userId);
    room.pendingPlayers = room.pendingPlayers.filter((id) => !id.equals(pendingId));

    if (room.players.length < room.maxPlayers) {
      room.players.push({
        user: pendingId,
        status: 'waiting',
        joinedAt: new Date(),
        score: 0,
        rank: 0,
        problemsSolved: 0,
        submissionsCount: 0,
        solveTime: 0,
        penalty: 0,
      });
    }
    await room.save();

    const usersMap = await populateUsersMap(room);
    const io = req.app.get('io');
    io?.to(`user:${userId}`).emit('room:approved', { roomCode: room.code });
    io?.to(`room:${room.code}`).emit('battle:player_joined', { userId, room: serializeRoom(room, usersMap) });

    res.json({ success: true, data: serializeRoom(room, usersMap) });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/reject', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');
    if (!room.host.equals(req.user!._id)) throw new AppError(403, 'Only host can reject');

    const rejectId = new Types.ObjectId(userId);
    room.pendingPlayers = room.pendingPlayers.filter((id) => !id.equals(rejectId));
    await room.save();

    req.app.get('io')?.to(`user:${userId}`).emit('room:rejected', { roomCode: room.code });
    res.json({ success: true, message: 'Join request rejected' });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/ready', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');

    const player = room.players.find((p) => p.user.equals(req.user!._id));
    if (!player) throw new AppError(403, 'Not a participant');

    player.status = 'ready';
    await room.save();

    const usersMap = await populateUsersMap(room);
    const payload = serializeRoom(room, usersMap);
    req.app.get('io')?.to(`room:${room.code}`).emit('room:ready_update', payload);

    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/unready', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');

    const player = room.players.find((p) => p.user.equals(req.user!._id));
    if (!player) throw new AppError(403, 'Not a participant');

    player.status = 'waiting';
    await room.save();

    const usersMap = await populateUsersMap(room);
    const payload = serializeRoom(room, usersMap);
    req.app.get('io')?.to(`room:${room.code}`).emit('room:ready_update', payload);

    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/start', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');
    if (!room.host.equals(req.user!._id)) throw new AppError(403, 'Only the host can start');

    const check = await canStartBattle(room);
    if (!check.ok) throw new AppError(400, check.reason!);

    room.status = 'starting';
    await room.save();

    const io = req.app.get('io');
    io?.to(`room:${room.code}`).emit('battle:countdown', { seconds: 5 });

    await new Promise((r) => setTimeout(r, 5000));

    await assignFairProblem(room);
    room.status = 'active';
    room.startedAt = new Date();
    room.currentRound = 0;
    room.players.forEach((p) => {
      if (p.status === 'ready') p.status = 'playing';
    });
    await room.save();

    const usersMap = await populateUsersMap(room);
    const serialized = serializeRoom(room, usersMap);
    const problem = await toProblemPayload(serialized.contestId, serialized.problemIndex);

    startSubmissionTracker(io, room._id.toString());

    io?.to(`room:${room.code}`).emit('battle:started', { ...serialized, problem });
    io?.to(`room:${room.code}`).emit('feed:event', {
      type: 'start',
      message: 'Battle has begun! Same problem for all players.',
      problem: problem?.name,
    });

    res.json({ success: true, data: { ...serialized, problem } });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/leave', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');
    if (room.status === 'active') throw new AppError(400, 'Cannot leave an active battle');

    const userId = req.user!._id;
    room.players = room.players.filter((p) => !p.user.equals(userId));
    room.pendingPlayers = room.pendingPlayers.filter((id) => !id.equals(userId));

    if (room.host.equals(userId) && room.players.length > 0) {
      room.host = room.players[0].user;
    } else if (room.players.length === 0) {
      room.status = 'cancelled';
    }

    await room.save();

    req.app.get('io')?.to(`room:${room.code}`).emit('battle:player_left', {
      userId: userId.toString(),
      username: req.user!.username || (req.user!.username || (req.user as any)!.handle),
    });

    res.json({ success: true, message: 'Left battle successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/submit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');
    if (room.status !== 'active') throw new AppError(400, 'Battle is not active');

    const currentProblem = room.problems[room.currentRound] || room.problems[0];
    if (!currentProblem) throw new AppError(400, 'No problem assigned');

    const isPlayer = room.players.some((p) => p.user.equals(req.user!._id));
    if (!isPlayer) throw new AppError(403, 'Spectators cannot submit');

    await Submission.create({
      room: room._id,
      user: req.user!._id,
      problemContestId: currentProblem.contestId,
      problemIndex: currentProblem.index,
      language: req.body.language || 'cpp',
      verdict: 'pending',
    });

    res.json({
      success: true,
      data: {
        status: 'pending',
        message: 'Solution submitted. Evaluating test cases...',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:code/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = await checkPlayerStatus(req.params.code, req.user!._id.toString());
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/:code/spectate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) throw new AppError(404, 'Battle not found');

    const userId = req.user!._id;
    const isPlayer = room.players.some((p) => p.user.equals(userId));
    if (isPlayer) throw new AppError(400, 'Players cannot spectate their own battle');

    if (!room.spectators.some((id) => id.equals(userId))) {
      room.spectators.push(userId);
      await room.save();
    }

    const usersMap = await populateUsersMap(room);
    res.json({ success: true, data: serializeRoom(room, usersMap) });
  } catch (error) {
    next(error);
  }
});

export const battlesRouter = router;
