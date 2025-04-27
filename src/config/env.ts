import dotenv from "dotenv";
dotenv.config();

// Validate and narrow required env vars
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is missing in the .env file");

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  dataPath: process.env.DATA_PATH || "./data", // Path to store JSON data files
};
