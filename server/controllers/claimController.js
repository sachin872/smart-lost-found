import Claim from '../models/Claim.js';
import FoundItem from '../models/FoundItem.js';
import LostItem from '../models/LostItem.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

/**
 * Automated Verification Scoring based on claim answers vs Found Item specs
 */
function computeVerificationScore(foundItem, answers = {}) {
  let score = 20; // Base score for submitting verified answers

  // Brand check
  if (answers.itemBrand && foundItem.brand) {
    if (answers.itemBrand.trim().toLowerCase() === foundItem.brand.trim().toLowerCase()) {
      score += 25;
    } else if (foundItem.brand.toLowerCase().includes(answers.itemBrand.toLowerCase())) {
      score += 15;
    }
  }

  // Location check
  if (answers.exactLostLocation && foundItem.foundLocation) {
    const ansLoc = answers.exactLostLocation.toLowerCase();
    const fLoc = foundItem.foundLocation.toLowerCase();
    if (ansLoc === fLoc || fLoc.includes(ansLoc) || ansLoc.includes(fLoc)) {
      score += 25;
    } else {
      score += 10;
    }
  }

  // Unique marks / features check
  if (answers.uniqueMarks && answers.uniqueMarks.length > 5) {
    if (foundItem.uniqueFeatures && foundItem.uniqueFeatures.toLowerCase().includes(answers.uniqueMarks.toLowerCase())) {
      score += 25;
    } else {
      score += 15;
    }
  }

  // Contents inside / hidden features detailed explanation
  if (answers.contentsInside && answers.contentsInside.length > 10) {
    score += 10;
  }
  if (answers.hiddenFeatures && answers.hiddenFeatures.length > 10) {
    score += 10;
  }

  return Math.min(100, Math.max(30, score));
}

// @desc    Submit an ownership claim
// @route   POST /api/claims
// @access  Private
export const createClaim = async (req, res, next) => {
  try {
    const { matchId, lostItemId, foundItemId, verificationAnswers } = req.body;

    if (!foundItemId) {
      return res.status(400).json({
        success: false,
        message: 'foundItemId is required to submit a claim.',
        error: 'MISSING_FOUND_ITEM_ID',
      });
    }

    const foundItem = await FoundItem.findById(foundItemId);
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found.',
        error: 'NOT_FOUND',
      });
    }

    // Check if claimant already has a pending claim for this found item
    const existingClaim = await Claim.findOne({
      foundItemId,
      claimantId: req.user._id,
      verificationStatus: { $in: ['pending', 'approved'] },
    });

    if (existingClaim) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an active claim for this item.',
        error: 'CLAIM_EXISTS',
      });
    }

    // Calculate verification score
    const verificationScore = computeVerificationScore(foundItem, verificationAnswers);

    const claim = await Claim.create({
      matchId: matchId || null,
      lostItemId: lostItemId || null,
      foundItemId,
      claimantId: req.user._id,
      verificationAnswers: verificationAnswers || {},
      verificationScore,
      verificationStatus: 'pending',
    });

    // Update match status to claimed if matchId provided
    if (matchId) {
      await Match.findByIdAndUpdate(matchId, { status: 'claimed' });
    }

    await logAudit({
      user: req.user._id,
      action: 'CLAIM_SUBMITTED',
      target: claim._id.toString(),
      metadata: { foundItemId, verificationScore },
    });

    // Notify claimant
    await createNotification({
      userId: req.user._id,
      type: 'claim_status',
      title: 'Claim Submitted Successfully',
      message: `Your ownership claim for "${foundItem.title}" has been registered (Verification Score: ${verificationScore}%). A security admin is reviewing it.`,
      relatedItemId: claim._id,
      relatedItemModel: 'Claim',
    });

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: 'claim_status',
        title: 'New Ownership Claim to Review',
        message: `${req.user.name} submitted a claim for "${foundItem.title}" with a verification score of ${verificationScore}%.`,
        relatedItemId: claim._id,
        relatedItemModel: 'Claim',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully. Under administrative review.',
      data: { claim },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's claims or all claims for admin
// @route   GET /api/claims
// @access  Private
export const getClaims = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.user.role !== 'admin') {
      query.claimantId = req.user._id;
    }

    if (req.query.status && req.query.status !== 'All') {
      query.verificationStatus = req.query.status;
    }

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate('claimantId', 'name email phone profileImage')
        .populate('foundItemId')
        .populate('lostItemId')
        .populate('matchId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        claims,
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

// @desc    Get claim by ID
// @route   GET /api/claims/:id
// @access  Private
export const getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('claimantId', 'name email phone profileImage')
      .populate('foundItemId')
      .populate('lostItemId')
      .populate('matchId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
        error: 'NOT_FOUND',
      });
    }

    // Only claimant or admin can view
    if (claim.claimantId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this claim.',
        error: 'FORBIDDEN',
      });
    }

    res.status(200).json({
      success: true,
      data: { claim },
    });
  } catch (err) {
    next(err);
  }
};
