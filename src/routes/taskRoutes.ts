import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Get all tasks (filtered by role - submitters see only their tasks)
router.get('/', taskController.getTasks);

// Create a new task (submitters only)
router.post('/create', requireRole(['submitter']), taskController.createTask);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Update task
router.put('/:id', taskController.updateTask);

// Delete a task
router.delete('/:id', taskController.deleteTask);

export default router;