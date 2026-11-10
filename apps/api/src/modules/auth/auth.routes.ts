import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { authenticate, generateToken, AuthRequest, DEFAULT_GUEST_USER, inMemoryUsers } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getUserInfo, getUserRating } from '../../services/competitive';
import {
  fetchLeetCodeProfile,
  addToShowcase,
  generateVerificationChallenge,
  getVerificationChallenge,
  removeVerificationChallenge,
  invalidateProfileCache,
} from '../../services/leetcode.service';
import { serializeUser } from '../../utils/serializers';
import { getRankFromRating } from '@codeclash/shared';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    handle: z.string().optional(),
    leetcodeHandle: z.string().optional(),
  }),
});

// Preview LeetCode profile before signup
router.get('/leetcode/preview/:handle', async (req, res) => {
  try {
    const handle = req.params.handle?.trim();
    if (!handle || handle.length < 2) {
      return res.status(400).json({ success: false, error: 'Handle too short' });
    }

    const profile = await fetchLeetCodeProfile(handle);
    if (!profile) {
      return res.json({
        success: true,
        data: {
          exists: false,
          username: handle,
          error: 'Could not reach LeetCode service. You can still register with this handle.',
        },
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to check handle' });
  }
});

// 1. Generate challenge verification code for LeetCode profile ownership
router.post('/leetcode/challenge', async (req, res) => {
  try {
    const rawHandle = req.body?.handle || req.body?.leetcodeHandle;
    const cleanHandle = String(rawHandle || '').trim().replace(/^@/, '');

    if (!cleanHandle || cleanHandle.length < 2) {
      return res.status(400).json({ success: false, error: 'A valid LeetCode handle is required' });
    }

    // Fresh lookup from LeetCode GraphQL
    const lcProfile = await fetchLeetCodeProfile(cleanHandle, { forceFresh: true });
    if (!lcProfile || !lcProfile.exists) {
      return res.status(404).json({
        success: false,
        error: `LeetCode profile "${cleanHandle}" was not found or is private`,
      });
    }

    const challenge = generateVerificationChallenge(lcProfile.username);

    return res.json({
      success: true,
      message: 'Verification challenge generated',
      data: {
        handle: lcProfile.username,
        verificationCode: challenge.token,
        profileSettingsUrl: 'https://leetcode.com/profile/',
        publicProfileUrl: `https://leetcode.com/u/${lcProfile.username}/`,
        currentAboutMe: lcProfile.aboutMe || '',
        expiresAt: challenge.expiresAt,
        instructions: `Add the string "${challenge.token}" to your LeetCode profile 'About Me' at https://leetcode.com/profile/, save changes, and click 'Verify Ownership'.`,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate verification challenge',
    });
  }
});

// 2. Authenticate profile ownership via LeetCode 'About Me' string and log in user
router.post('/leetcode/verify', async (req, res) => {
  try {
    const rawHandle = req.body?.handle || req.body?.leetcodeHandle;
    const cleanHandle = String(rawHandle || '').trim().replace(/^@/, '');

    if (!cleanHandle) {
      return res.status(400).json({ success: false, error: 'A valid LeetCode handle is required' });
    }

    const challenge = getVerificationChallenge(cleanHandle);
    if (!challenge) {
      return res.status(400).json({
        success: false,
        error: 'No active verification challenge found or challenge has expired (15 min limit). Please generate a new challenge code.',
      });
    }

    // Force fresh fetch from LeetCode GraphQL without cache
    invalidateProfileCache(cleanHandle);
    const lcProfile = await fetchLeetCodeProfile(cleanHandle, { forceFresh: true });

    if (!lcProfile || !lcProfile.exists) {
      return res.status(404).json({
        success: false,
        error: `LeetCode profile "${cleanHandle}" was not found or is private`,
      });
    }

    const currentAboutMe = lcProfile.aboutMe || '';
    const hasToken = currentAboutMe.toLowerCase().includes(challenge.token.toLowerCase());

    if (!hasToken) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: `Verification string "${challenge.token}" was not found in your LeetCode About Me.`,
        expectedCode: challenge.token,
        currentAboutMe: currentAboutMe || '(empty bio)',
        profileSettingsUrl: 'https://leetcode.com/profile/',
      });
    }

    // Challenge verified! Remove it
    removeVerificationChallenge(cleanHandle);

    const officialUsername = lcProfile.username;
    const normalizedHandle = officialUsername.toLowerCase();

    // Determine initial Elo rating from LeetCode contest rating or solve counts
    let initialRating = 1000;
    if (lcProfile?.contestRating && lcProfile.contestRating > 0) {
      initialRating = lcProfile.contestRating;
    } else if (lcProfile?.totalSolved && lcProfile.totalSolved > 0) {
      initialRating = Math.min(2400, 1300 + Math.floor(lcProfile.totalSolved * 1.5));
    }

    const rank = getRankFromRating(initialRating);
    const avatar =
      lcProfile?.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${officialUsername}`;

    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({
          $or: [
            { handle: normalizedHandle },
            { leetcodeUsername: officialUsername },
          ],
        });

        if (user) {
          user.leetcodeUsername = officialUsername;
          user.leetcodeVerified = true;
          if (lcProfile.avatar) user.avatar = lcProfile.avatar;
          user.leetcodeAvatar = lcProfile.avatar;
          user.leetcodeTotalSolved = lcProfile.totalSolved;
          user.leetcodeEasySolved = lcProfile.easySolved;
          user.leetcodeMediumSolved = lcProfile.mediumSolved;
          user.leetcodeHardSolved = lcProfile.hardSolved;
          user.leetcodeContestRating = lcProfile.contestRating || 0;
          user.leetcodeGlobalRanking = lcProfile.globalRanking || 0;
          user.leetcodeSyncedAt = new Date();
          if (lcProfile.contestRating && lcProfile.contestRating > user.maxRating) {
            user.maxRating = lcProfile.contestRating;
          }
          await user.save();
        } else {
          user = await User.create({
            handle: normalizedHandle,
            username: officialUsername,
            avatar,
            rating: initialRating,
            maxRating: initialRating,
            rank,
            bio: lcProfile?.aboutMe || `LeetCode Verified Challenger [${officialUsername}]`,
            leetcodeUsername: officialUsername,
            leetcodeAvatar: lcProfile?.avatar || avatar,
            leetcodeTotalSolved: lcProfile?.totalSolved || 0,
            leetcodeEasySolved: lcProfile?.easySolved || 0,
            leetcodeMediumSolved: lcProfile?.mediumSolved || 0,
            leetcodeHardSolved: lcProfile?.hardSolved || 0,
            leetcodeContestRating: lcProfile?.contestRating || 0,
            leetcodeGlobalRanking: lcProfile?.globalRanking || 0,
            leetcodeSyncedAt: new Date(),
            leetcodeVerified: true,
          });
        }
      } catch (dbErr) {
        // Fallback to memory user
      }
    }

    if (!user) {
      user = {
        ...DEFAULT_GUEST_USER,
        handle: normalizedHandle,
        username: officialUsername,
        avatar,
        rating: initialRating,
        maxRating: initialRating,
        rank,
        leetcodeUsername: officialUsername,
        leetcodeAvatar: lcProfile?.avatar || avatar,
        leetcodeTotalSolved: lcProfile?.totalSolved || 0,
        leetcodeEasySolved: lcProfile?.easySolved || 0,
        leetcodeMediumSolved: lcProfile?.mediumSolved || 0,
        leetcodeHardSolved: lcProfile?.hardSolved || 0,
        leetcodeContestRating: lcProfile?.contestRating || 0,
        leetcodeGlobalRanking: lcProfile?.globalRanking || 0,
        leetcodeSyncedAt: new Date(),
        leetcodeVerified: true,
      };
    }

    if (user) {
      if (user._id) inMemoryUsers.set(user._id.toString(), user);
      if (user.handle) inMemoryUsers.set(user.handle.toLowerCase(), user);
      if (user.leetcodeUsername) {
        inMemoryUsers.set(user.leetcodeUsername.toLowerCase(), user);
        addToShowcase(user.leetcodeUsername);
      }
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: `Ownership of @${officialUsername} successfully verified! You are now authenticated.`,
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to authenticate LeetCode ownership',
    });
  }
});

// 3. Refresh solve stats for an already authenticated user
router.post('/leetcode/sync', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user || !user.leetcodeUsername) {
      return res.status(400).json({ success: false, error: 'No LeetCode profile linked to this account' });
    }

    invalidateProfileCache(user.leetcodeUsername);
    const lcProfile = await fetchLeetCodeProfile(user.leetcodeUsername, { forceFresh: true });

    if (lcProfile?.exists) {
      user.leetcodeTotalSolved = lcProfile.totalSolved;
      user.leetcodeEasySolved = lcProfile.easySolved;
      user.leetcodeMediumSolved = lcProfile.mediumSolved;
      user.leetcodeHardSolved = lcProfile.hardSolved;
      user.leetcodeContestRating = lcProfile.contestRating || user.leetcodeContestRating || 0;
      user.leetcodeGlobalRanking = lcProfile.globalRanking || user.leetcodeGlobalRanking || 0;
      user.leetcodeSyncedAt = new Date();
      if (lcProfile.avatar) user.leetcodeAvatar = lcProfile.avatar;

      if (typeof (user as any).save === 'function') {
        try {
          await (user as any).save();
        } catch {}
      }
    }

    return res.json({
      success: true,
      message: 'LeetCode solve metrics refreshed',
      data: {
        user: serializeUser(user),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to sync stats' });
  }
});

// Legacy / Direct Sync fallback for backward compatibility
router.post('/leetcode', async (req, res) => {
  try {
    const rawHandle = req.body?.handle || req.body?.leetcodeHandle;
    const cleanHandle = String(rawHandle || '').trim().replace(/^@/, '');

    if (!cleanHandle || cleanHandle.length < 2) {
      return res.status(400).json({ success: false, error: 'A valid LeetCode handle is required' });
    }

    invalidateProfileCache(cleanHandle);
    const lcProfile = await fetchLeetCodeProfile(cleanHandle, { forceFresh: true });
    const officialUsername = lcProfile?.exists ? lcProfile.username : cleanHandle;
    const normalizedHandle = cleanHandle.toLowerCase();

    let initialRating = 1000;
    if (lcProfile?.contestRating && lcProfile.contestRating > 0) {
      initialRating = lcProfile.contestRating;
    } else if (lcProfile?.totalSolved && lcProfile.totalSolved > 0) {
      initialRating = Math.min(2400, 1300 + Math.floor(lcProfile.totalSolved * 1.5));
    }

    const rank = getRankFromRating(initialRating);
    const avatar = lcProfile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`;

    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({
          $or: [
            { handle: normalizedHandle },
            { leetcodeUsername: cleanHandle },
          ],
        });

        if (user) {
          user.leetcodeUsername = officialUsername;
          if (lcProfile?.avatar) user.avatar = lcProfile.avatar;
          if (lcProfile?.exists) {
            user.leetcodeAvatar = lcProfile.avatar;
            user.leetcodeTotalSolved = lcProfile.totalSolved;
            user.leetcodeEasySolved = lcProfile.easySolved;
            user.leetcodeMediumSolved = lcProfile.mediumSolved;
            user.leetcodeHardSolved = lcProfile.hardSolved;
            user.leetcodeContestRating = lcProfile.contestRating || 0;
            user.leetcodeGlobalRanking = lcProfile.globalRanking || 0;
            user.leetcodeSyncedAt = new Date();
            if (lcProfile.contestRating && lcProfile.contestRating > user.maxRating) {
              user.maxRating = lcProfile.contestRating;
            }
          }
          await user.save();
        } else {
          user = await User.create({
            handle: normalizedHandle,
            username: officialUsername,
            avatar,
            rating: initialRating,
            maxRating: initialRating,
            rank,
            bio: lcProfile?.aboutMe || `LeetCode Challenger [${officialUsername}]`,
            leetcodeUsername: officialUsername,
            leetcodeAvatar: lcProfile?.avatar || avatar,
            leetcodeTotalSolved: lcProfile?.totalSolved || 0,
            leetcodeEasySolved: lcProfile?.easySolved || 0,
            leetcodeMediumSolved: lcProfile?.mediumSolved || 0,
            leetcodeHardSolved: lcProfile?.hardSolved || 0,
            leetcodeContestRating: lcProfile?.contestRating || 0,
            leetcodeGlobalRanking: lcProfile?.globalRanking || 0,
            leetcodeSyncedAt: new Date(),
          });
        }
      } catch (dbErr) {
        // Fallback to memory user
      }
    }

    if (!user) {
      user = {
        ...DEFAULT_GUEST_USER,
        handle: normalizedHandle,
        username: officialUsername,
        avatar,
        rating: initialRating,
        maxRating: initialRating,
        rank,
        leetcodeUsername: officialUsername,
        leetcodeAvatar: lcProfile?.avatar || avatar,
        leetcodeTotalSolved: lcProfile?.totalSolved || 0,
        leetcodeEasySolved: lcProfile?.easySolved || 0,
        leetcodeMediumSolved: lcProfile?.mediumSolved || 0,
        leetcodeHardSolved: lcProfile?.hardSolved || 0,
        leetcodeContestRating: lcProfile?.contestRating || 0,
        leetcodeGlobalRanking: lcProfile?.globalRanking || 0,
        leetcodeSyncedAt: new Date(),
      };
    }

    if (user) {
      if (user._id) inMemoryUsers.set(user._id.toString(), user);
      if (user.handle) inMemoryUsers.set(user.handle.toLowerCase(), user);
      if (user.leetcodeUsername) {
        inMemoryUsers.set(user.leetcodeUsername.toLowerCase(), user);
        addToShowcase(user.leetcodeUsername);
      }
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to authenticate handle' });
  }
});

