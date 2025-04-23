import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes); 

router.get("/health", (_req: Request, res: Response) => {
    res.json({ message: "API is healthy" });
  });

router.get("/test", (_, res) => {
  console.log("✅ /test route hit");
  res.json({ status: "ok" });
});  

export default router;
