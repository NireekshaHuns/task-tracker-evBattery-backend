import rateLimit from "express-rate-limit";

// Limit task creation to 5 requests per minute per user
export const createTaskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  message: {
    message: "Too many task creation attempts, please try again later.",
    status: "error",
  },
  keyGenerator: (req) => {
    return req.user.id;
  },
});
