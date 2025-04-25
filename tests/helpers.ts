import request from "supertest";
import app from "../src/server";
import User from "../src/models/User";
import Task from "../src/models/Task";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Helper to check if the test database is properly initialized
export const verifyTestDatabase = () => {
  const dbDir = process.env.DATA_PATH || path.join(__dirname, "../data_test");
  const tasksFile = path.join(dbDir, "tasks.json");

  if (fs.existsSync(tasksFile)) {
    const content = fs.readFileSync(tasksFile, "utf8");
    try {
      const data = JSON.parse(content);
      console.log(`Tasks file contains ${data.length} tasks`);
      return data.length;
    } catch (e) {
      console.error("Error parsing tasks file:", e);
      return -1;
    }
  } else {
    console.error("Tasks file does not exist");
    return -1;
  }
};

// Create and authenticate a user for testing
export const createTestUser = async (
  username: string,
  role: "submitter" | "approver"
): Promise<{
  user: any;
  token: string;
}> => {
  // Ensure username is unique if not already containing timestamp
  if (!username.includes(".")) {
    username = `${username}.${Date.now()}`;
  }

  const userData = {
    name: `Test ${role}`,
    username,
    password: "password123",
    role,
  };

  // Create user directly in the database
  const user = new User(userData);
  const savedUser = await user.save();

  console.log(
    `Created test user: ${username}, ID: ${savedUser._id}, role: ${role}`
  );

  // Generate token
  const token = jwt.sign(
    { id: savedUser._id, role: savedUser.role, name: savedUser.name },
    process.env.JWT_SECRET || "test_jwt_secret",
    { expiresIn: "1h" }
  );

  return { user: savedUser, token };
};

// Create a task for testing
export const createTestTask = async (
  createdBy: string,
  status: "pending" | "approved" | "done" | "rejected" = "pending",
  title = "Test Task"
): Promise<any> => {
  // First check if the task database is empty
  const taskCount = verifyTestDatabase();
  console.log(`Current task count before creating new task: ${taskCount}`);

  const taskData = {
    title,
    description: "Test task description",
    status,
    createdBy,
  };

  const task = new Task(taskData);
  const savedTask = await task.save();

  console.log(
    `Created test task: ${title}, ID: ${savedTask._id}, status: ${status}`
  );

  return savedTask;
};

// Login a user and get token
export const loginUser = async (
  username: string,
  password: string,
  role: "submitter" | "approver"
): Promise<string> => {
  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ username, password, role });

  return loginResponse.body.token;
};
