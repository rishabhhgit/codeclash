import { pickQuestionForBattle } from '../../../web/lib/questions/data';

export interface QueueEntry {
  userId: string;
  tabId?: string;
  username?: string;
  rating: number;
  preferredTopics: string[];
  preferredDifficulty: string;
  mode: string;
  joinedAt: Date;
}

export interface MatchedResult {
  battleCode: string;
  questionSlug: string;
  difficulty: string;
  mode: string;
  matchedAt: number;
  opponent: {
    userId: string;
    username: string;
    rating: number;
  };
}

const queue: Map<string, QueueEntry> = new Map();
const matchedResults: Map<string, MatchedResult> = new Map();

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

export function setMatchedResult(userId: string, result: MatchedResult): void {
  matchedResults.set(userId, result);
  // Auto-expire after 25 seconds
  setTimeout(() => {
    matchedResults.delete(userId);
  }, 25000);
}

export function getMatchedResult(userId: string): MatchedResult | undefined {
  return matchedResults.get(userId);
}

export function clearMatchedResult(userId: string): void {
  matchedResults.delete(userId);
}

export function joinQueue(
  userId: string,
  preferences: {
    username?: string;
    tabId?: string;
    rating: number;
    preferredTopics?: string[];
    preferredDifficulty?: string;
    mode?: string;
  }
): QueueEntry {
  const entry: QueueEntry = {
    userId,
    tabId: preferences.tabId,
    username: preferences.username,
    rating: preferences.rating || 1000,
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
  const entryWaitSeconds = (now - entry.joinedAt.getTime()) / 1000;

  for (const [userId, candidate] of queue) {
    if (userId === entry.userId) continue;

    const candidateWaitSeconds = (now - candidate.joinedAt.getTime()) / 1000;
    // Effective wait time is the maximum wait time of the pair
    const maxWaitSeconds = Math.max(entryWaitSeconds, candidateWaitSeconds);

    // Dynamic rating range expansion:
    // 0-3s: ±200 Elo
    // 3-8s: ±400 Elo
    // 8-15s: ±800 Elo
    // >15s: unlimited (matches any waiting combatant)
    let dynamicRatingRange = 200;
    if (maxWaitSeconds > 15) {
      dynamicRatingRange = 5000;
    } else if (maxWaitSeconds > 8) {
      dynamicRatingRange = 800;
    } else if (maxWaitSeconds > 3) {
      dynamicRatingRange = 400;
    }

    const ratingDiff = Math.abs(entry.rating - candidate.rating);
    if (ratingDiff > dynamicRatingRange) continue;

    // Mode compatibility:
    // Ranked strictly matches ranked, casual strictly matches casual, quick matches anything.
    // If either candidate has been waiting > 10s, relax to cross-match so players aren't stranded.
    if (maxWaitSeconds <= 10) {
      if (
        entry.mode !== 'quick' &&
        candidate.mode !== 'quick' &&
        entry.mode !== candidate.mode
      ) {
        continue;
      }
    }

    // Topic compatibility:
    // If either candidate has been waiting > 8s, relax topic filters.
    if (maxWaitSeconds <= 8) {
      if (
        entry.preferredTopics.length > 0 &&
        candidate.preferredTopics.length > 0
      ) {
        const hasOverlap = entry.preferredTopics.some((t) =>
          candidate.preferredTopics.includes(t)
        );
        if (!hasOverlap) continue;
      }
    }

    // Difficulty compatibility:
    // If either candidate has been waiting > 6s, relax difficulty restrictions.
    if (maxWaitSeconds <= 6) {
      if (
        entry.preferredDifficulty !== 'all' &&
        candidate.preferredDifficulty !== 'all' &&
        entry.preferredDifficulty !== candidate.preferredDifficulty
      ) {
        continue;
      }
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

export function getAllQueueEntries(): QueueEntry[] {
  return Array.from(queue.values());
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
