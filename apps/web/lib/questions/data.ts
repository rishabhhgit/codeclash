import { LeetCodeQuestion } from './types';
import { CURATED_ALL_QUESTIONS } from './neetcodeQuestions';

// Re-export under the canonical name "LIST_OF_QUESTIONS"
const LIST_OF_QUESTIONS = CURATED_ALL_QUESTIONS;
import rawProblems from './problemsData.json';
import { enrichQuestion } from './enrichment';

const CSV_QUESTIONS = rawProblems as unknown as LeetCodeQuestion[];

// Map for O(1) lookup by slug, id, or number
const questionMap = new Map<string, LeetCodeQuestion>();
const enrichedCache = new Map<string, LeetCodeQuestion>();

// 1. First index curated questions
for (const q of CURATED_ALL_QUESTIONS) {
  questionMap.set(q.slug.toLowerCase(), q);
  questionMap.set(q.id.toLowerCase(), q);
  questionMap.set(String(q.number), q);
}

// 2. Then index remaining 3,600+ CSV questions without overwriting curated questions
for (const q of CSV_QUESTIONS) {
  const s = q.slug.toLowerCase();
  if (!questionMap.has(s)) {
    questionMap.set(s, q);
    questionMap.set(q.id.toLowerCase(), q);
    questionMap.set(String(q.number), q);
  }
}

export function getAllQuestions(): LeetCodeQuestion[] {
  const seen = new Set<string>();
  const list: LeetCodeQuestion[] = [];
  for (const q of CURATED_ALL_QUESTIONS) {
    if (!seen.has(q.slug)) {
      seen.add(q.slug);
      list.push(getQuestionBySlug(q.slug) || q);
    }
  }
  for (const q of CSV_QUESTIONS) {
    if (!seen.has(q.slug)) {
      seen.add(q.slug);
      list.push(getQuestionBySlug(q.slug) || q);
    }
  }
  return list;
}

export function getQuestionBySlug(slug: string): LeetCodeQuestion | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim().replace(/\/question$/, '');

  if (enrichedCache.has(normalized)) {
    return enrichedCache.get(normalized);
  }

  const raw = questionMap.get(normalized);
  if (!raw) return undefined;

  const enriched = enrichQuestion(raw);
  enrichedCache.set(normalized, enriched);
  return enriched;
}

export const TOPIC_ALIASES: Record<string, string[]> = {
  arrays: ['array', 'arrays'],
  strings: ['string', 'strings'],
  linked_lists: ['linked list', 'linked lists', 'linkedlist'],
  stacks: ['stack', 'stacks'],
  queues: ['queue', 'queues'],
  heaps: ['heap', 'priority queue'],
  binary_search: ['binary search'],
  sliding_window: ['sliding window'],
  greedy: ['greedy'],
  dynamic_programming: [
    'dynamic programming',
    '1-d dynamic programming',
    '2-d dynamic programming',
    'dp',
  ],
  trees: ['tree', 'trees', 'binary tree', 'binary search tree', 'bst'],
  graphs: ['graph', 'graphs', 'advanced graphs'],
  backtracking: ['backtracking'],
  bit_manipulation: ['bit manipulation', 'bits'],
  math: ['math', 'math & geometry', 'geometry'],
  intervals: ['interval', 'intervals'],
  two_pointers: ['two pointers'],
  hash_map: ['hash table', 'hash map', 'hash', 'hash function', 'hashmap', 'hashing'],
  recursion: ['recursion'],
  depth_first_search: ['depth-first search', 'dfs'],
  breadth_first_search: ['breadth-first search', 'bfs'],
  monotonic_stack: ['monotonic stack'],
  prefix_sum: ['prefix sum'],
  topological_sort: ['topological sort'],
  design: ['design'],
  divide_and_conquer: ['divide and conquer'],
  sorting: ['sorting', 'sort'],
};

function matchesTerm(text: string, term: string): boolean {
  if (!text || !term) return false;
  const t = text.toLowerCase();
  const search = term.toLowerCase();
  if (search.length <= 3) {
    const regex = new RegExp('(?:^|[^a-z0-9])' + search + '(?:[^a-z0-9]|$)', 'i');
    return regex.test(t);
  }
  return t.includes(search);
}

export function getQuestionsByTopics(
  topics: string[] = [],
  difficulty?: string
): LeetCodeQuestion[] {
  const all = getAllQuestions();
  if (!topics || topics.length === 0) {
    if (difficulty && difficulty !== 'all') {
      return all.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }
    return all;
  }

  const searchTerms: string[] = [];
  for (const rawTopic of topics) {
    const key = rawTopic.toLowerCase().trim().replace(/[-\s]+/g, '_');
    if (TOPIC_ALIASES[key]) {
      searchTerms.push(...TOPIC_ALIASES[key]);
    } else {
      searchTerms.push(rawTopic, rawTopic.replace(/_/g, ' '));
    }
  }

  const matched = all.filter((q) => {
    const cat = q.category || '';
    const qTopics = q.topics || [];
    return searchTerms.some(
      (term) => matchesTerm(cat, term) || qTopics.some((t) => matchesTerm(t, term))
    );
  });

  if (difficulty && difficulty !== 'all') {
    const diffMatched = matched.filter(
      (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
    if (diffMatched.length > 0) return diffMatched;
  }

  return matched;
}

export function pickQuestionForBattle(opts?: {
  topics?: string[];
  difficulty?: string;
  excludeSlugs?: string[];
}): LeetCodeQuestion {
  const candidates = getQuestionsByTopics(opts?.topics, opts?.difficulty);
  const exclude = new Set((opts?.excludeSlugs || []).map((s) => s.toLowerCase()));
  const filtered = candidates.filter((q) => !exclude.has(q.slug.toLowerCase()));
  const pool = filtered.length > 0 ? filtered : candidates;

  if (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  // Fallback to two-sum or first available question
  return getQuestionBySlug('two-sum') || getAllQuestions()[0];
}

export { LIST_OF_QUESTIONS, LIST_OF_QUESTIONS as CURATED_ALL_QUESTIONS };
export { ROADMAP_CATEGORIES } from './neetcodeQuestions';
