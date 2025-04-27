import {
  Notification as JsonNotification,
  INotification,
} from "../database/jsonDB";

class Notification {
  _id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  message: string;
  createdAt: Date;
  actionType: "task_approved" | "task_rejected" | "task_done";
  actorName: string;

  constructor(notificationData: Omit<INotification, "_id" | "createdAt">) {
    this._id = "";
    this.userId = notificationData.userId;
    this.taskId = notificationData.taskId;
    this.taskTitle = notificationData.taskTitle;
    this.message = notificationData.message;
    this.createdAt = new Date();
    this.actionType = notificationData.actionType;
    this.actorName = notificationData.actorName;
  }

  static async find(query: Partial<INotification>): Promise<Notification[]> {
    const notifications = await JsonNotification.find(query);
    return notifications.map((notification) => {
      // Ensure createdAt is a Date object
      const notificationObj = Object.assign(
        Object.create(Notification.prototype),
        notification
      );
      if (typeof notificationObj.createdAt === "string") {
        notificationObj.createdAt = new Date(notificationObj.createdAt);
      }
      return notificationObj;
    });
  }

  static async create(
    notificationData: Omit<INotification, "_id" | "createdAt">
  ): Promise<Notification> {
    const newNotification = new Notification(notificationData);
    return newNotification.save();
  }

  async save(): Promise<Notification> {
    if (!this._id) {
      // New notification - create
      const notificationData = {
        userId: this.userId,
        taskId: this.taskId,
        taskTitle: this.taskTitle,
        message: this.message,
        actionType: this.actionType,
        actorName: this.actorName,
        createdAt: this.createdAt,
      };
      const newNotification = await JsonNotification.create(notificationData);
      Object.assign(this, newNotification);
      return this;
    }

    // Existing notification - update (not needed for this simplified implementation)
    const updatedNotification = await JsonNotification.save(this);
    Object.assign(this, updatedNotification);
    return this;
  }

  static async clearAllForUser(userId: string): Promise<void> {
    await JsonNotification.deleteMany({ userId });
  }
}

export default Notification;
