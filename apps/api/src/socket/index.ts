import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { Room } from '../models/Room';
import { User } from '../models/User';
import {
  getPersistedBattle,
  persistBattle,
  loadAllBattlesOnStartup,
} from '../services/battle-persistence.service';

export {
  getPersistedBattle,
  persistBattle,
  loadAllBattlesOnStartup,
};
import { onUserDisconnect } from '../services/matchmaking.service';
import { evaluateBattleSubmission } from '../services/battle-judge.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  handle?: string;
}

// In-memory synchronized exam sessions store
interface ExamSessionState {
  sessionId: string;
  title: string;
  durationMinutes: number;
  startTime: number;
  endTime: number;
  status: 'waiting' | 'active' | 'completed';
  questions: any[];
  currentQuestionIndex: number;
  participants: Record<string, { socketId: string; name: string; role: string; lastSeen: number }>;
  codeDrafts: Record<string, { code: string; language: string; updatedAt: number }>;
  violations: any[];
  trustScore: number;
}

// In-memory live battle match state for real-time timed DSA fights & live spectating
export interface BattlePlayerState {
  userId: string;
  username: string;
  isReady: boolean;
  score: number;
  passedCases: number;
  totalCases: number;
  code: string;
  language: string;
  trustScore: number;
  violations: any[];
  isWinner: boolean;
  lastActive: number;
  isDisconnected?: boolean;
  hp?: number;
  shield?: number;
  status?: 'alive' | 'downed' | 'eliminated' | 'champion';
  eliminatedAt?: number;
  eliminatedBy?: string;
  placement?: number;
  kills?: number;
  damageDealt?: number;
}

export interface StormState {
  phase: number;
  totalPhases: number;
  phaseName: string;
  safeZoneRequirement: string;
  phaseEndsAt: number;
  damagePerCycle: number;
  isClosing: boolean;
}

export interface AirdropState {
  id: string;
  active: boolean;
  name: string;
  description: string;
  perk: string;
  claimedBy?: string;
}

export interface LiveBattleState {
  code: string;
  title: string;
  questionSlug: string;
  mode: string;
  difficulty: string;
  durationMinutes: number;
  startTime: number;
  endTime: number;
  status: 'waiting' | 'ready_check' | 'countdown' | 'active' | 'completed' | 'cancelled' | 'aborted';
  hostId?: string;
  creatorUsername?: string;
  winner?: string;
  countdownSeconds?: number;
  maxPlayers?: number;
  aliveCount?: number;
  totalParticipants?: number;
  storm?: StormState;
  airdrop?: AirdropState;
  players: Record<string, BattlePlayerState>;
  spectators: Record<string, { socketId: string; username: string }>;
  feed: { id: string; time: string; text: string; type: 'info' | 'code' | 'violation' | 'win' }[];
  chat: { id: string; sender: string; message: string; time: string; isCheer?: boolean }[];
}

const examSessions = new Map<string, ExamSessionState>();
const stormIntervals = new Map<string, NodeJS.Timeout>();

// Load all durable battles on server startup to survive restarts
const liveBattles = loadAllBattlesOnStartup();

/**
 * Access or initialize authoritative live battle state with persistent storage
 */
