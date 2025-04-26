import Task from "../models/Task";

export class TaskService {
  async getTasks(userId: string, role: string, status?: string) {
    try {
      let query: any = {};

      // Filter by status if provided
      if (status) {
        query.status = status;
      }

      // Submitters can only see their own tasks
      if (role === "submitter") {
        query.createdBy = userId;
      }

      const tasks = await Task.find(query);

      // Manually populate createdBy and updatedBy since we don't have MongoDB's populate
      const populatedTasks = [];
      for (const task of tasks) {
        await task.populate("createdBy", "_id name");
        if (task.updatedBy) {
          await task.populate("updatedBy", "name");
        }
        populatedTasks.push(task);
      }

      // Sort by createdAt descending
      return populatedTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      throw error;
    }
  }

  async canUserAccessTask(taskId: string, userId: string, role: string) {
    try {
      const task = await Task.findById(taskId);

      if (!task) return false;

      // Approvers can access all tasks
      if (role === "approver") return true;

      // Submitters can only access their own tasks
      return task.createdBy === userId;
    } catch (error) {
      throw error;
    }
  }
}
