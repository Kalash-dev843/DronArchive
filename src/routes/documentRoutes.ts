import { Router } from 'express';
import * as documentController from '../controllers/documentController';
import { verifyToken, isUploader } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public routes (require authentication but not special role)
router.get('/', verifyToken, documentController.getDocuments);
router.get('/branches', verifyToken, documentController.getBranches);
router.get('/semesters/:branch', verifyToken, documentController.getSemesters);
router.get('/subjects/:branch/:semester', verifyToken, documentController.getSubjects);
router.get('/:id', verifyToken, documentController.downloadDocument);

// Protected routes (require uploader role)
router.post('/', verifyToken, isUploader, upload.single('file'), documentController.uploadDocument);

export default router;