import mongoose from "mongoose";
import { env } from "./env";

/**
 * Connects to MongoDB using MONGO_URI from environment variables.
 */
export const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
