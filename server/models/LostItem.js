import mongoose from 'mongoose';

const lostItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an item title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    color: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair', 'Poor', 'Worn', 'Unknown'],
      default: 'Good',
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    uniqueFeatures: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    lostLocation: {
      type: String,
      required: [true, 'Lost location is required'],
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    lostDate: {
      type: Date,
      required: [true, 'Date lost is required'],
      index: true,
    },
    lostTime: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['reported', 'matched', 'claimed', 'returned', 'closed'],
      default: 'reported',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
lostItemSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  color: 'text',
  lostLocation: 'text',
  uniqueFeatures: 'text',
});

const LostItem = mongoose.model('LostItem', lostItemSchema);
export default LostItem;
