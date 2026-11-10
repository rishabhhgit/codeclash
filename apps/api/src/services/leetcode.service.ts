export interface LeetCodeProfileData {
  exists: boolean;
  username: string;
  realName?: string;
  avatar?: string;
  ranking?: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalQuestions: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  contestRating?: number;
  globalRanking?: number;
  topPercentage?: number;
  aboutMe?: string;
  githubUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  countryName?: string;
  company?: string;
  school?: string;
}

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const LEETCODE_EXTENDED_USER_QUERY = `
query getExtendedData($username: String!) {
  allQuestionsCount {
    difficulty
    count
  }
  matchedUser(username: $username) {
    username
    githubUrl
    twitterUrl
    linkedinUrl
    profile {
      realName
      userAvatar
      ranking
      aboutMe
      countryName
      company
      school
      websites
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
}
`;

// Initial default question counts if external query fails
const DEFAULT_TOTAL = 4110;
const DEFAULT_EASY = 975;
const DEFAULT_MEDIUM = 2146;
const DEFAULT_HARD = 989;

// In-memory cache for profiles
const profileCache = new Map<string, { data: LeetCodeProfileData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchLeetCodeProfile(
  handle: string,
  options?: { forceFresh?: boolean }
): Promise<LeetCodeProfileData | null> {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return null;

  if (!options?.forceFresh) {
    const cached = profileCache.get(cleanHandle.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': `https://leetcode.com/u/${cleanHandle}/`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        query: LEETCODE_EXTENDED_USER_QUERY,
        variables: { username: cleanHandle },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as any;
    const matchedUser = payload?.data?.matchedUser;

    if (!matchedUser) {
      const fallback: LeetCodeProfileData = {
        exists: false,
        username: cleanHandle,
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalQuestions: DEFAULT_TOTAL,
        easyTotal: DEFAULT_EASY,
        mediumTotal: DEFAULT_MEDIUM,
        hardTotal: DEFAULT_HARD,
      };
      return fallback;
    }

    const contestRanking = payload?.data?.userContestRanking;
    const acSubmissions = matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
    const allQuestions = payload?.data?.allQuestionsCount || [];

    const getCount = (diff: string) => {
      const item = acSubmissions.find((s: any) => s.difficulty?.toLowerCase() === diff.toLowerCase());
      return item?.count || 0;
    };

    const getTotal = (diff: string, defaultVal: number) => {
      const item = allQuestions.find((s: any) => s.difficulty?.toLowerCase() === diff.toLowerCase());
      return item?.count || defaultVal;
    };

    const easySolved = getCount('easy');
    const mediumSolved = getCount('medium');
    const hardSolved = getCount('hard');
    const totalSolved = getCount('all') || easySolved + mediumSolved + hardSolved;

    const easyTotal = getTotal('easy', DEFAULT_EASY);
    const mediumTotal = getTotal('medium', DEFAULT_MEDIUM);
    const hardTotal = getTotal('hard', DEFAULT_HARD);
    const totalQuestions = getTotal('all', DEFAULT_TOTAL);

    const websites = matchedUser.profile?.websites || [];
    const websiteUrl = websites.length > 0 ? websites[0] : undefined;

    const profileData: LeetCodeProfileData = {
      exists: true,
      username: matchedUser.username || cleanHandle,
      realName: matchedUser.profile?.realName || undefined,
      avatar: matchedUser.profile?.userAvatar || undefined,
      ranking: matchedUser.profile?.ranking || undefined,
      aboutMe: matchedUser.profile?.aboutMe || undefined,
      githubUrl: matchedUser.githubUrl || undefined,
      twitterUrl: matchedUser.twitterUrl || undefined,
      linkedinUrl: matchedUser.linkedinUrl || undefined,
      websiteUrl,
      countryName: matchedUser.profile?.countryName || undefined,
      company: matchedUser.profile?.company || undefined,
      school: matchedUser.profile?.school || undefined,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalQuestions,
      easyTotal,
      mediumTotal,
      hardTotal,
      contestRating: contestRanking?.rating ? Math.round(contestRanking.rating) : undefined,
      globalRanking: contestRanking?.globalRanking || undefined,
      topPercentage: contestRanking?.topPercentage || undefined,
    };

    profileCache.set(cleanHandle.toLowerCase(), { data: profileData, timestamp: Date.now() });
    return profileData;
  } catch (err) {
    return null;
  }
}

// Default community showcase profiles (empty by default; populated by registered fighters & pinned handles)
export const SHOWCASE_HANDLES = new Set<string>();

export function addToShowcase(handle: string): boolean {
  const clean = handle.trim().toLowerCase();
  if (clean.length < 2) return false;
  SHOWCASE_HANDLES.add(clean);
  return true;
}

export function removeFromShowcase(handle: string): boolean {
  const clean = handle.trim().toLowerCase();
  return SHOWCASE_HANDLES.delete(clean);
}

export function getShowcaseHandles(): string[] {
  return Array.from(SHOWCASE_HANDLES);
}

export function invalidateProfileCache(handle: string): void {
  profileCache.delete(handle.trim().toLowerCase());
}

export interface VerificationChallenge {
  handle: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

const activeChallenges = new Map<string, VerificationChallenge>();

export function generateVerificationChallenge(handle: string): VerificationChallenge {
  const clean = handle.trim().toLowerCase();
  // Generate distinct readable 8-character verification string, e.g. codeclash-verify-7k9p
  const randomSuffix = Math.random().toString(36).substring(2, 8).toLowerCase();
  const token = `codeclash-verify-${randomSuffix}`;
  const challenge: VerificationChallenge = {
    handle: clean,
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  };
  activeChallenges.set(clean, challenge);
  return challenge;
}

export function getVerificationChallenge(handle: string): VerificationChallenge | null {
  const clean = handle.trim().toLowerCase();
  const challenge = activeChallenges.get(clean);
  if (!challenge) return null;
  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(clean);
    return null;
  }
  return challenge;
}

export function removeVerificationChallenge(handle: string): void {
  activeChallenges.delete(handle.trim().toLowerCase());
}
