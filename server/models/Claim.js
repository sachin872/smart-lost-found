import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
      index: true,
    },
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItem',
      default: null,
      index: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoundItem',
      required: true,
      index: true,
    },
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verificationAnswers: {
      itemBrand: { type: String, default: '' },
      uniqueMarks: { type: String, default: '' },
      contentsInside: { type: String, default: '' },
      exactLostLocation: { type: String, default: '' },
      hiddenFeatures: { type: String, default: '' },
      additionalProof: { type: String, default: '' },
    },
    verificationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'info_requested'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
