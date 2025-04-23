import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ message: "API is healthy" });
});

export default router;
