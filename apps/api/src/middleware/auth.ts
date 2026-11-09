import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { config } from '../config';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface TokenPayload {
  userId: string;
  handle?: string;
  username?: string;
}

export function createDeterministicGuest(seed?: string, fallbackHandle?: string): IUser {
  let idHex = '65f000000000000000000001';
  let suffix = '0001';

  if (seed && seed !== 'guest-token') {
    idHex = crypto.createHash('md5').update(seed).digest('hex').substring(0, 24);
    suffix = seed.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '1200';
  } else {
    const rand = Math.random().toString(36).substring(2, 10);
    idHex = crypto.createHash('md5').update(rand).digest('hex').substring(0, 24);
    suffix = rand.slice(-4);
  }

  const handle = fallbackHandle || `Guest_${suffix}`;

  return {
    _id: new Types.ObjectId(idHex),
    handle,
    username: handle,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`,
    bio: 'Competitive Coder',
    rating: 1200,
    maxRating: 1200,
    rank: 'pupil',
    contribution: 0,
    battleWins: 0,
    battleLosses: 0,
    winStreak: 0,
    maxWinStreak: 0,
    totalBattles: 0,
    favoriteTopics: [],
    friends: [],
    isOnline: true,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async function () {
      return this;
    },
    toObject: function () {
      return { ...this };
    },
    toJSON: function () {
      return { ...this };
    },
  } as unknown as IUser;
}

export const DEFAULT_GUEST_USER: any = createDeterministicGuest('guest-default-seed', 'Guest');

function readToken(req: Request): string | undefined {
  return (
    req.cookies?.token ||
    req.headers.authorization?.replace('Bearer ', '') ||
    (req.headers['x-guest-token'] as string)
  );
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = readToken(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
        if (decoded.userId && mongoose.connection.readyState === 1) {
          const user = await User.findById(decoded.userId);
          if (user) {
            req.user = user;
            return next();
          }
        } else if (decoded.userId) {
          req.user = createDeterministicGuest(decoded.userId, decoded.handle || decoded.username);
          return next();
        }
      } catch {
        // Non-JWT token (e.g. guest-token-xxx or candidateId)
        req.user = createDeterministicGuest(token);
        return next();
      }
    }
  } catch {
    // Continue below
  }

  // Fallback to guest user with deterministic or unique ID
  const candidateSeed = (req.headers['x-candidate-id'] as string) || (req.ip ? `ip-${req.ip}` : undefined);
  req.user = createDeterministicGuest(candidateSeed);
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = readToken(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
        if (decoded.userId && mongoose.connection.readyState === 1) {
          const user = await User.findById(decoded.userId);
          if (user) {
            req.user = user;
            return next();
          }
        } else if (decoded.userId) {
          req.user = createDeterministicGuest(decoded.userId, decoded.handle || decoded.username);
          return next();
        }
      } catch {
        req.user = createDeterministicGuest(token);
        return next();
      }
    }
  } catch {
    // Continue
  }

  req.user = req.user || createDeterministicGuest();
  next();
};

export const generateToken = (user: IUser | string): string => {
  const userId = typeof user === 'string' ? user : (user._id?.toString() || '65f000000000000000000001');
  const userHandle = typeof user === 'string' ? undefined : (user.handle || user.username);

  return jwt.sign({ userId, handle: userHandle || 'GuestTester' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
};
