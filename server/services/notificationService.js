import Notification from '../models/Notification.js';

/**
 * Create a persistent notification for a user
 */
export async function createNotification({
  userId,
  type = 'system_alert',
  title,
  message,
  relatedItemId = null,
  relatedItemModel = null,
  relatedMatchId = null,
}) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedItemId,
      relatedItemModel,
      relatedMatchId,
    });
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

/**
 * Get user notifications with unread counts
 */
export async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedMatchId'),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId, userId) {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
}
