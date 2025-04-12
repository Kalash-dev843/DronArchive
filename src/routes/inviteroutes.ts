import { Router } from 'express';
import * as InviteController from '../controllers/inviteController';
import { authenticateUser, isAdmin } from '../middleware/auth';

const router = Router();

// Route to check if an invite is valid (public)
router.get('/validate/:code', InviteController.validateInvite);

// Routes for authenticated users
router.post('/accept/:code', authenticateUser, InviteController.acceptInvite);

// Admin-only routes
router.post('/', authenticateUser, isAdmin, InviteController.createInvite);
router.get('/', authenticateUser, isAdmin, InviteController.getAllInvites);
router.delete('/:id', authenticateUser, isAdmin, InviteController.deleteInvite);
router.post('/resend/:id', authenticateUser, isAdmin, InviteController.resendInvite);

export default router;

