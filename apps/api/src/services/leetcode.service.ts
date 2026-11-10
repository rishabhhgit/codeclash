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
  contestRating?: number;
  globalRanking?: number;
  topPercentage?: number;
  aboutMe?: string;
}

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const LEETCODE_USER_QUERY = `
query getLeetCodeUserData($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
      aboutMe
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

export async function fetchLeetCodeProfile(handle: string): Promise<LeetCodeProfileData | null> {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        query: LEETCODE_USER_QUERY,
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
      return {
        exists: false,
        username: cleanHandle,
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      };
    }

    const contestRanking = payload?.data?.userContestRanking;
    const acSubmissions = matchedUser?.submitStatsGlobal?.acSubmissionNum || [];

    const getCount = (diff: string) => {
      const item = acSubmissions.find((s: any) => s.difficulty?.toLowerCase() === diff.toLowerCase());
      return item?.count || 0;
    };

    const easySolved = getCount('easy');
    const mediumSolved = getCount('medium');
    const hardSolved = getCount('hard');
    const totalSolved = getCount('all') || easySolved + mediumSolved + hardSolved;

    return {
      exists: true,
      username: matchedUser.username || cleanHandle,
      realName: matchedUser.profile?.realName || undefined,
      avatar: matchedUser.profile?.userAvatar || undefined,
      ranking: matchedUser.profile?.ranking || undefined,
      aboutMe: matchedUser.profile?.aboutMe || undefined,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      contestRating: contestRanking?.rating ? Math.round(contestRanking.rating) : undefined,
      globalRanking: contestRanking?.globalRanking || undefined,
      topPercentage: contestRanking?.topPercentage || undefined,
    };
  } catch (err) {
    // Return null on network abort / timeout
    return null;
  }
}
