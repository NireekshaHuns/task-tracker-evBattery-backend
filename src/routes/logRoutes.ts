import { Router } from 'express';
import * as logController from '../controllers/logController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All log routes require authentication
router.use(authenticateJWT);

// Get logs with filtering
router.get('/', logController.getLogs);
router.get('/submitters', logController.getSubmitters);

export default router;