export function createOrGetLiveBattle(code: string, opts?: Partial<LiveBattleState>): LiveBattleState {
  const codeUpper = code.toUpperCase();
  let battle = getPersistedBattle(codeUpper);

  if (!battle) {
    const now = Date.now();
    const rawMode = opts?.mode || (codeUpper.startsWith('ROYAL') || codeUpper.startsWith('BR-') ? 'battle_royale' : '1v1_duel');
    const isBR = rawMode === 'battle_royale' || rawMode === 'royal';
    const durationMinutes = opts?.durationMinutes || (isBR ? 15 : 20);
    const maxPlayers = opts?.maxPlayers || (isBR ? 10 : 2);

    battle = {
      code: codeUpper,
      title: opts?.title || (isBR ? `Knockout Arena: ${codeUpper}` : `1v1 Duel: ${codeUpper}`),
      questionSlug: opts?.questionSlug || 'two-sum',
      mode: isBR ? 'battle_royale' : rawMode,
      difficulty: opts?.difficulty || 'Medium',
      durationMinutes,
      startTime: now,
      endTime: now + durationMinutes * 60 * 1000,
      status: (opts?.status as any) || 'waiting',
      hostId: opts?.hostId,
      creatorUsername: opts?.creatorUsername,
      countdownSeconds: 0,
      maxPlayers,
      aliveCount: 0,
      totalParticipants: 0,
      storm: isBR
        ? {
            phase: 1,
            totalPhases: 4,
            phaseName: 'Phase 1: Initial Benchmark Sprint',
            safeZoneRequirement: 'Pass >= 1 testcase before cutoff',
            phaseEndsAt: now + 3 * 60 * 1000,
            damagePerCycle: 10,
            isClosing: false,
          }
        : undefined,
      airdrop: isBR
        ? {
            id: `drop-${Date.now()}`,
            active: true,
            name: 'Algorithmic Complexity Blueprint',
            description: 'Contains O(N) Hash Table pattern analysis and +50 Buffer Stamina!',
            perk: '+50 Buffer & Time Complexity Blueprint',
          }
        : undefined,
      players: opts?.players || {},
      spectators: {},
      feed: [
        {
          id: 'f-' + now,
          time: '00:00',
          text: isBR
            ? `⚔️ Knockout arena ${codeUpper} online. Ready for battle!`
            : `Duel arena ${codeUpper} online. Preparing battle...`,
          type: 'info',
        },
      ],
      chat: [],
    };
    persistBattle(battle);
  } else if (opts?.questionSlug && (battle.status === 'waiting' || !battle.questionSlug || battle.questionSlug === 'concatenation-of-array' || battle.questionSlug === 'two-sum')) {
    battle.questionSlug = opts.questionSlug;
    if (opts?.difficulty) battle.difficulty = opts.difficulty;
    persistBattle(battle);
  }

  return battle;
}

export function startBattleRoyaleStormLoop(io: SocketIOServer, codeUpper: string) {
  if (stormIntervals.has(codeUpper)) {
    clearInterval(stormIntervals.get(codeUpper));
  }

  const interval = setInterval(() => {
    const battle = createOrGetLiveBattle(codeUpper);
    if (!battle || battle.status !== 'active' || battle.mode !== 'battle_royale' || !battle.storm) {
      clearInterval(interval);
      stormIntervals.delete(codeUpper);
      return;
    }

    const now = Date.now();
    if (now >= battle.storm.phaseEndsAt) {
      if (battle.storm.phase < battle.storm.totalPhases) {
        battle.storm.phase += 1;
        const p = battle.storm.phase;
        if (p === 2) {
          battle.storm.phaseName = 'Phase 2: Stress Test Checkpoint';
          battle.storm.safeZoneRequirement = 'Pass >= 2 testcases to clear cutoff';
          battle.storm.phaseEndsAt = now + 3 * 60 * 1000;
          battle.storm.damagePerCycle = 20;
        } else if (p === 3) {
          battle.storm.phaseName = 'Phase 3: Corner-Case Filter';
          battle.storm.safeZoneRequirement = 'Pass >= 3 testcases to stay in contention';
          battle.storm.phaseEndsAt = now + 2 * 60 * 1000;
          battle.storm.damagePerCycle = 35;
        } else {
          battle.storm.phaseName = 'Phase 4: Championship Stage';
          battle.storm.safeZoneRequirement = 'Accepted code required to win match';
          battle.storm.phaseEndsAt = now + 2 * 60 * 1000;
          battle.storm.damagePerCycle = 50;
        }

        const reqCases = battle.storm.phase;
        for (const [pId, player] of Object.entries(battle.players)) {
          if (player.status === 'alive') {
            if (player.passedCases < reqCases) {
              const dmg = battle.storm.damagePerCycle;
              if ((player.shield || 0) > 0) {
                const shieldDmg = Math.min(player.shield || 0, dmg);
                player.shield = (player.shield || 0) - shieldDmg;
                const rem = dmg - shieldDmg;
                player.hp = Math.max(0, (player.hp || 100) - rem);
              } else {
                player.hp = Math.max(0, (player.hp || 100) - dmg);
              }

              if (player.hp === 0) {
                player.status = 'eliminated';
                player.eliminatedAt = now;
                player.eliminatedBy = 'Phase Cutoff Time Limit';
                const currentAlive = Object.values(battle.players).filter((pl) => pl.status === 'alive').length;
                player.placement = currentAlive + 1;
                battle.feed.unshift({
                  id: 'elim-' + Date.now(),
                  time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                  text: `⚠️ @${player.username} fell behind Phase ${battle.storm.phase} cutoff! [Placement: #${player.placement}]`,
                  type: 'win',
                });
              } else {
                battle.feed.unshift({
                  id: 'dmg-' + Date.now(),
                  time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                  text: `⚠️ @${player.username} behind benchmark pace! Incurred ${dmg} cutoff penalty [Stamina: ${player.hp}/100]`,
                  type: 'info',
                });
              }
            }
          }
        }

        const survivors = Object.values(battle.players).filter((pl) => pl.status === 'alive');
        battle.aliveCount = survivors.length;

        if (survivors.length === 1) {
          const champ = survivors[0];
          champ.status = 'champion';
          champ.placement = 1;
          champ.isWinner = true;
          battle.winner = champ.username;
          battle.status = 'completed';
          battle.feed.unshift({
            id: 'vr-' + Date.now(),
            time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            text: `🏆 1ST PLACE CHAMPION! @${champ.username} won the Tournament!`,
            type: 'win',
          });
          persistBattle(battle);
          io.to(`battle:${codeUpper}`).emit('battle:match_won', {
            winner: champ.username,
            isVictoryRoyale: true,
            battle,
          });
          clearInterval(interval);
          stormIntervals.delete(codeUpper);
          return;
        }

        battle.airdrop = {
          id: `drop-${battle.storm.phase}-${now}`,
          active: true,
          name: `Algorithmic Blueprint (Phase ${battle.storm.phase})`,
          description: 'Grants +50 stamina buffer and reveals edge-case optimization hints!',
          perk: '+50 Buffer & Complexity Blueprint',
        };
        battle.feed.unshift({
          id: 'drop-' + Date.now(),
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          text: `💡 Algorithmic Blueprint unlocked! Claim to reinforce stamina buffer!`,
          type: 'info',
        });

        persistBattle(battle);
        io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);
      }
    }
  }, 5000);

  stormIntervals.set(codeUpper, interval);
}

