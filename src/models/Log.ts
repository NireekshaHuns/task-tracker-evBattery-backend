import { Log as JsonLog, ILog } from "../database/jsonDB";

class Log {
  _id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  fromStatus?: string;
  toStatus: string;
  timestamp: Date;
  action: "create" | "update" | "delete" | "status_change";

  constructor(logData: Omit<ILog, "_id">) {
    this._id = "";
    this.taskId = logData.taskId;
    this.taskTitle = logData.taskTitle;
    this.userId = logData.userId;
    this.userName = logData.userName;
    this.fromStatus = logData.fromStatus;
    this.toStatus = logData.toStatus;
    this.timestamp = logData.timestamp || new Date();
    this.action = logData.action;
  }

  static async find(query: Partial<ILog>): Promise<Log[]> {
    const logs = await JsonLog.find(query);
    return logs.map((log) => {
      // Ensure timestamp is a proper Date object
      const logObj = Object.assign(Object.create(Log.prototype), log);
      if (typeof logObj.timestamp === "string") {
        logObj.timestamp = new Date(logObj.timestamp);
      }
      return logObj;
    });
  }

  static async create(logData: Omit<ILog, "_id">): Promise<Log> {
    // Ensure timestamp is a proper Date object
    const logDataWithDate = {
      ...logData,
      timestamp: logData.timestamp || new Date(),
    };

    const newLog = await JsonLog.create(logDataWithDate);

    // Ensure the returned log has a proper Date object for timestamp
    const logObj = Object.assign(Object.create(Log.prototype), newLog);
    if (typeof logObj.timestamp === "string") {
      logObj.timestamp = new Date(logObj.timestamp);
    }

    return logObj;
  }

  static async countDocuments(query: Partial<ILog> = {}): Promise<number> {
    return JsonLog.countDocuments(query);
  }

  static sort(logs: Log[], sortOptions: Record<string, number>): Log[] {
    const sortedLogs = JsonLog.sort(logs, sortOptions);
    return sortedLogs.map((log) =>
      Object.assign(Object.create(Log.prototype), log)
    );
  }
}

export default Log;
