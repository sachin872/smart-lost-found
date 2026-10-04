import mongoose from 'mongoose';

const foundItemSchema = new mongoose.Schema(
  {
    finderId: {
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
    foundLocation: {
      type: String,
      required: [true, 'Found location is required'],
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
    foundDate: {
      type: Date,
      required: [true, 'Date found is required'],
      index: true,
    },
    foundTime: {
      type: String,
      default: '',
    },
    currentStorageLocation: {
      type: String,
      default: 'Campus Security Office, Room 102',
      trim: true,
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
foundItemSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  color: 'text',
  foundLocation: 'text',
  uniqueFeatures: 'text',
});

const FoundItem = mongoose.model('FoundItem', foundItemSchema);
export default FoundItem;
