import { Router} from "express";
import { login } from "../controllers/authController";

const router = Router();

// POST /api/auth/login — handles login logic
router.post("/login", login);

export default router;
