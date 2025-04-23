import { Request, Response } from 'express';
import Task from '../models/Task';
import { TaskService } from '../services/TaskService';

const taskService = new TaskService();

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const tasks = await taskService.getTasks(
      req.user.id, 
      req.user.role, 
      status as string | undefined
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    // Only submitters can create tasks
    if (req.user.role !== 'submitter') {
      return res.status(403).json({ message: 'Only submitters can create tasks' });
    }
    
    const { title, description } = req.body;
    
    const task = new Task({
      title,
      description,
      status: 'pending',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user has access to this task
    const canAccess = await taskService.canUserAccessTask(id, req.user.id, req.user.role);
    
    if (!canAccess) {
      return res.status(403).json({ 
        message: 'Access denied - you do not have permission to view this task' 
      });
    }
    
    const task = await Task.findById(id).populate('createdBy', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // RBAC checks
    if (req.user.role === 'submitter') {
      // Submitters can only edit their own pending tasks
      if (task.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied - not your task' });
      }
      
      if (task.status !== 'pending') {
        return res.status(403).json({ message: 'Can only edit pending tasks' });
      }
      
      // Submitters can't change status
      if (status && status !== 'pending') {
        return res.status(403).json({ 
          message: 'Submitters cannot change task status' 
        });
      }
      
      // Update allowed fields
      if (title) task.title = title;
      if (description) task.description = description;
    } else if (req.user.role === 'approver') {
      // Approvers can change status but not content
      if (title || description) {
        return res.status(403).json({ 
          message: 'Approvers cannot modify task content' 
        });
      }
      
      // Status workflow validation
      if (status) {
        if (task.status === 'pending' && ['approved', 'rejected'].includes(status)) {
          task.status = status;
        } else if (task.status === 'approved' && status === 'done') {
          task.status = status;
        } else {
          return res.status(400).json({ 
            message: 'Invalid status transition' 
          });
        }
        
        // Record update details
        task.updatedBy = req.user.id;
      }
    }
    
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Only submitters can delete their own pending tasks
    if (req.user.role === 'submitter') {
      if (task.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied - not your task' });
      }
      
      if (task.status !== 'pending') {
        return res.status(403).json({ 
          message: 'Can only delete pending tasks' 
        });
      }
    } else {
      return res.status(403).json({ 
        message: 'Only submitters can delete tasks' 
      });
    }
    
    await Task.deleteOne({ _id: id });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};