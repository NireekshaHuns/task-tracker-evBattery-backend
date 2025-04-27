import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

// Define database paths
const DB_DIR = path.join(__dirname, "../../data");
const USERS_FILE = path.join(DB_DIR, "users.json");
const TASKS_FILE = path.join(DB_DIR, "tasks.json");
const LOGS_FILE = path.join(DB_DIR, "logs.json");
const NOTIFICATIONS_FILE = path.join(DB_DIR, "notifications.json");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize empty database files if they don't exist
const initializeDb = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([]));
  }
};

// Helper function to convert date strings to Date objects when reading
const convertDates = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => convertDates(item));
  }

  if (typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      if (
        typeof obj[key] === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj[key])
      ) {
        obj[key] = new Date(obj[key]);
      } else if (typeof obj[key] === "object") {
        obj[key] = convertDates(obj[key]);
      }
    });
  }

  return obj;
};

// Generic database operations
const readData = <T>(filePath: string): T[] => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return convertDates(JSON.parse(data));
  } catch (error) {
    console.error(`Error reading data from ${filePath}:`, error);
    return [];
  }
};

const writeData = <T>(filePath: string, data: T[]): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing data to ${filePath}:`, error);
    throw error;
  }
};

// Types based on your MongoDB models
export interface IUser {
  _id: string;
  name: string;
  role: "submitter" | "approver";
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "approved" | "done" | "rejected";
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILog {
  _id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  fromStatus?: string;
  toStatus: string;
  timestamp: Date;
  action: "create" | "update" | "delete" | "status_change";
}

// User operations
export const User = {
  findOne: async (query: Partial<IUser>): Promise<IUser | null> => {
    const users = readData<IUser>(USERS_FILE);
    return (
      users.find((user) => {
        for (const [key, value] of Object.entries(query)) {
          if (user[key as keyof IUser] !== value) {
            return false;
          }
        }
        return true;
      }) || null
    );
  },

  find: async (query: Partial<IUser> = {}): Promise<IUser[]> => {
    const users = readData<IUser>(USERS_FILE);
    return users.filter((user) => {
      for (const [key, value] of Object.entries(query)) {
        if (user[key as keyof IUser] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  create: async (
    userData: Omit<IUser, "_id" | "createdAt" | "updatedAt">
  ): Promise<IUser> => {
    const users = readData<IUser>(USERS_FILE);
    const now = new Date();
    const newUser: IUser = {
      _id: uuidv4(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    users.push(newUser);
    writeData(USERS_FILE, users);
    return newUser;
  },

  comparePassword: async (
    user: IUser,
    candidatePassword: string
  ): Promise<boolean> => {
    return bcrypt.compare(candidatePassword, user.password);
  },
};

// Task operations
export const Task = {
  find: async (query: Partial<ITask> = {}): Promise<ITask[]> => {
    const tasks = readData<ITask>(TASKS_FILE);
    return tasks.filter((task) => {
      for (const [key, value] of Object.entries(query)) {
        if (key === "createdBy" && typeof value === "string") {
          if (task.createdBy !== value) {
            return false;
          }
        } else if (task[key as keyof ITask] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  findById: async (id: string): Promise<ITask | null> => {
    const tasks = readData<ITask>(TASKS_FILE);
    return tasks.find((task) => task._id === id) || null;
  },

  create: async (
    taskData: Omit<ITask, "_id" | "createdAt" | "updatedAt">
  ): Promise<ITask> => {
    const tasks = readData<ITask>(TASKS_FILE);
    const now = new Date();
    const newTask: ITask = {
      _id: uuidv4(),
      ...taskData,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(newTask);
    writeData(TASKS_FILE, tasks);
    return newTask;
  },

  save: async (task: ITask): Promise<ITask> => {
    const tasks = readData<ITask>(TASKS_FILE);
    const index = tasks.findIndex((t) => t._id === task._id);
    if (index === -1) {
      throw new Error(`Task with id ${task._id} not found`);
    }
    task.updatedAt = new Date();
    tasks[index] = task;
    writeData(TASKS_FILE, tasks);
    return task;
  },

  deleteOne: async (query: { _id: string }): Promise<void> => {
    const tasks = readData<ITask>(TASKS_FILE);
    const filteredTasks = tasks.filter((task) => task._id !== query._id);
    writeData(TASKS_FILE, filteredTasks);
  },

  countDocuments: async (query: Partial<ITask> = {}): Promise<number> => {
    const tasks = await Task.find(query);
    return tasks.length;
  },

  populate: async (
    task: ITask,
    field: string,
    select: string
  ): Promise<ITask> => {
    if (field === "createdBy" && task.createdBy) {
      const user = await User.findOne({ _id: task.createdBy });
      if (user) {
        // Only include the selected fields
        const populatedFields: Record<string, any> = {};
        select.split(" ").forEach((field) => {
          if (field in user) {
            populatedFields[field] = user[field as keyof IUser];
          }
        });

        // @ts-ignore - dynamically setting the populated field
        task.createdBy = populatedFields;
      }
    }

    if (field === "updatedBy" && task.updatedBy) {
      const user = await User.findOne({ _id: task.updatedBy });
      if (user) {
        const populatedFields: Record<string, any> = {};
        select.split(" ").forEach((field) => {
          if (field in user) {
            populatedFields[field] = user[field as keyof IUser];
          }
        });

        // @ts-ignore - dynamically setting the populated field
        task.updatedBy = populatedFields;
      }
    }

    return task;
  },
};

// Log operations
export const Log = {
  find: async (query: Partial<ILog> = {}): Promise<ILog[]> => {
    const logs = readData<ILog>(LOGS_FILE);

    return logs.filter((log) => {
      for (const [key, value] of Object.entries(query)) {
        if (key === "timestamp" && typeof value === "object") {
          const timestampQuery = value as { $gte?: Date; $lte?: Date };
          const logTimestamp = new Date(log.timestamp);

          if (
            timestampQuery.$gte &&
            logTimestamp < new Date(timestampQuery.$gte)
          ) {
            return false;
          }

          if (
            timestampQuery.$lte &&
            logTimestamp > new Date(timestampQuery.$lte)
          ) {
            return false;
          }
        } else if (log[key as keyof ILog] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  create: async (logData: Omit<ILog, "_id">): Promise<ILog> => {
    const logs = readData<ILog>(LOGS_FILE);
    const newLog: ILog = {
      _id: uuidv4(),
      ...logData,
    };
    logs.push(newLog);
    writeData(LOGS_FILE, logs);
    return newLog;
  },

  countDocuments: async (query: Partial<ILog> = {}): Promise<number> => {
    const logs = await Log.find(query);
    return logs.length;
  },

  sort: (logs: ILog[], sortOptions: Record<string, number>): ILog[] => {
    return [...logs].sort((a, b) => {
      for (const [field, direction] of Object.entries(sortOptions)) {
        if (field === "timestamp") {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          if (dateA < dateB) return -1 * direction;
          if (dateA > dateB) return 1 * direction;
        } else {
          const valA = a[field as keyof ILog];
          const valB = b[field as keyof ILog];

          // Handle undefined values
          if (valA === undefined && valB === undefined) continue;
          if (valA === undefined) return 1 * direction;
          if (valB === undefined) return -1 * direction;

          if (valA < valB) return -1 * direction;
          if (valA > valB) return 1 * direction;
        }
      }
      return 0;
    });
  },
};

// Initialize the database
initializeDb();

export interface INotification {
  _id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  message: string;
  createdAt: Date;
  actionType: "task_approved" | "task_rejected" | "task_done";
  actorName: string;
}

// Notification operations
export const Notification = {
  find: async (
    query: Partial<INotification> = {}
  ): Promise<INotification[]> => {
    const notifications = readData<INotification>(NOTIFICATIONS_FILE);
    return notifications.filter((notification) => {
      for (const [key, value] of Object.entries(query)) {
        if (notification[key as keyof INotification] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  create: async (
    notificationData: Omit<INotification, "_id">
  ): Promise<INotification> => {
    const notifications = readData<INotification>(NOTIFICATIONS_FILE);
    const newNotification: INotification = {
      _id: uuidv4(),
      ...notificationData,
      createdAt: notificationData.createdAt || new Date(),
    };
    notifications.push(newNotification);
    writeData(NOTIFICATIONS_FILE, notifications);
    return newNotification;
  },

  save: async (notification: INotification): Promise<INotification> => {
    const notifications = readData<INotification>(NOTIFICATIONS_FILE);
    const index = notifications.findIndex((n) => n._id === notification._id);
    if (index === -1) {
      throw new Error(`Notification with id ${notification._id} not found`);
    }
    notifications[index] = notification;
    writeData(NOTIFICATIONS_FILE, notifications);
    return notification;
  },

  deleteMany: async (query: Partial<INotification>): Promise<number> => {
    const notifications = readData<INotification>(NOTIFICATIONS_FILE);
    const originalLength = notifications.length;

    const filteredNotifications = notifications.filter((notification) => {
      for (const [key, value] of Object.entries(query)) {
        if (notification[key as keyof INotification] === value) {
          return false;
        }
      }
      return true;
    });

    writeData(NOTIFICATIONS_FILE, filteredNotifications);
    return originalLength - filteredNotifications.length;
  },
};

export default {
  User,
  Task,
  Log,
  Notification,
  initializeDb,
};
