import { Request, Response } from "express";
import {
  fetchNotifications,
  clearNotifications,
} from "../services/NotificationService";

// Get notifications for a user
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true/false)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                   description: Total number of notifications matching query
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 pages:
 *                   type: integer
 *                   description: Total number of pages
 *                 unreadCount:
 *                   type: integer
 *                   description: Number of unread notifications
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await fetchNotifications(req.query, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Clear all notifications for a user
/**
 * @swagger
 * /api/notifications/clear:
 *   post:
 *     summary: Clear all notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acknowledged:
 *                   type: boolean
 *                 modifiedCount:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const clearAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await clearNotifications(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
