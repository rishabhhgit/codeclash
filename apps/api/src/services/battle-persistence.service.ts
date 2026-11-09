import * as fs from 'fs';
import * as path from 'path';
import { LiveBattleState } from '../socket';

const rootDir = process.cwd().endsWith('apps/api') ? path.join(process.cwd(), '..', '..') : process.cwd();
const DATA_DIR = path.join(rootDir, '.data', 'battles');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const memoryIndex = new Map<string, LiveBattleState>();

/**
 * Atomic write helper to prevent corrupted state files on power/server interruption
 */
function atomicWriteJson(filePath: string, data: any) {
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {}
    }
    throw err;
  }
}

/**
 * Initialize and recover battles from persistent storage on server boot
 */
export function loadAllBattlesOnStartup(): Map<string, LiveBattleState> {
  try {
    if (!fs.existsSync(DATA_DIR)) return memoryIndex;

    const files = fs.readdirSync(DATA_DIR);
    const now = Date.now();
    let loadedCount = 0;
    let expiredCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const fullPath = path.join(DATA_DIR, file);
      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const battle: LiveBattleState = JSON.parse(raw);

        // Discard battles that completed more than 4 hours ago or are invalid
        if (battle.status === 'completed' && battle.endTime && now - battle.endTime > 4 * 60 * 60 * 1000) {
          fs.unlinkSync(fullPath);
          expiredCount++;
          continue;
        }

        // Recover active match timers
        if (battle.status === 'active' && battle.endTime) {
          if (now >= battle.endTime) {
            // Deadline expired while server was offline
            battle.status = 'completed';
            if (!battle.winner) {
              battle.feed.unshift({
                id: 'exp-' + now,
                time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
                text: 'Battle match deadline expired during maintenance.',
                type: 'info',
              });
            }
          }
        }

        // Recover countdowns that were interrupted
        if (battle.status === 'countdown') {
          // If countdown was in progress, reset to ready_check so fighters can confirm
          battle.status = 'ready_check';
          battle.countdownSeconds = 0;
          for (const player of Object.values(battle.players)) {
            player.isReady = false;
          }
        }

        // Reset transient sockets/spectators
        battle.spectators = {};

        memoryIndex.set(battle.code.toUpperCase(), battle);
        loadedCount++;
      } catch (e) {
        console.warn(`Failed to recover battle from ${file}:`, e);
      }
    }

    console.log(`[BattlePersistence] Recovered ${loadedCount} battle rooms from durable storage (${expiredCount} expired pruned).`);
  } catch (err) {
    console.error('[BattlePersistence] Error during startup recovery:', err);
  }

  return memoryIndex;
}

/**
 * Save battle state to memory and durable storage
 */
export function persistBattle(battle: LiveBattleState): void {
  const codeUpper = battle.code.toUpperCase();
  memoryIndex.set(codeUpper, battle);

  const filePath = path.join(DATA_DIR, `${codeUpper}.json`);
  try {
    atomicWriteJson(filePath, battle);
  } catch (err) {
    console.error(`[BattlePersistence] Failed to persist battle ${codeUpper}:`, err);
  }
}

/**
 * Get battle state
 */
export function getPersistedBattle(code: string): LiveBattleState | null {
  const codeUpper = code.toUpperCase();
  if (memoryIndex.has(codeUpper)) {
    return memoryIndex.get(codeUpper)!;
  }

  const filePath = path.join(DATA_DIR, `${codeUpper}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const battle: LiveBattleState = JSON.parse(raw);
      memoryIndex.set(codeUpper, battle);
      return battle;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Check if a user is currently active in any ongoing battle
 */
export function isUserInActiveBattle(userId: string): { inBattle: boolean; battleCode?: string } {
  const now = Date.now();
  for (const battle of memoryIndex.values()) {
    if (battle.status === 'active' || battle.status === 'countdown' || battle.status === 'ready_check') {
      if (battle.endTime && now > battle.endTime) continue;
      if (battle.players && battle.players[userId]) {
        return { inBattle: true, battleCode: battle.code };
      }
    }
  }
  return { inBattle: false };
}

/**
 * Prune stale / abandoned rooms older than timeout
 */
export function cleanupStaleBattles(): void {
  const now = Date.now();
  for (const [code, battle] of memoryIndex.entries()) {
    // Abandoned waiting room older than 30 minutes
    if (battle.status === 'waiting' && now - battle.startTime > 30 * 60 * 1000) {
      deleteBattle(code);
      continue;
    }
    // Completed battle older than 2 hours
    if (battle.status === 'completed' && battle.endTime && now - battle.endTime > 2 * 60 * 60 * 1000) {
      deleteBattle(code);
      continue;
    }
  }
}

/**
 * Delete a battle record
 */
export function deleteBattle(code: string): void {
  const codeUpper = code.toUpperCase();
  memoryIndex.delete(codeUpper);

  const filePath = path.join(DATA_DIR, `${codeUpper}.json`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }
}