router.post('/login', validate(loginSchema), async (req, res, _next) => {
  try {
    const handle = (req.body?.handle?.trim() || 'GuestTester');
    let cfUser: any = null;
    try {
      cfUser = await getUserInfo(handle);
    } catch {
      // API offline or test handle
    }

    const normalizedHandle = cfUser?.handle || handle;
    const rating = cfUser?.rating ?? 1600;
    const maxRating = cfUser?.maxRating ?? rating;
    const rank = getRankFromRating(rating);
    const avatar = cfUser?.titlePhoto || cfUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${normalizedHandle}`;

    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ handle: normalizedHandle.toLowerCase() });
        if (!user) {
          user = await User.create({
            handle: normalizedHandle.toLowerCase(),
            username: normalizedHandle,
            avatar,
            rating,
            maxRating,
            rank,
            contribution: cfUser?.contribution ?? 0,
          });
        }
      } catch {
        // Fallback to memory user
      }
    }

    if (!user) {
      user = {
        ...DEFAULT_GUEST_USER,
        handle: normalizedHandle,
        username: normalizedHandle,
        avatar,
        rating,
        maxRating,
        rank,
      };
    }

    if (user) {
      if (user._id) inMemoryUsers.set(user._id.toString(), user);
      if (user.handle) inMemoryUsers.set(user.handle.toLowerCase(), user);
      if (user.leetcodeUsername) {
        inMemoryUsers.set(user.leetcodeUsername.toLowerCase(), user);
        addToShowcase(user.leetcodeUsername);
      }
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user: serializeUser(user), token },
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: { user: serializeUser(DEFAULT_GUEST_USER), token: generateToken(DEFAULT_GUEST_USER) },
    });
  }
});

router.post('/sync', authenticate, async (req: AuthRequest, res, _next) => {
  try {
    const user = req.user!;
    try {
      const userHandle = user.handle || user.username;
      const cfUser = await getUserInfo(userHandle);
      const cfRating = await getUserRating(userHandle);
      const latestRating =
        cfRating.length > 0
          ? cfRating[cfRating.length - 1].newRating
          : cfUser.rating ?? user.rating;

      user.avatar = cfUser.titlePhoto || cfUser.avatar || user.avatar;
      user.rating = latestRating ?? user.rating;
      user.maxRating = Math.max(user.maxRating, cfUser.maxRating ?? user.maxRating);
      user.rank = getRankFromRating(user.rating);
      user.contribution = cfUser.contribution ?? user.contribution;
      await user.save();
    } catch {
      // Ignore if external API or db offline
    }

    res.json({ success: true, data: serializeUser(user) });
  } catch (error) {
    res.json({ success: true, data: serializeUser(req.user || DEFAULT_GUEST_USER) });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json({ success: true, data: serializeUser(req.user || DEFAULT_GUEST_USER) });
});

router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

export const authRouter = router;
