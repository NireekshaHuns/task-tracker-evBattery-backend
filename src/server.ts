import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import logRoutes from "./routes/logRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { errorHandler } from "./utils/errorHandler";
import { setupSwagger } from "./config/swagger";

dotenv.config();

// Initialize Express app
const app: Application = express();
setupSwagger(app);

connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `API documentation available at http://localhost:${PORT}/api-docs`
  );
});

export default app;
