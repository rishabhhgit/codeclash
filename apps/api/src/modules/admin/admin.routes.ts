import { Router } from 'express';
import { User } from '../../models/User';
import { Room } from '../../models/Room';
import { Submission } from '../../models/Submission';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error';

const router = Router();

const requireAdmin = async (req: AuthRequest, _res: unknown, next: () => void) => {
  if (!req.user) throw new AppError(401, 'Authentication required');
  next();
};

router.get('/stats', authenticate, requireAdmin, async (_req: AuthRequest, res, next) => {
  try {
    const [totalUsers, totalBattles, totalSubmissions, recentBattles, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        Room.countDocuments(),
        Submission.countDocuments(),
        Room.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('host', 'handle username'),
        User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('handle username createdAt rating'),
      ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        battles: totalBattles,
        submissions: totalSubmissions,
        recentBattles: recentBattles.map((room) => ({
          id: room._id.toString(),
          code: room.code,
          mode: room.mode,
          status: room.status,
          difficulty: room.difficulty,
          createdAt: room.createdAt,
          creator: {
            handle: (room.host as { handle?: string; username?: string })?.handle || (room.host as { handle?: string; username?: string })?.username,
          },
        })),
        recentUsers: recentUsers.map((user) => ({
          id: user._id.toString(),
          handle: user.handle || user.username,
          username: user.username || user.handle,
          createdAt: user.createdAt,
          rating: user.rating,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export const adminRouter = router;
