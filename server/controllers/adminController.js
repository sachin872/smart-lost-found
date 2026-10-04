import User from '../models/User.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import Match from '../models/Match.js';
import Claim from '../models/Claim.js';
import Handover from '../models/Handover.js';
import AuditLog from '../models/AuditLog.js';
import { generateSecureOTP } from '../utils/otpGenerator.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

// @desc    Admin Overview & Dashboard Analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalLost,
      totalFound,
      potentialMatches,
      pendingClaims,
      returnedLost,
      returnedFound,
      blockedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      LostItem.countDocuments(),
      FoundItem.countDocuments(),
      Match.countDocuments(),
      Claim.countDocuments({ verificationStatus: 'pending' }),
      LostItem.countDocuments({ status: 'returned' }),
      FoundItem.countDocuments({ status: 'returned' }),
      User.countDocuments({ isBlocked: true }),
    ]);

    const totalReturned = returnedFound + returnedLost;
    const recoveryRate = totalLost > 0 ? Math.round((returnedLost / totalLost) * 100) : 0;

    // Items by category aggregation
    const lostByCategory = await LostItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const foundByCategory = await FoundItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Items by location aggregation
    const topLocations = await LostItem.aggregate([
      { $group: { _id: '$lostLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyLost = await LostItem.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyFound = await FoundItem.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recent items & pending claims
    const [recentLost, recentFound, recentPendingClaims, highConfidenceMatches] = await Promise.all([
      LostItem.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email'),
      FoundItem.find().sort({ createdAt: -1 }).limit(5).populate('finderId', 'name email'),
      Claim.find({ verificationStatus: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('claimantId', 'name email phone')
        .populate('foundItemId'),
      Match.find({ confidenceLevel: 'HIGH CONFIDENCE' })
        .sort({ finalScore: -1 })
        .limit(5)
        .populate('lostItemId')
        .populate('foundItemId'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalLost,
          totalFound,
          potentialMatches,
          pendingClaims,
          totalReturned,
          recoveryRate,
          blockedUsers,
        },
        charts: {
          lostByCategory,
          foundByCategory,
          topLocations,
          monthlyLost,
          monthlyFound,
        },
        recent: {
          recentLost,
          recentFound,
          recentPendingClaims,
          highConfidenceMatches,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get all users with search and filter
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAdminUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role && req.query.role !== 'All') {
      query.role = req.query.role;
    }
    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { phone: new RegExp(req.query.search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// @desc    Admin: Block/Unblock user
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
export const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'NOT_FOUND',
      });
    }

    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block another administrator.',
        error: 'CANNOT_BLOCK_ADMIN',
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    await logAudit({
      user: req.user._id,
      action: user.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      target: user.email,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Approve claim and generate Handover with OTP
// @route   PUT /api/admin/claims/:id/approve
// @access  Private (Admin)
export const approveClaim = async (req, res, next) => {
  try {
    const { adminNotes, handoverLocation, scheduledDate, scheduledTime } = req.body;
    const claim = await Claim.findById(req.params.id).populate('claimantId foundItemId lostItemId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
        error: 'NOT_FOUND',
      });
    }

    claim.verificationStatus = 'approved';
    claim.adminNotes = adminNotes || 'Claim verified and approved by administration.';
    claim.approvedBy = req.user._id;
    await claim.save();

    // Mark items as 'claimed'
    await FoundItem.findByIdAndUpdate(claim.foundItemId._id, { status: 'claimed' });
    if (claim.lostItemId) {
      await LostItem.findByIdAndUpdate(claim.lostItemId._id, { status: 'claimed' });
    }

    // Generate secure OTP and create Handover
    const { otp, otpHash } = await generateSecureOTP();

    const handover = await Handover.create({
      claimId: claim._id,
      ownerId: claim.claimantId._id,
      finderId: claim.foundItemId.finderId,
      adminId: req.user._id,
      otpHash,
      handoverLocation: handoverLocation || 'Campus Security Main Office (Desk #3)',
      scheduledDate: scheduledDate || new Date(),
      scheduledTime: scheduledTime || 'During operating hours',
    });

    await logAudit({
      user: req.user._id,
      action: 'CLAIM_APPROVED',
      target: claim._id.toString(),
      metadata: { claimant: claim.claimantId.email, handoverId: handover._id },
    });

    // Notify verified claimant with OTP
    await createNotification({
      userId: claim.claimantId._id,
      type: 'claim_status',
      title: 'Claim Approved! Your Handover OTP is Ready',
      message: `Congratulations! Your claim for "${claim.foundItemId.title}" has been approved. Your 6-digit Handover OTP is: ${otp}. Please visit ${handover.handoverLocation} to receive your item.`,
      relatedItemId: handover._id,
      relatedItemModel: 'Claim',
    });

    res.status(200).json({
      success: true,
      message: 'Claim approved successfully. Handover record created and OTP delivered.',
      data: {
        claim,
        handover,
        devOtpOnly: process.env.NODE_ENV !== 'production' ? otp : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Reject claim
// @route   PUT /api/admin/claims/:id/reject
// @access  Private (Admin)
export const rejectClaim = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const claim = await Claim.findById(req.params.id).populate('claimantId foundItemId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
        error: 'NOT_FOUND',
      });
    }

    claim.verificationStatus = 'rejected';
    claim.adminNotes = adminNotes || 'Claim rejected due to mismatched ownership verification.';
    await claim.save();

    await logAudit({
      user: req.user._id,
      action: 'CLAIM_REJECTED',
      target: claim._id.toString(),
      metadata: { claimant: claim.claimantId.email, reason: claim.adminNotes },
    });

    await createNotification({
      userId: claim.claimantId._id,
      type: 'claim_status',
      title: 'Claim Update: Rejected',
      message: `Your claim for "${claim.foundItemId.title}" was not approved: ${claim.adminNotes}`,
      relatedItemId: claim._id,
      relatedItemModel: 'Claim',
    });

    res.status(200).json({
      success: true,
      message: 'Claim rejected.',
      data: { claim },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Request More Info on claim
// @route   PUT /api/admin/claims/:id/request-info
// @access  Private (Admin)
export const requestClaimInfo = async (req, res, next) => {
  try {
    const { message } = req.body;
    const claim = await Claim.findById(req.params.id).populate('claimantId foundItemId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
        error: 'NOT_FOUND',
      });
    }

    claim.verificationStatus = 'info_requested';
    claim.adminNotes = message || 'Please provide additional photos or serial number verification.';
    await claim.save();

    await createNotification({
      userId: claim.claimantId._id,
      type: 'claim_status',
      title: 'Action Required: Additional Verification Needed',
      message: `Admin inquiry regarding your claim for "${claim.foundItemId.title}": ${claim.adminNotes}`,
      relatedItemId: claim._id,
      relatedItemModel: 'Claim',
    });

    res.status(200).json({
      success: true,
      message: 'Information request sent to claimant.',
      data: { claim },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
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
