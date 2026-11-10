import { Router } from 'express';
import {
  fetchLeetCodeProfile,
  getShowcaseHandles,
  addToShowcase,
  LeetCodeProfileData,
} from '../../services/leetcode.service';

const router = Router();

// Get curated and community LeetCode showcase profiles
router.get('/showcase', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const sortBy = String(req.query.sortBy || 'questions');
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));

    const handles = getShowcaseHandles();

    // Fetch or read from cache for all showcase handles
    const profiles = await Promise.all(
      handles.map(async (h) => {
        try {
          return await fetchLeetCodeProfile(h);
        } catch {
          return null;
        }
      })
    );

    let validProfiles = profiles.filter(
      (p): p is LeetCodeProfileData => !!p && p.exists
    );

    // Filter by search term
    if (search) {
      validProfiles = validProfiles.filter((p) => {
        const u = p.username.toLowerCase();
        const n = (p.realName || '').toLowerCase();
        return u.includes(search) || n.includes(search);
      });
    }

    // Sort profiles
    validProfiles.sort((a, b) => {
      if (sortBy === 'questions' || sortBy === 'question-solved') {
        return (b.totalSolved || 0) - (a.totalSolved || 0);
      }
      if (sortBy === 'rating') {
        return (b.contestRating || 0) - (a.contestRating || 0);
      }
      if (sortBy === 'rank') {
        return (a.ranking || 9999999) - (b.ranking || 9999999);
      }
      if (sortBy === 'name') {
        return a.username.localeCompare(b.username);
      }
      return (b.totalSolved || 0) - (a.totalSolved || 0);
    });

    const total = validProfiles.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = validProfiles.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch showcase profiles',
    });
  }
});

// Add a new profile to the community showcase
router.post('/showcase/add', async (req, res) => {
  try {
    const handle = String(req.body?.handle || req.body?.username || '').trim();
    if (!handle || handle.length < 2) {
      return res.status(400).json({ success: false, error: 'A valid handle is required' });
    }

    const profile = await fetchLeetCodeProfile(handle);
    if (!profile || !profile.exists) {
      return res.status(404).json({
        success: false,
        error: `LeetCode profile "${handle}" was not found or is private`,
      });
    }

    addToShowcase(profile.username);

    return res.json({
      success: true,
      message: 'Profile added to LeetCode Showcase',
      data: profile,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to add profile to showcase',
    });
  }
});

// Get individual live profile
router.get('/profile/:username', async (req, res) => {
  try {
    const username = req.params.username?.trim();
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username required' });
    }

    const profile = await fetchLeetCodeProfile(username);
    if (!profile || !profile.exists) {
      return res.status(404).json({
        success: false,
        error: `LeetCode profile "${username}" not found`,
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch LeetCode profile',
    });
  }
});

export const leetcodeRouter = router;
