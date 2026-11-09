import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { authenticate, generateToken, AuthRequest, DEFAULT_GUEST_USER } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getUserInfo, getUserRating } from '../../services/competitive';
import { serializeUser } from '../../utils/serializers';
import { getRankFromRating } from '@codeclash/shared';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    handle: z.string().optional(),
  }),
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
