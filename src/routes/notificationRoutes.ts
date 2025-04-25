import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

router.use(authenticateJWT);

router.get("/", notificationController.getNotifications);

router.delete("/clear-all", notificationController.clearAllNotifications);

export default router;
