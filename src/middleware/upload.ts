import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.memoryStorage();

// File filter to restrict to PDFs only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.pdf') {
        return cb(new Error('Only PDF files are allowed'));
    }

    // Check mime type
    if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed'));
    }

    cb(null, true);
};

// Set up file size limit (10MB)
const limits = {
    fileSize: 10 * 1024 * 1024 // 10MB
};

// Create multer middleware
const upload = multer({
    storage,
    fileFilter,
    limits
});

export default upload;