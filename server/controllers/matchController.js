import Match from '../models/Match.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import { runGlobalMatchingEngine, compareItems } from '../services/matchingService.js';
import { logAudit } from '../services/auditService.js';

// @desc    Get matches (filtered by confidence, item, or current user's items)
// @route   GET /api/matches
// @access  Private
export const getMatches = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.confidence && req.query.confidence !== 'All') {
      query.confidenceLevel = req.query.confidence;
    }

    if (req.query.lostItemId) {
      query.lostItemId = req.query.lostItemId;
    }

    if (req.query.foundItemId) {
      query.foundItemId = req.query.foundItemId;
    }

    // If regular user (non-admin), show matches relating to their lost or found items
    if (req.user.role !== 'admin' && !req.query.all) {
      const [userLostIds, userFoundIds] = await Promise.all([
        LostItem.find({ userId: req.user._id }).distinct('_id'),
        FoundItem.find({ finderId: req.user._id }).distinct('_id'),
      ]);

      query.$or = [
        { lostItemId: { $in: userLostIds } },
        { foundItemId: { $in: userFoundIds } },
      ];
    }

    const [matches, total] = await Promise.all([
      Match.find(query)
        .populate('lostItemId')
        .populate('foundItemId')
        .sort({ finalScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Match.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        matches,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single match comparison details
// @route   GET /api/matches/:id
// @access  Private
export const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'lostItemId',
        populate: { path: 'userId', select: 'name profileImage' },
      })
      .populate({
        path: 'foundItemId',
        populate: { path: 'finderId', select: 'name profileImage' },
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: { match },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger batch AI matching run
// @route   POST /api/matches/run
// @access  Private (Admin or Trigger)
export const triggerBatchMatch = async (req, res, next) => {
  try {
    const results = await runGlobalMatchingEngine();

    await logAudit({
      user: req.user._id,
      action: 'BATCH_MATCH_RUN',
      target: 'global',
      metadata: { count: results.length },
    });

    res.status(200).json({
      success: true,
      message: `Batch matching evaluated. Generated/updated ${results.length} potential matches.`,
      data: { count: results.length },
    });
  } catch (err) {
    next(err);
  }
};
