import dotenv from "dotenv";
dotenv.config();

// Validate and narrow required env vars
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is missing in the .env file");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing in the .env file");

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri,             // now type-safe string
  jwtSecret,            // now type-safe string
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
