import { pickQuestionForBattle } from '../../../web/lib/questions/data';

export interface QueueEntry {
  userId: string;
  username?: string;
  rating: number;
  preferredTopics: string[];
  preferredDifficulty: string;
  mode: string;
  joinedAt: Date;
}

const queue: Map<string, QueueEntry> = new Map();

// Curated battle problem slugs with 100% verified benchmark test suites
const BATTLE_PROBLEMS: Record<string, string[]> = {
  easy: [
    'two-sum',
    'best-time-to-buy-and-sell-stock',
  ],
  medium: [
    'maximum-subarray',
    'container-with-most-water',
    'longest-substring-without-repeating-characters',
  ],
  hard: [
    'container-with-most-water',
    'longest-substring-without-repeating-characters',
  ],
};

export function pickBattleProblem(preferredDifficulty?: string, preferredTopics?: string[]): string {
  if (preferredTopics && preferredTopics.length > 0) {
    const topicQuestion = pickQuestionForBattle({
      topics: preferredTopics,
      difficulty: preferredDifficulty,
    });
    if (topicQuestion?.slug) {
      return topicQuestion.slug;
    }
  }

  const diff = (preferredDifficulty || 'all').toLowerCase();
  let pool: string[] = [];

  if (diff === 'easy') {
    pool = BATTLE_PROBLEMS.easy;
  } else if (diff === 'hard') {
    pool = BATTLE_PROBLEMS.hard;
  } else if (diff === 'medium') {
    pool = BATTLE_PROBLEMS.medium;
  } else {
    pool = [...BATTLE_PROBLEMS.easy, ...BATTLE_PROBLEMS.medium];
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] || 'two-sum';
}

export function joinQueue(
  userId: string,
  preferences: {
    username?: string;
    rating: number;
    preferredTopics?: string[];
    preferredDifficulty?: string;
    mode?: string;
  }
): QueueEntry {
  const entry: QueueEntry = {
    userId,
    username: preferences.username,
    rating: preferences.rating || 1200,
    preferredTopics: preferences.preferredTopics || [],
    preferredDifficulty: preferences.preferredDifficulty || 'all',
    mode: preferences.mode || 'quick',
    joinedAt: new Date(),
  };

  queue.set(userId, entry);
  return entry;
}

export function leaveQueue(userId: string): boolean {
  return queue.delete(userId);
}

export function onUserDisconnect(userId: string): boolean {
  return queue.delete(userId);
}

export function purgeExpiredQueueEntries(maxAgeSeconds = 120): number {
  const now = Date.now();
  let purged = 0;
  for (const [userId, entry] of queue.entries()) {
    if ((now - entry.joinedAt.getTime()) / 1000 > maxAgeSeconds) {
      queue.delete(userId);
      purged++;
    }
  }
  return purged;
}

export function findMatch(entry: QueueEntry): QueueEntry | null {
  const now = Date.now();
  const waitSeconds = (now - entry.joinedAt.getTime()) / 1000;
  // Dynamic window: begins at 150, widens by 50 every 5 seconds up to 500
  const dynamicRatingRange = Math.min(500, 150 + Math.floor(waitSeconds / 5) * 50);

  for (const [userId, candidate] of queue) {
    if (userId === entry.userId) continue;

    // Mode compatibility: ranked matches only with ranked, casual with casual, quick matches with anything
    if (
      entry.mode !== 'quick' &&
      candidate.mode !== 'quick' &&
      entry.mode !== candidate.mode
    ) {
      continue;
    }

    const ratingDiff = Math.abs(entry.rating - candidate.rating);
    if (ratingDiff > dynamicRatingRange) continue;

    if (
      entry.preferredTopics.length > 0 &&
      candidate.preferredTopics.length > 0
    ) {
      const hasOverlap = entry.preferredTopics.some((t) =>
        candidate.preferredTopics.includes(t)
      );
      if (!hasOverlap) continue;
    }

    if (
      entry.preferredDifficulty !== 'all' &&
      candidate.preferredDifficulty !== 'all' &&
      entry.preferredDifficulty !== candidate.preferredDifficulty
    ) {
      continue;
    }

    return candidate;
  }

  return null;
}

/**
 * Atomically finds and dequeues a matching candidate to prevent race conditions
 */
export function findAndRemoveMatch(entry: QueueEntry): QueueEntry | null {
  const candidate = findMatch(entry);
  if (candidate) {
    queue.delete(entry.userId);
    queue.delete(candidate.userId);
    return candidate;
  }
  return null;
}

export function getQueueStats(): {
  totalSize: number;
  entries: Array<{ userId: string; waitTime: number }>;
} {
  const now = Date.now();
  const entries = Array.from(queue.values()).map((e) => ({
    userId: e.userId,
    waitTime: Math.floor((now - e.joinedAt.getTime()) / 1000),
  }));

  return { totalSize: queue.size, entries };
}

export function isInQueue(userId: string): boolean {
  return queue.has(userId);
}

export function getEntry(userId: string): QueueEntry | undefined {
  return queue.get(userId);
}
