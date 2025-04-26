import { Task as JsonTask, ITask } from "../database/jsonDB";

class Task {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "approved" | "done" | "rejected";
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(taskData: Omit<ITask, "_id" | "createdAt" | "updatedAt">) {
    this._id = "";
    this.title = taskData.title;
    this.description = taskData.description;
    this.status = taskData.status;
    this.createdBy = taskData.createdBy;
    this.updatedBy = taskData.updatedBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async find(query: Partial<ITask>): Promise<Task[]> {
    const tasks = await JsonTask.find(query);
    return tasks.map((task) =>
      Object.assign(Object.create(Task.prototype), task)
    );
  }

  static async findById(id: string): Promise<Task | null> {
    const task = await JsonTask.findById(id);
    if (!task) return null;

    return Object.assign(Object.create(Task.prototype), task);
  }

  static async deleteOne(query: { _id: string }): Promise<void> {
    await JsonTask.deleteOne(query);
  }

  static async countDocuments(query: Partial<ITask> = {}): Promise<number> {
    return JsonTask.countDocuments(query);
  }

  async save(): Promise<Task> {
    if (!this._id) {
      // New task - create
      const taskData = {
        title: this.title,
        description: this.description,
        status: this.status,
        createdBy: this.createdBy,
        updatedBy: this.updatedBy,
      };
      const newTask = await JsonTask.create(taskData);
      Object.assign(this, newTask);
      return this;
    }
    // Existing task - update
    const updatedTask = await JsonTask.save(this);
    Object.assign(this, updatedTask);
    return this;
  }

  async populate(path: string, select: string): Promise<Task> {
    const populatedTask = await JsonTask.populate(this, path, select);
    Object.assign(this, populatedTask);
    return this;
  }

  static async populateUserReferences(tasks: Task[]): Promise<Task[]> {
    const populatedTasks = [];

    for (const task of tasks) {
      // Populate createdBy
      await task.populate("createdBy", "name role");

      // Populate updatedBy if it exists
      if (task.updatedBy) {
        await task.populate("updatedBy", "name role");
      }

      populatedTasks.push(task);
    }

    return populatedTasks;
  }
}

export default Task;
