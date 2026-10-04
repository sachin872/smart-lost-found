import Handover from '../models/Handover.js';
import Claim from '../models/Claim.js';
import FoundItem from '../models/FoundItem.js';
import LostItem from '../models/LostItem.js';
import User from '../models/User.js';
import { generateSecureOTP } from '../utils/otpGenerator.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

// @desc    Initiate Handover & generate OTP (Called upon claim approval or manually by admin)
// @route   POST /api/handover
// @access  Private (Admin only)
export const createHandover = async (req, res, next) => {
  try {
    const { claimId, handoverLocation, scheduledDate, scheduledTime } = req.body;

    const claim = await Claim.findById(claimId).populate('claimantId foundItemId lostItemId');
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim record not found',
        error: 'NOT_FOUND',
      });
    }

    if (claim.verificationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initiate handover for an unapproved claim.',
        error: 'CLAIM_NOT_APPROVED',
      });
    }

    // Check if handover already exists
    let handover = await Handover.findOne({ claimId: claim._id, status: 'pending' });
    const { otp, otpHash } = await generateSecureOTP();

    if (handover) {
      // Refresh OTP
      handover.otpHash = otpHash;
      handover.failedAttempts = 0;
      if (handoverLocation) handover.handoverLocation = handoverLocation;
      if (scheduledDate) handover.scheduledDate = scheduledDate;
      if (scheduledTime) handover.scheduledTime = scheduledTime;
      await handover.save();
    } else {
      handover = await Handover.create({
        claimId: claim._id,
        ownerId: claim.claimantId._id,
        finderId: claim.foundItemId.finderId,
        adminId: req.user._id,
        otpHash,
        handoverLocation: handoverLocation || 'Campus Security Main Office (Desk #3)',
        scheduledDate: scheduledDate || new Date(),
        scheduledTime: scheduledTime || '9:00 AM - 5:00 PM',
      });
    }

    await logAudit({
      user: req.user._id,
      action: 'HANDOVER_INITIATED',
      target: handover._id.toString(),
      metadata: { claimId: claim._id, ownerId: claim.claimantId._id },
    });

    // Notify the verified owner with their private 6-digit OTP
    await createNotification({
      userId: claim.claimantId._id,
      type: 'handover_scheduled',
      title: 'Handover Scheduled - Your Secure Return OTP',
      message: `Your item "${claim.foundItemId.title}" is ready for collection at ${handover.handoverLocation}. Present your 6-digit Handover OTP: ${otp} to security staff. Keep this code secret until physically meeting.`,
      relatedItemId: handover._id,
      relatedItemModel: 'Claim',
    });

    res.status(201).json({
      success: true,
      message: 'Handover scheduled. Secure OTP generated and dispatched to the verified owner.',
      data: {
        handover: {
          _id: handover._id,
          claimId: handover.claimId,
          handoverLocation: handover.handoverLocation,
          scheduledDate: handover.scheduledDate,
          scheduledTime: handover.scheduledTime,
          status: handover.status,
        },
        // Displayed once in development/demo response for seamless validation
        devOtpOnly: process.env.NODE_ENV !== 'production' ? otp : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify OTP and complete physical handover
// @route   POST /api/handover/verify
// @access  Private (Admin or Finder / Security)
export const verifyHandover = async (req, res, next) => {
  try {
    const { handoverId, otp, notes } = req.body;

    if (!handoverId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'handoverId and 6-digit OTP are required.',
        error: 'MISSING_FIELDS',
      });
    }

    const handover = await Handover.findById(handoverId)
      .select('+otpHash')
      .populate('claimId ownerId finderId');

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: 'Handover record not found.',
        error: 'NOT_FOUND',
      });
    }

    if (handover.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This handover has already been completed and verified.',
        error: 'ALREADY_COMPLETED',
      });
    }

    // Check failed attempts rate limit
    if (handover.failedAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please contact head administrator for an override.',
        error: 'MAX_ATTEMPTS_EXCEEDED',
      });
    }

    // Verify OTP using bcrypt
    const isMatch = await handover.verifyOTP(otp.trim());

    if (!isMatch) {
      handover.failedAttempts += 1;
      await handover.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${5 - handover.failedAttempts} attempt(s) remaining.`,
        error: 'INVALID_OTP',
      });
    }

    // Mark handover as completed
    handover.status = 'completed';
    handover.verifiedAt = new Date();
    if (notes) handover.notes = notes;
    await handover.save();

    // Mark FoundItem and LostItem as 'returned'
    const claim = await Claim.findById(handover.claimId);
    if (claim) {
      await FoundItem.findByIdAndUpdate(claim.foundItemId, { status: 'returned' });
      if (claim.lostItemId) {
        await LostItem.findByIdAndUpdate(claim.lostItemId, { status: 'returned' });
      }
    }

    await logAudit({
      user: req.user._id,
      action: 'OTP_VERIFIED_ITEM_RETURNED',
      target: handover._id.toString(),
      metadata: { ownerId: handover.ownerId._id },
    });

    // Notify owner
    await createNotification({
      userId: handover.ownerId._id,
      type: 'item_returned',
      title: 'Item Successfully Returned!',
      message: 'Your item has been safely returned to you. Thank you for using Smart Lost & Found.',
      relatedItemId: handover._id,
    });

    // Notify finder
    await createNotification({
      userId: handover.finderId._id,
      type: 'item_returned',
      title: 'Found Item Successfully Returned to Owner',
      message: 'The item you found and reported has been safely handed over to its verified owner. Great job!',
      relatedItemId: handover._id,
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! Item officially marked as RETURNED.',
      data: {
        handoverId: handover._id,
        status: 'completed',
        verifiedAt: handover.verifiedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get handover details
// @route   GET /api/handover/:id
// @access  Private
export const getHandoverById = async (req, res, next) => {
  try {
    const handover = await Handover.findById(req.params.id)
      .populate('claimId')
      .populate('ownerId', 'name email phone')
      .populate('finderId', 'name email phone');

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: 'Handover record not found',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: { handover },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user or all handovers
// @route   GET /api/handover
// @access  Private
export const getHandovers = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role !== 'admin') {
      query.$or = [{ ownerId: req.user._id }, { finderId: req.user._id }];
    }

    const handovers = await Handover.find(query)
      .populate('claimId')
      .populate('ownerId', 'name email phone')
      .populate('finderId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { handovers },
    });
  } catch (err) {
    next(err);
  }
};
