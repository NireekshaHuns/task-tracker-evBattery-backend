import request from "supertest";
import app from "../src/server";
import { createTestUser, createTestTask, verifyTestDatabase } from "./helpers";
import { mockUsers } from "./mocks/users";
import { mockTasks } from "./mocks/tasks";
import fs from "fs";
import path from "path";

// Helper to verify database is empty at start of test
const ensureEmptyDatabase = async () => {
  // Simply check that the database has correct path and is empty
  const dbDir = process.env.DATA_PATH || path.join(__dirname, "../data_test");
  const tasksFile = path.join(dbDir, "tasks.json");

  if (fs.existsSync(tasksFile)) {
    const content = fs.readFileSync(tasksFile, "utf8");
    const tasks = JSON.parse(content);
    if (tasks.length > 0) {
      console.warn(
        `WARNING: Tasks database not empty at start of test. Found ${tasks.length} tasks.`
      );
      // Force empty
      fs.writeFileSync(tasksFile, JSON.stringify([]));
    }
  }
};

describe("Tasks API Tests", () => {
  let submitterData: { user: any; token: string };
  let approverData: { user: any; token: string };
  let anotherSubmitterData: { user: any; token: string };

  // Before each test, ensure we start with an empty database and create required users
  beforeEach(async () => {
    // Start with empty database
    await ensureEmptyDatabase();

    // Create test users with different roles - use timestamps for unique usernames
    const timestamp = Date.now();
    submitterData = await createTestUser(
      `test.submitter.${timestamp}`,
      "submitter"
    );
    approverData = await createTestUser(
      `test.approver.${timestamp}`,
      "approver"
    );
    anotherSubmitterData = await createTestUser(
      `another.submitter.${timestamp}`,
      "submitter"
    );
  });

  describe("Task Creation", () => {
    it("should allow submitters to create tasks", async () => {
      const response = await request(app)
        .post("/api/tasks/create")
        .set("Authorization", `Bearer ${submitterData.token}`)
        .send(mockTasks.pendingTask);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(mockTasks.pendingTask.title);
      expect(response.body.status).toBe("pending");
      expect(response.body.createdBy).toBe(submitterData.user._id);
    });

    it("should prevent approvers from creating tasks", async () => {
      const response = await request(app)
        .post("/api/tasks/create")
        .set("Authorization", `Bearer ${approverData.token}`)
        .send(mockTasks.pendingTask);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "Access denied - insufficient permissions"
      );
    });
  });

  describe("Task Viewing", () => {
    it("should allow submitter to view only their own tasks", async () => {
      // Ensure database is empty
      await ensureEmptyDatabase();

      // Create tasks for both submitters
      const submitterTask = await createTestTask(
        submitterData.user._id,
        "pending",
        "Submitter Task"
      );
      await createTestTask(
        anotherSubmitterData.user._id,
        "pending",
        "Other Submitter Task"
      );

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${submitterData.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Should only see their own tasks
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe("Submitter Task");

      // Should not see other submitter's tasks
      const hasForbiddenTask = response.body.some(
        (task: any) => task.title === "Other Submitter Task"
      );
      expect(hasForbiddenTask).toBe(false);
    });
  });

  // RBAC Test - Check that submitters cannot approve tasks
  describe("RBAC - Task Status Management", () => {
    let pendingTask: any;

    beforeEach(async () => {
      // Ensure database is empty
      await ensureEmptyDatabase();

      // Create a pending task by submitter
      pendingTask = await createTestTask(submitterData.user._id);
    });

    it("should prevent submitters from approving tasks", async () => {
      const response = await request(app)
        .put(`/api/tasks/${pendingTask._id}`)
        .set("Authorization", `Bearer ${submitterData.token}`)
        .send({ status: "approved" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "Submitters cannot change task status"
      );
    });

    it("should allow approvers to approve tasks", async () => {
      const response = await request(app)
        .put(`/api/tasks/${pendingTask._id}`)
        .set("Authorization", `Bearer ${approverData.token}`)
        .send({ status: "approved" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("approved");
      expect(response.body.updatedBy).toBe(approverData.user._id);
    });

    it("should prevent approvers from modifying task content", async () => {
      const response = await request(app)
        .put(`/api/tasks/${pendingTask._id}`)
        .set("Authorization", `Bearer ${approverData.token}`)
        .send({ title: "Modified Title" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "Approvers cannot modify task content"
      );
    });

    it("should prevent submitters from editing non-pending tasks", async () => {
      // First, let the approver approve the task
      await request(app)
        .put(`/api/tasks/${pendingTask._id}`)
        .set("Authorization", `Bearer ${approverData.token}`)
        .send({ status: "approved" });

      // Now, try to edit the approved task as a submitter
      const response = await request(app)
        .put(`/api/tasks/${pendingTask._id}`)
        .set("Authorization", `Bearer ${submitterData.token}`)
        .send({ description: "Updated description" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Can only edit pending tasks");
    });

    it("should prevent submitters from accessing tasks created by others", async () => {
      // Ensure database is empty first
      await ensureEmptyDatabase();

      // Create a task by another submitter
      const otherTask = await createTestTask(anotherSubmitterData.user._id);

      // Try to access the task as the first submitter
      const response = await request(app)
        .put(`/api/tasks/${otherTask._id}`)
        .set("Authorization", `Bearer ${submitterData.token}`)
        .send({ description: "Modified description" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Access denied - not your task");
    });

    it("should correctly enforce the task workflow validation", async () => {
      // Ensure database is empty first
      await ensureEmptyDatabase();

      // Approve a task
      const approvedTask = await createTestTask(
        submitterData.user._id,
        "approved"
      );

      // Try to reject an already approved task
      const response = await request(app)
        .put(`/api/tasks/${approvedTask._id}`)
        .set("Authorization", `Bearer ${approverData.token}`)
        .send({ status: "rejected" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid status transition");
    });
  });

  describe("Task Deletion", () => {
    it("should allow submitters to delete their pending tasks", async () => {
      // Ensure database is empty first
      await ensureEmptyDatabase();

      const task = await createTestTask(submitterData.user._id);

      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${submitterData.token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Task deleted successfully");
    });

    it("should prevent submitters from deleting approved tasks", async () => {
      // Ensure database is empty first
      await ensureEmptyDatabase();

      const task = await createTestTask(submitterData.user._id, "approved");

      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${submitterData.token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Can only delete pending tasks");
    });

    it("should prevent approvers from deleting tasks", async () => {
      // Ensure database is empty first
      await ensureEmptyDatabase();

      const task = await createTestTask(submitterData.user._id);

      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${approverData.token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Only submitters can delete tasks");
    });
  });
});
