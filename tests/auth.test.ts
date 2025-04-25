import request from "supertest";
import app from "../src/server";
import { mockUsers } from "./mocks/users";

describe("Authentication API Tests", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const uniqueUser = {
        ...mockUsers.submitter,
        username: `test.submitter.${Date.now()}`,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(uniqueUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User registered successfully");
    });

    it("should prevent duplicate username registration", async () => {
      // Use a specific username for this test
      const username = `duplicate.user.${Date.now()}`;
      const userWithDuplicateUsername = {
        ...mockUsers.submitter,
        username,
      };

      // Register first user
      await request(app)
        .post("/api/auth/register")
        .send(userWithDuplicateUsername);

      // Try to register with the same username
      const response = await request(app)
        .post("/api/auth/register")
        .send(userWithDuplicateUsername);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username already exists");
    });

    it("should register users with different roles", async () => {
      // Create unique timestamps for each user
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1;

      // Create unique users
      const uniqueSubmitter = {
        ...mockUsers.submitter,
        username: `submitter.${timestamp1}`,
      };

      const uniqueApprover = {
        ...mockUsers.approver,
        username: `approver.${timestamp2}`,
      };

      // Register a submitter
      const submitterResponse = await request(app)
        .post("/api/auth/register")
        .send(uniqueSubmitter);

      // Register an approver
      const approverResponse = await request(app)
        .post("/api/auth/register")
        .send(uniqueApprover);

      expect(submitterResponse.status).toBe(201);
      expect(approverResponse.status).toBe(201);
    });
  });

  // Test user login
  describe("POST /api/auth/login", () => {
    let submitterUsername: string;
    let approverUsername: string;

    beforeEach(async () => {
      // Register test users with unique usernames before login tests
      submitterUsername = `login.submitter.${Date.now()}`;
      approverUsername = `login.approver.${Date.now() + 1}`;

      const submitterUser = {
        ...mockUsers.submitter,
        username: submitterUsername,
      };

      const approverUser = {
        ...mockUsers.approver,
        username: approverUsername,
      };

      await request(app).post("/api/auth/register").send(submitterUser);

      await request(app).post("/api/auth/register").send(approverUser);
    });

    it("should login a submitter successfully", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: submitterUsername,
        password: mockUsers.submitter.password,
        role: mockUsers.submitter.role,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.role).toBe(mockUsers.submitter.role);
    });

    it("should login an approver successfully", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: approverUsername,
        password: mockUsers.approver.password,
        role: mockUsers.approver.role,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.role).toBe(mockUsers.approver.role);
    });

    it("should reject login with incorrect password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: submitterUsername,
        password: "wrongpassword",
        role: mockUsers.submitter.role,
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should reject login with incorrect role", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: submitterUsername,
        password: mockUsers.submitter.password,
        role: "approver", // Trying to log in as approver when registered as submitter
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain(
        "You don't have access as approver"
      );
    });
  });
});
