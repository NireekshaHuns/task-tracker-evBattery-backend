import { Request, Response } from "express";
import { fetchLogs, fetchSubmitters } from "../services/LogService";

// Get all logs based on query parameters
/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all logs based on query parameters
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         description: Filter logs by task ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter logs by user ID (only for approvers)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs created on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs created on or before this date
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
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: List of logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *                 total:
 *                   type: integer
 *                   description: Total number of logs matching query
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 pages:
 *                   type: integer
 *                   description: Total number of pages
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await fetchLogs(req.query, req.user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get list of submitters (approvers only)
/**
 * @swagger
 * /api/logs/submitters:
 *   get:
 *     summary: Get list of submitters (approvers only)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of submitters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *       403:
 *         description: Access denied - approvers only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied - approvers only
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getSubmitters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const submitters = await fetchSubmitters(req.user);

    if (submitters === null) {
      res.status(403).json({ message: "Access denied - approvers only" });
      return;
    }

    res.json(submitters);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
