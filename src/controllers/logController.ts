import { Request, Response } from 'express';
import Log from '../models/Log';

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      taskId, 
      userId, 
      action, 
      fromStatus, 
      toStatus,

      startDate,
      endDate,
      limit = 100,
      page = 1
    } = req.query;
    
    const query: any = {};
    
    if (taskId) query.taskId = taskId;
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (fromStatus) query.fromStatus = fromStatus;
    if (toStatus) query.toStatus = toStatus;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count for pagination
    const total = await Log.countDocuments(query);
    
    // Get logs with pagination and sorting
    const logs = await Log.find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .skip(skip)
      .limit(Number(limit));
    
    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};