export function setupSocketHandlers(io: SocketIOServer) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token && typeof token === 'string') {
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as {
            userId: string;
            handle?: string;
            username?: string;
          };
          socket.userId = decoded.userId;
          socket.handle = decoded.handle || decoded.username;
        } catch {
          // Deterministic mapping for guest tokens with unique identifiers
          const candidateId = socket.handshake.auth?.candidateId as string;
          if (token && token.startsWith('guest-') && token !== 'guest-token' && token.length > 8) {
            socket.userId = crypto.createHash('md5').update(token).digest('hex').substring(0, 24);
            socket.handle = candidateId || `Guest_${token.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '1200'}`;
          } else if (candidateId && candidateId !== 'Player' && !candidateId.startsWith('Coder_')) {
            socket.userId = crypto.createHash('md5').update(`${candidateId}-${socket.id}`).digest('hex').substring(0, 24);
            socket.handle = candidateId;
          } else {
            socket.userId = 'guest-' + socket.id.substring(0, 8);
            socket.handle = candidateId || 'Guest_' + socket.id.substring(0, 4);
          }
        }
      } else {
        const candidateId = socket.handshake.auth?.candidateId as string;
        if (candidateId) {
          socket.userId = crypto.createHash('md5').update(candidateId).digest('hex').substring(0, 24);
          socket.handle = candidateId;
        } else {
          socket.userId = 'user-' + socket.id.substring(0, 6);
          socket.handle = 'Coder_' + socket.id.substring(0, 4);
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userLabel = socket.handle || socket.userId;
    console.log(`Socket connected: ${userLabel} (${socket.id})`);

    socket.join(`user:${socket.userId}`);

    // ========================================================
    // LIVE BATTLE & PROCTORED ARENA SPECTATOR / COMBAT EVENTS
    // ========================================================

    socket.on('battle:join', (data: { battleCode: string; role?: 'fighter' | 'spectator'; username?: string; questionSlug?: string; mode?: string }) => {
      try {
        const { battleCode, role = 'fighter', username = socket.handle || socket.userId || 'Anonymous', questionSlug } = data;
        const codeUpper = battleCode.toUpperCase();
        const roomKey = `battle:${codeUpper}`;
        socket.join(roomKey);
        socket.data.battleCode = codeUpper;
        socket.data.role = role;
        socket.data.username = username;

        let battle = createOrGetLiveBattle(codeUpper, { questionSlug, mode: data.mode });
        if (questionSlug && (battle.status === 'waiting' || !battle.questionSlug || battle.questionSlug === 'concatenation-of-array' || battle.questionSlug === 'two-sum')) {
          battle.questionSlug = questionSlug;
          persistBattle(battle);
        }

        const playerId = socket.userId || socket.id;

        // Auto-assign host if none exists
        if (!battle.hostId) {
          battle.hostId = playerId;
          battle.creatorUsername = username;
        }

        const isHost = playerId === battle.hostId;

        // Register player or spectator
        if (role === 'fighter') {
          if (!battle.players[playerId]) {
            const currentFighters = Object.keys(battle.players);
            const maxFighters = battle.maxPlayers || (battle.mode === 'battle_royale' ? 10 : 2);
            if (currentFighters.length >= maxFighters) {
              // Room is full for fighters — join as spectator
              socket.data.role = 'spectator';
              battle.spectators[socket.id] = {
                socketId: socket.id,
                username,
              };
              socket.emit('battle:role_reassigned', {
                role: 'spectator',
                reason: `Arena already has maximum combatants (${maxFighters}). You are watching as spectator.`,
              });
            } else {
              battle.players[playerId] = {
                userId: playerId,
                username,
                isReady: isHost,
                score: 0,
                passedCases: 0,
                totalCases: 4,
                code: '',
                language: 'cpp',
                trustScore: 100,
                violations: [],
                isWinner: false,
                lastActive: Date.now(),
                isDisconnected: false,
                hp: 100,
                shield: 50,
                status: 'alive',
                kills: 0,
                damageDealt: 0,
              };

              const fighterCount = Object.keys(battle.players).length;
              battle.aliveCount = Object.values(battle.players).filter((p) => p.status === 'alive').length;
              battle.totalParticipants = fighterCount;

              if (fighterCount >= 2) {
                battle.feed.unshift({
                  id: 'f-' + Date.now(),
                  time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                  text: `👥 @${username} joined the battle! Ready check active.`,
                  type: 'info',
                });
              } else {
                battle.feed.unshift({
                  id: 'f-' + Date.now(),
                  time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                  text: `👑 @${username} entered the lobby. Waiting for friends to join...`,
                  type: 'info',
                });
              }
            }
          } else {
            // Reconnection flow: mark player reconnected
            battle.players[playerId].username = username;
            battle.players[playerId].isDisconnected = false;
            battle.players[playerId].lastActive = Date.now();

            battle.feed.unshift({
              id: 'rc-' + Date.now(),
              time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
              text: `🔄 ${username} reconnected to match. Authoritative state restored.`,
              type: 'info',
            });
          }
        } else {
          // SPECTATOR
          battle.spectators[socket.id] = {
            socketId: socket.id,
            username,
          };
          console.log(`[Spectator] ${username} spectating battle ${codeUpper}`);
        }

        persistBattle(battle);

        // Emit current synchronized state to user and broadcast to room
        socket.emit('battle:state_sync', battle);
        io.to(roomKey).emit('battle:state_update', battle);
        io.to(roomKey).emit('battle:state_sync', battle);
      } catch (err: any) {
        console.error('Error joining battle:', err);
      }
    });

    // Fighter Ready Check & Readiness State
    socket.on('battle:toggle_ready', (data: { battleCode: string; isReady?: boolean }) => {
      const { battleCode, isReady } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (battle && battle.players[playerId]) {
        battle.players[playerId].isReady = isReady !== undefined ? isReady : !battle.players[playerId].isReady;

        battle.feed.unshift({
          id: 'f-' + Date.now(),
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          text: `🟢 ${battle.players[playerId].username} is ${battle.players[playerId].isReady ? 'READY' : 'NOT READY'}!`,
          type: 'info',
        });

        persistBattle(battle);
        io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);
        io.to(`battle:${codeUpper}`).emit('battle:state_update', battle);
      }
    });

    // Battle Owner Starts Match (Only when invited players confirm ready)
    socket.on('battle:start_battle', (data: { battleCode: string }) => {
      const { battleCode } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (!battle) return;

      const isHost = playerId === battle.hostId || Object.keys(battle.players)[0] === playerId;
      if (!isHost) {
        socket.emit('battle:error', { message: 'Only the lobby owner can start the battle.' });
        return;
      }

      const fighters = Object.values(battle.players);
      const guestFighters = fighters.filter((p) => p.userId !== battle.hostId);

      // In duels/arenas, require at least one guest player unless solo practice
      if (guestFighters.length === 0 && battle.maxPlayers !== 1) {
        socket.emit('battle:error', { message: 'Waiting for an invited friend or opponent to join before starting.' });
        return;
      }

      // Check if all guests are ready
      const allGuestsReady = guestFighters.every((p) => p.isReady);
      if (!allGuestsReady) {
        socket.emit('battle:error', { message: 'Cannot start match: all invited players must confirm READY!' });
        return;
      }

      battle.status = 'countdown';
      battle.countdownSeconds = 3;
      persistBattle(battle);
      io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);

      let count = 3;
      const countdownInterval = setInterval(() => {
        count -= 1;
        battle.countdownSeconds = count;

        if (count > 0) {
          io.to(`battle:${codeUpper}`).emit('battle:countdown_tick', { count });
        } else {
          clearInterval(countdownInterval);
          battle.status = 'active';
          battle.startTime = Date.now();
          battle.endTime = Date.now() + battle.durationMinutes * 60 * 1000;
          battle.feed.unshift({
            id: 'f-' + Date.now(),
            time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            text: battle.mode === 'battle_royale'
              ? `⚔️ KNOCKOUT ARENA COMMENCED! Solve benchmarks and advance through phase cutoffs!`
              : `⚔️ BATTLE STARTED! Coding workspace unlocked. Solve and submit first to win!`,
            type: 'info',
          });
          persistBattle(battle);
          io.to(`battle:${codeUpper}`).emit('battle:countdown_complete');
          io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);

          if (battle.mode === 'battle_royale') {
            startBattleRoyaleStormLoop(io, codeUpper);
          }
        }
      }, 1000);
    });

    // Battle Owner Kicks Player from Lobby
    socket.on('battle:kick_player', (data: { battleCode: string; targetUserId: string }) => {
      const { battleCode, targetUserId } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (!battle) return;

      const isHost = playerId === battle.hostId || Object.keys(battle.players)[0] === playerId;
      if (!isHost) {
        socket.emit('battle:error', { message: 'Only the lobby owner can kick players.' });
        return;
      }

      if (targetUserId === battle.hostId) {
        socket.emit('battle:error', { message: 'The host cannot kick themselves.' });
        return;
      }

      if (battle.players[targetUserId]) {
        const kickedUsername = battle.players[targetUserId].username || 'Player';
        delete battle.players[targetUserId];
        battle.totalParticipants = Object.keys(battle.players).length;
        battle.aliveCount = battle.totalParticipants;

        battle.feed.unshift({
          id: 'kick-' + Date.now(),
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          text: `🚫 @${kickedUsername} was kicked from the lobby by the host.`,
          type: 'info',
        });

        persistBattle(battle);

        // Find sockets belonging to targetUserId and notify them
        const socketsInRoom = io.sockets.adapter.rooms.get(`battle:${codeUpper}`);
        if (socketsInRoom) {
          for (const sId of socketsInRoom) {
            const s = io.sockets.sockets.get(sId) as any;
            if (s && ((s.userId && s.userId === targetUserId) || s.id === targetUserId)) {
              s.emit('battle:kicked', {
                battleCode: codeUpper,
                reason: 'You were kicked from this lobby by the host.',
              });
              s.leave(`battle:${codeUpper}`);
            }
          }
        }

        io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);
      }
    });

    // Real-time Keystroke Telemetry & Code Privacy Protection
    socket.on('battle:code_stream', (data: { battleCode: string; code: string; language: string }) => {
      const { battleCode, code, language } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (battle && playerId && battle.players[playerId]) {
        battle.players[playerId].code = code;
        battle.players[playerId].language = language;
        battle.players[playerId].lastActive = Date.now();
        persistBattle(battle);

        // 1. Spectators receive live code streams
        for (const spectatorSocketId of Object.keys(battle.spectators)) {
          io.to(spectatorSocketId).emit('battle:player_code_stream', {
            userId: playerId,
            username: socket.data.username || battle.players[playerId].username,
            code,
            language,
            timestamp: Date.now(),
          });
        }

        // 2. Opponents receive only typing telemetry during combat (to protect code privacy)
        socket.to(`battle:${codeUpper}`).emit('battle:opponent_typing', {
          userId: playerId,
          username: socket.data.username || battle.players[playerId].username,
          lineCount: (code || '').split('\n').length,
          timestamp: Date.now(),
          isTyping: true,
        });
      }
    });

    // Testcase Progress Update (e.g. Fighter passed 2/3 cases)
    socket.on('battle:testcase_progress', (data: { battleCode: string; passed: number; total: number }) => {
      const { battleCode, passed, total } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (battle && playerId && battle.players[playerId]) {
        battle.players[playerId].passedCases = passed;
        battle.players[playerId].totalCases = total;
        battle.players[playerId].score = Math.round((passed / total) * 100);

        if (battle.mode === 'battle_royale') {
          battle.players[playerId].shield = Math.min(100, (battle.players[playerId].shield || 50) + 10);
          battle.players[playerId].damageDealt = (battle.players[playerId].damageDealt || 0) + passed * 25;
        }

        battle.feed.unshift({
          id: 'f-' + Date.now(),
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          text: `${socket.data.username || 'Fighter'} ran tests: ${passed}/${total} passed`,
          type: 'code',
        });
        persistBattle(battle);
      }

      io.to(`battle:${codeUpper}`).emit('battle:progress_sync', {
        userId: playerId,
        passed,
        total,
        feed: battle?.feed,
      });
    });

    // Authoritative Server-Side Submission & Victory Evaluation
    socket.on('battle:submit_solution', async (data: { battleCode: string; code?: string; language?: string; passed?: number; total?: number; verdict?: string }) => {
      const { battleCode, code = '', language = 'cpp' } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;
      const username = socket.data.username || battle.players[playerId]?.username || 'Coder';

      try {
        // Authoritative evaluation through backend judge
        const evalResult = await evaluateBattleSubmission(battle, playerId, username, code, language);
        persistBattle(battle);

        if (evalResult.isWinner) {
          if (battle.mode === 'battle_royale' && battle.players[playerId]) {
            battle.players[playerId].status = 'champion';
            battle.players[playerId].placement = 1;
            battle.players[playerId].isWinner = true;
          }

          // Reveal all solutions for post-match review
          const revealedSolutions: Record<string, { code: string; language: string; username: string }> = {};
          for (const [pId, pState] of Object.entries(battle.players)) {
            revealedSolutions[pId] = {
              code: pState.code,
              language: pState.language,
              username: pState.username,
            };
          }

          battle.feed.unshift({
            id: 'f-' + Date.now(),
            time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            text: battle.mode === 'battle_royale'
              ? `🏆 MATCH WINNER! ${battle.winner} passed all benchmarks in ${evalResult.runtimeMs}ms and won the Knockout Tournament!`
              : `🏆 ${battle.winner} solved all benchmark cases authoritatively in ${evalResult.runtimeMs}ms and WON the duel!`,
            type: 'win',
          });

          io.to(`battle:${codeUpper}`).emit('battle:match_won', {
            winner: battle.winner,
            userId: playerId,
            battle,
            solutions: revealedSolutions,
            evalResult,
            isVictoryRoyale: battle.mode === 'battle_royale',
          });

          io.to(`battle:${codeUpper}`).emit('battle:reveal_codes', revealedSolutions);
          io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);
        } else {
          // Battle Royale Recoil Damage on non-accepted verdicts
          if (battle.mode === 'battle_royale' && battle.players[playerId]) {
            const p = battle.players[playerId];
            const recoil = 25;
            if ((p.shield || 0) > 0) {
              const shieldDmg = Math.min(p.shield || 0, recoil);
              p.shield = (p.shield || 0) - shieldDmg;
              const rem = recoil - shieldDmg;
              p.hp = Math.max(0, (p.hp || 100) - rem);
            } else {
              p.hp = Math.max(0, (p.hp || 100) - recoil);
            }

            if (p.hp === 0) {
              p.status = 'eliminated';
              p.eliminatedAt = Date.now();
              p.eliminatedBy = `${evalResult.verdict} Penalty`;
              const currentAlive = Object.values(battle.players).filter((pl) => pl.status === 'alive').length;
              p.placement = currentAlive + 1;
              battle.aliveCount = currentAlive;
              battle.feed.unshift({
                id: 'elim-' + Date.now(),
                time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                text: `⚠️ @${username} suffered fatal execution failure (${evalResult.verdict}) and was ELIMINATED! [#${p.placement}]`,
                type: 'win',
              });

              // Check if only 1 survivor remains
              const survivors = Object.values(battle.players).filter((pl) => pl.status === 'alive');
              if (survivors.length === 1) {
                const champ = survivors[0];
                champ.status = 'champion';
                champ.placement = 1;
                champ.isWinner = true;
                battle.winner = champ.username;
                battle.status = 'completed';
                battle.feed.unshift({
                  id: 'vr-' + Date.now(),
                  time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                  text: `🏆 1ST PLACE CHAMPION! @${champ.username} is the Arena Winner!`,
                  type: 'win',
                });
                io.to(`battle:${codeUpper}`).emit('battle:match_won', {
                  winner: champ.username,
                  isVictoryRoyale: true,
                  battle,
                });
              }
            }
          }

          battle.feed.unshift({
            id: 'f-' + Date.now(),
            time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            text: `${username} evaluated: ${evalResult.verdict} (${evalResult.passedCases}/${evalResult.totalCases})`,
            type: 'code',
          });

          io.to(`battle:${codeUpper}`).emit('battle:submission_result', {
            userId: playerId,
            verdict: evalResult.verdict,
            passed: evalResult.passedCases,
            total: evalResult.totalCases,
            feed: battle.feed,
            error: evalResult.error,
          });

          persistBattle(battle);
          io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);
        }
      } catch (err: any) {
        console.error('Error evaluating battle submission:', err);
      }
    });

    // Claim Tactical Airdrop Supply Crate
    socket.on('battle:claim_airdrop', (data: { battleCode: string }) => {
      const { battleCode } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (battle && battle.airdrop && battle.airdrop.active && !battle.airdrop.claimedBy) {
        battle.airdrop.claimedBy = socket.data.username || battle.players[playerId]?.username || 'Fighter';
        if (battle.players[playerId]) {
          battle.players[playerId].shield = Math.min(100, (battle.players[playerId].shield || 0) + 50);
          battle.players[playerId].damageDealt = (battle.players[playerId].damageDealt || 0) + 100;
        }

        battle.feed.unshift({
          id: 'ad-' + Date.now(),
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          text: `💡 @${battle.airdrop.claimedBy} claimed the Algorithmic Blueprint! (+50 Buffer & Complexity Intel)`,
          type: 'info',
        });
        persistBattle(battle);
        io.to(`battle:${codeUpper}`).emit('battle:state_sync', battle);
      }
    });

    // Proctoring Integrity Alert
    socket.on('battle:violation', (data: { battleCode: string; violation: any }) => {
      const { battleCode, violation } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);
      const playerId = socket.userId || socket.id;

      if (battle && playerId && battle.players[playerId]) {
        battle.players[playerId].violations.unshift(violation);
        battle.players[playerId].trustScore = Math.max(0, battle.players[playerId].trustScore - (violation.penalty || 10));

        battle.feed.unshift({
          id: 'v-' + Date.now(),
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          text: `⚠️ Integrity Alert: ${socket.data.username || battle.players[playerId].username} flagged for ${violation.type} (${violation.details})`,
          type: 'violation',
        });
        persistBattle(battle);
      }

      io.to(`battle:${codeUpper}`).emit('battle:violation_alert', {
        userId: playerId,
        violation,
        feed: battle?.feed,
      });
    });

    // Spectator & Fighter Live Chat & Reactions
    socket.on('battle:chat_message', (data: { battleCode: string; message: string; isCheer?: boolean }) => {
      const { battleCode, message, isCheer } = data;
      const codeUpper = battleCode.toUpperCase();
      const battle = createOrGetLiveBattle(codeUpper);

      const chatItem = {
        id: 'c-' + Date.now() + Math.random().toString(36).substring(2, 4),
        sender: socket.data.username || 'Spectator',
        message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCheer,
      };

      if (battle) {
        battle.chat.push(chatItem);
        if (battle.chat.length > 50) battle.chat.shift();
        persistBattle(battle);
      }

      io.to(`battle:${codeUpper}`).emit('battle:chat_broadcast', chatItem);
    });

    // ==========================================
    // EXAM & ASSESSMENT SYNCHRONIZATION EVENTS
    // ==========================================

    socket.on('exam:join', (data: { sessionId: string; candidateName?: string; role?: string; sessionState?: any }) => {
      try {
        const { sessionId, candidateName = 'Candidate', role = 'candidate', sessionState } = data;
        const roomKey = `exam:${sessionId}`;
        socket.join(roomKey);
        socket.data.examSessionId = sessionId;

        let session = examSessions.get(sessionId);
        const now = Date.now();

        if (!session) {
          const duration = sessionState?.durationMinutes || 45;
          session = {
            sessionId,
            title: sessionState?.title || 'Practice Assessment - Data Structures & Algorithms',
            durationMinutes: duration,
            startTime: now,
            endTime: now + duration * 60 * 1000,
            status: 'active',
            questions: sessionState?.questions || [],
            currentQuestionIndex: sessionState?.currentQuestionIndex || 0,
            participants: {},
            codeDrafts: {},
            violations: [],
            trustScore: 100,
          };
          examSessions.set(sessionId, session);
        }

        session.participants[socket.id] = {
          socketId: socket.id,
          name: candidateName,
          role,
          lastSeen: now,
        };

        const participantCount = Object.keys(session.participants).length;

        socket.emit('exam:state_sync', {
          ...session,
          serverTimestamp: now,
        });

        io.to(roomKey).emit('exam:participant_joined', {
          name: candidateName,
          role,
          count: participantCount,
        });
      } catch (err: any) {
        console.error('Error handling exam:join:', err.message);
      }
    });

    socket.on('exam:code_update', (data: { sessionId: string; slug: string; code: string; language: string; updatedAt: number }) => {
      const { sessionId, slug, code, language, updatedAt } = data;
      const session = examSessions.get(sessionId);
      if (session) {
        session.codeDrafts[slug] = { code, language, updatedAt };
      }
      socket.to(`exam:${sessionId}`).emit('exam:code_synced', {
        slug,
        code,
        language,
        updatedAt,
        senderId: socket.userId,
      });
    });

    socket.on('exam:violation', (data: { sessionId: string; violation: any }) => {
      const { sessionId, violation } = data;
      const session = examSessions.get(sessionId);
      if (session && violation) {
        session.violations.unshift(violation);
        session.trustScore = Math.max(0, session.trustScore - (violation.penalty || 10));
      }
      socket.to(`exam:${sessionId}`).emit('exam:violation_synced', violation);
    });

    socket.on('exam:nav_change', (data: { sessionId: string; currentQuestionIndex: number }) => {
      const { sessionId, currentQuestionIndex } = data;
      const session = examSessions.get(sessionId);
      if (session) {
        session.currentQuestionIndex = currentQuestionIndex;
      }
      socket.to(`exam:${sessionId}`).emit('exam:nav_synced', { currentQuestionIndex });
    });

    socket.on('exam:status_update', (data: { sessionId: string; slug: string; status: string }) => {
      const { sessionId, slug, status } = data;
      const session = examSessions.get(sessionId);
      if (session) {
        session.questions = session.questions.map((q: any) =>
          q.slug === slug ? { ...q, status } : q
        );
      }
      socket.to(`exam:${sessionId}`).emit('exam:status_synced', { slug, status });
    });

    socket.on('exam:telemetry', (data: { sessionId: string; telemetry: any }) => {
      const { sessionId, telemetry } = data;
      socket.to(`exam:${sessionId}`).emit('exam:telemetry_synced', {
        ...telemetry,
        senderSocketId: socket.id,
        timestamp: Date.now(),
      });
    });

    socket.on('exam:announcement', (data: { sessionId: string; text: string; severity?: string }) => {
      const { sessionId, text, severity = 'info' } = data;
      io.to(`exam:${sessionId}`).emit('exam:announcement_broadcast', {
        text,
        severity,
        timestamp: Date.now(),
      });
    });

    // --- Live Leaderboard Real-Time Stream ---
    socket.on('leaderboard:subscribe', () => {
      socket.join('leaderboard:stream');
      socket.emit('leaderboard:snapshot', {
        timestamp: Date.now(),
        message: 'Connected to live competitive leaderboard stream',
      });
    });

    socket.on('leaderboard:report_action', (data: { player: string; action: string; target: string; delta?: string; type?: string }) => {
      const activity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        player: data.player,
        action: data.action,
        target: data.target,
        time: 'Just now',
        delta: data.delta || '+20 pts',
        type: data.type || 'solve',
      };
      io.to('leaderboard:stream').emit('leaderboard:activity', activity);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userLabel}`);
      if (socket.userId) {
        onUserDisconnect(socket.userId);
      }
      const codeUpper = socket.data.battleCode as string | undefined;
      if (codeUpper) {
        const battle = createOrGetLiveBattle(codeUpper);
        const playerId = socket.userId || socket.id;
        if (battle) {
          if (battle.spectators[socket.id]) {
            delete battle.spectators[socket.id];
            persistBattle(battle);
            io.to(`battle:${codeUpper}`).emit('battle:state_update', battle);
          } else if (battle.players[playerId] && battle.status === 'active') {
            battle.players[playerId].isDisconnected = true;
            battle.feed.unshift({
              id: 'dc-' + Date.now(),
              time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
              text: `⚠️ Fighter ${battle.players[playerId].username} lost connection! Reconnecting...`,
              type: 'info',
            });
            persistBattle(battle);
            io.to(`battle:${codeUpper}`).emit('battle:player_disconnected', {
              userId: playerId,
              username: battle.players[playerId].username,
              feed: battle.feed,
            });
          }
        }
      }

      const examId = socket.data.examSessionId as string | undefined;
      if (examId) {
        const session = examSessions.get(examId);
        if (session && session.participants && session.participants[socket.id]) {
          delete session.participants[socket.id];
          io.to(`exam:${examId}`).emit('exam:participant_joined', {
            count: Object.keys(session.participants).length,
          });
        }
      }
    });
  });
}
