import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const handoverSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    finderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    handoverLocation: {
      type: String,
      default: 'Campus Security Main Office (Desk #3)',
      trim: true,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    scheduledTime: {
      type: String,
      default: 'During business hours (9:00 AM - 5:00 PM)',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

handoverSchema.methods.verifyOTP = async function (enteredOtp) {
  return await bcrypt.compare(enteredOtp, this.otpHash);
};

const Handover = mongoose.model('Handover', handoverSchema);
export default Handover;
