import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

// OpenAPI specification
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management API",
      version: "1.0.0",
      description: "API documentation for the Task Management System",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            role: { type: "string", enum: ["submitter", "approver"] },
          },
        },
        Task: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected", "done"],
            },
            createdBy: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            updatedBy: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
                { type: "null" },
              ],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Log: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            taskTitle: { type: "string" },
            userId: { type: "string" },
            userName: { type: "string" },
            fromStatus: {
              type: "string",
              enum: ["pending", "approved", "rejected", "done"],
            },
            toStatus: {
              type: "string",
              enum: ["pending", "approved", "rejected", "done", "deleted"],
            },
            action: {
              type: "string",
              enum: ["create", "update", "status_change", "delete"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            userId: { type: "string" },
            taskId: { type: "string" },
            taskTitle: { type: "string" },
            message: { type: "string" },
            actionType: {
              type: "string",
              enum: ["task_approved", "task_rejected", "task_done"],
            },
            actorName: { type: "string" },
            read: { type: "boolean", default: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/controllers/*.ts"], // Path to controllers with JSDoc comments
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};
