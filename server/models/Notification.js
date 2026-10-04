import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['match_found', 'claim_status', 'handover_scheduled', 'item_returned', 'system_alert'],
      default: 'system_alert',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedItemModel: {
      type: String,
      enum: ['LostItem', 'FoundItem', 'Claim', 'Match', null],
      default: null,
    },
    relatedMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
