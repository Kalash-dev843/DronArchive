import { Router } from 'express';
import * as authController from '../controllers/authController';
import { verifyToken, isAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/invite', verifyToken, isAdmin, authController.createInvite);
router.get('/invites', verifyToken, isAdmin, authController.getAllInvites);

export default router;