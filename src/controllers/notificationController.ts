import { Request, Response } from "express";
import {
  fetchNotifications,
  clearNotifications,
} from "../services/NotificationService";

// Get notifications for a user
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await fetchNotifications(req.query, req.user.id);
    res.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Clear all notifications for a user
export const clearAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await clearNotifications(req.user.id);
    res.json(result);
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
