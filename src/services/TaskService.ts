import Task from '../models/Task';
import mongoose from 'mongoose';

export class TaskService {
  async getTasks(userId: string, role: string, status?: string) {
    try {
      let query: any = {};
      
      // Filter by status if provided
      if (status) {
        query.status = status;
      }
      
      // Submitters can only see their own tasks
      if (role === 'submitter') {
        query.createdBy = new mongoose.Types.ObjectId(userId);
      }
      
      return Task.find(query)
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }
  
  async canUserAccessTask(taskId: string, userId: string, role: string) {
    try {
      const task = await Task.findById(taskId);
      
      if (!task) return false;
      
      // Approvers can access all tasks
      if (role === 'approver') return true;
      
      // Submitters can only access their own tasks
      return task.createdBy.toString() === userId;
    } catch (error) {
      throw error;
    }
  }
}