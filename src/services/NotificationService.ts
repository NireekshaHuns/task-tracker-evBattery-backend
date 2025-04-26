import Notification from "../models/Notification";

export const fetchNotifications = async (queryParams: any, userId: string) => {
  const { limit = 20, page = 1 } = queryParams;

  // Get all notifications for the current user
  let notifications = await Notification.find({ userId });

  // Sort by createdAt descending (newest first)
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply pagination manually
  const skip = (Number(page) - 1) * Number(limit);
  const paginatedNotifications = notifications.slice(
    skip,
    skip + Number(limit)
  );

  return {
    notifications: paginatedNotifications,
    pagination: {
      total: notifications.length,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(notifications.length / Number(limit)),
    },
  };
};

export const clearNotifications = async (userId: string) => {
  await Notification.clearAllForUser(userId);
  return { message: "All notifications cleared successfully" };
};
