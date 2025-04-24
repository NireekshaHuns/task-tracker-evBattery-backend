import { Request, Response } from 'express';
import Log from '../models/Log';
import User from '../models/User';

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      taskId, 
      userId, 
      action, 
      fromStatus, 
      toStatus,
      submitterId,
      startDate,
      endDate,
      limit = 100,
      page = 1
    } = req.query;
    
    const query: any = {};
    
    if (req.user.role === 'submitter') {
      query.userId = req.user.id;
    } else if (req.user.role === 'approver' && submitterId) {
      query.userId = submitterId;
    }
    
    if (taskId) query.taskId = taskId;
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

export const getSubmitters = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only approvers can access this endpoint
    if (req.user.role !== 'approver') {
      res.status(403).json({ message: 'Access denied - approvers only' });
      return;
    }
    
    // Get all users with submitter role
    const submitters = await User.find({ role: 'submitter' })
      .select('_id name')
      .sort('name');
    
    res.json(submitters);
  } catch (error) {
    console.error('Error fetching submitters:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};