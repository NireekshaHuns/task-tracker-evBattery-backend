import { Request, Response } from "express";
import Notification from "../models/Notification";

export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = 20, page = 1 } = req.query;

    // Get all notifications for the current user
    let notifications = await Notification.find({ userId: req.user.id });

    // Sort by createdAt descending (newest first)
    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination manually
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedNotifications = notifications.slice(
      skip,
      skip + Number(limit)
    );

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        total: notifications.length,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(notifications.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const clearAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await Notification.clearAllForUser(req.user.id);
    res.json({ message: "All notifications cleared successfully" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
