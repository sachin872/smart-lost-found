import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItem',
      required: true,
      index: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoundItem',
      required: true,
      index: true,
    },
    textScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    imageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    categoryScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    colorScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    brandScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    locationScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    finalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    matchReason: {
      type: String,
      default: '',
    },
    confidenceLevel: {
      type: String,
      enum: ['HIGH CONFIDENCE', 'MEDIUM CONFIDENCE', 'LOW CONFIDENCE'],
      default: 'MEDIUM CONFIDENCE',
    },
    status: {
      type: String,
      enum: ['potential', 'confirmed', 'rejected', 'claimed'],
      default: 'potential',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate match records between same pair
matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

const Match = mongoose.model('Match', matchSchema);
export default Match;
