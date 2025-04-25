import { Request, Response } from "express";
import Task from "../models/Task";
import { TaskService } from "../services/TaskService";
import Log from "../models/Log";
import Notification from "../models/Notification";
import User from "../models/User";

const taskService = new TaskService();

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const tasks = await taskService.getTasks(
      req.user.id,
      req.user.role,
      status as string | undefined
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only submitters can create tasks
    if (req.user.role !== "submitter") {
      res.status(403).json({ message: "Only submitters can create tasks" });
      return;
    }

    const { title, description } = req.body;

    const task = new Task({
      title,
      description,
      status: "pending",
      createdBy: req.user.id,
    });

    await task.save();

    await Log.create({
      taskId: task._id,
      taskTitle: task.title,
      userId: req.user.id,
      userName: req.user.name,
      toStatus: "pending",
      action: "create",
      timestamp: new Date(),
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getTaskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const canAccess = await taskService.canUserAccessTask(
      id,
      req.user.id,
      req.user.role
    );

    if (!canAccess) {
      res.status(403).json({
        message: "Access denied - you do not have permission to view this task",
      });
      return;
    }

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Populate createdBy field
    await task.populate("createdBy", "name");

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const originalStatus = task.status;
    let statusChanged = false;

    // Get submitter information for notifications
    const submitter =
      task.createdBy && typeof task.createdBy === "string"
        ? await User.findOne({ _id: task.createdBy })
        : null;

    const submitterId = submitter
      ? submitter._id
      : typeof task.createdBy === "string"
      ? task.createdBy
      : null;

    // RBAC checks
    if (req.user.role === "submitter") {
      // Submitters can only edit their own pending tasks
      if (task.createdBy.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied - not your task" });
        return;
      }

      if (task.status !== "pending") {
        res.status(403).json({ message: "Can only edit pending tasks" });
        return;
      }

      // Submitters can't change status
      if (status && status !== "pending") {
        res.status(403).json({
          message: "Submitters cannot change task status",
        });
        return;
      }

      // Update allowed fields
      if (title) task.title = title;
      if (description) task.description = description;
    } else if (req.user.role === "approver") {
      // Approvers can change status but not content
      if (title || description) {
        res.status(403).json({
          message: "Approvers cannot modify task content",
        });
        return;
      }

      // Status workflow validation
      if (status) {
        if (
          task.status === "pending" &&
          ["approved", "rejected"].includes(status)
        ) {
          task.status = status;
          statusChanged = true;
        } else if (task.status === "approved" && status === "done") {
          task.status = status;
          statusChanged = true;
        } else {
          res.status(400).json({
            message: "Invalid status transition",
          });
          return;
        }
      }

      // Record update details
      task.updatedBy = req.user.id;
    }

    // Log changes
    if (statusChanged) {
      await Log.create({
        taskId: task._id,
        taskTitle: task.title,
        userId: req.user.id,
        userName: req.user.name,
        fromStatus: originalStatus,
        toStatus: status,
        action: "status_change",
        timestamp: new Date(),
      });

      // Send notification to the submitter if an approver changed the status
      if (req.user.role === "approver" && submitterId) {
        let actionType: "task_approved" | "task_rejected" | "task_done";
        let message = "";

        if (status === "approved") {
          actionType = "task_approved";
          message = `${req.user.name} approved your task "${task.title}"`;
        } else if (status === "rejected") {
          actionType = "task_rejected";
          message = `${req.user.name} rejected your task "${task.title}"`;
        } else if (status === "done") {
          actionType = "task_done";
          message = `${req.user.name} marked your task "${task.title}" as done`;
        } else {
          // This should never happen due to the validation above, but TypeScript requires it
          actionType = "task_approved";
          message = `${req.user.name} updated the status of your task "${task.title}" to ${status}`;
        }

        await Notification.create({
          userId: submitterId,
          taskId: task._id,
          taskTitle: task.title,
          message,
          actionType,
          actorName: req.user.name,
        });
      }
    } else if (title || description !== undefined) {
      // Log content update
      await Log.create({
        taskId: task._id,
        taskTitle: task.title,
        userId: req.user.id,
        userName: req.user.name,
        toStatus: task.status,
        action: "update",
        timestamp: new Date(),
      });
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Only submitters can delete their own pending tasks
    if (req.user.role === "submitter") {
      if (task.createdBy.toString() !== req.user.id) {
        res.status(403).json({ message: "Access denied - not your task" });
        return;
      }

      if (task.status !== "pending") {
        res.status(403).json({
          message: "Can only delete pending tasks",
        });
        return;
      }
    } else {
      res.status(403).json({
        message: "Only submitters can delete tasks",
      });
      return;
    }

    await Log.create({
      taskId: task._id,
      taskTitle: task.title,
      userId: req.user.id,
      userName: req.user.name,
      fromStatus: task.status,
      toStatus: "deleted",
      action: "delete",
      timestamp: new Date(),
    });

    await Task.deleteOne({ _id: id });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
