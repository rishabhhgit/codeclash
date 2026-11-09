import { fetchRandomProblems, CfProblem } from './competitive';
import { IRoom } from '../models/Room';
import { pickQuestionForBattle } from '../../../web/lib/questions/data';

interface ProblemFilters {
  tags?: string[];
  rating?: number;
  count?: number;
}

export interface FairProblem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  type: string;
  points?: number;
}

function toFairProblem(cf: CfProblem): FairProblem {
  return {
    contestId: cf.contestId,
    index: cf.index,
    name: cf.name,
    rating: cf.rating,
    tags: cf.tags,
    type: cf.type,
    points: cf.points,
  };
}

export async function getProblems(filters: ProblemFilters): Promise<FairProblem[]> {
  const { tags, rating, count = 50 } = filters;
  const cfProblems = await fetchRandomProblems(
    count,
    tags,
    rating ? rating - 100 : undefined,
    rating ? rating + 100 : undefined
  );
  return cfProblems.map(toFairProblem);
}

export async function getRandomProblem(filters?: ProblemFilters): Promise<FairProblem | null> {
  const cfProblems = await fetchRandomProblems(
    1,
    filters?.tags,
    filters?.rating ? filters.rating - 100 : undefined,
    filters?.rating ? filters.rating + 100 : undefined
  );
  if (cfProblems.length === 0) return null;
  return toFairProblem(cfProblems[0]);
}

export async function getTopicProblems(topic: string, rating?: number): Promise<FairProblem[]> {
  const cfProblems = await fetchRandomProblems(
    10,
    [topic],
    rating ? rating - 100 : undefined,
    rating ? rating + 100 : undefined
  );
  return cfProblems.map(toFairProblem);
}

export async function getFairProblemForRoom(room: IRoom): Promise<FairProblem | null> {
  if (room.topics && room.topics.length > 0) {
    const q = pickQuestionForBattle({
      topics: room.topics,
      difficulty: room.difficulty,
    });
    if (q) {
      return {
        contestId: q.number || 1900,
        index: 'A',
        name: q.title,
        tags: q.topics || room.topics,
        type: 'PROGRAMMING',
        rating: room.difficulty === 'easy' ? 1000 : room.difficulty === 'hard' ? 2000 : 1500,
      };
    }
  }

  let minRating: number | undefined;
  let maxRating: number | undefined;

  if (room.difficulty === 'easy') {
    minRating = 800;
    maxRating = 1399;
  } else if (room.difficulty === 'medium') {
    minRating = 1400;
    maxRating = 1899;
  } else if (room.difficulty === 'hard') {
    minRating = 1900;
    maxRating = 2400;
  }

  try {
    const cfProblems = await fetchRandomProblems(
      1,
      room.topics.length > 0 ? room.topics : undefined,
      minRating,
      maxRating
    );

    if (cfProblems.length > 0) {
      return toFairProblem(cfProblems[0]);
    }
  } catch {
    // External API failed, fallback to local database
  }

  const localFallback = pickQuestionForBattle({
    topics: room.topics,
    difficulty: room.difficulty,
  });

  if (localFallback) {
    return {
      contestId: localFallback.number || 1900,
      index: 'A',
      name: localFallback.title,
      tags: localFallback.topics || room.topics,
      type: 'PROGRAMMING',
      rating: 1500,
    };
  }

  return null;
}
