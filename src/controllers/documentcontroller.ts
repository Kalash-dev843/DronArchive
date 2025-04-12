import { Request, Response } from 'express';
import Document from '../models/Document';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import path from 'path';

// Upload document
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, branch, semester, subject } = req.body;

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        if (!title || !branch || !semester || !subject) {
            res.status(400).json({ error: 'Title, branch, semester, and subject are required' });
            return;
        }

        // Get the file info
        const { originalname, mimetype, size, buffer } = req.file;

        // Get the file extension
        const fileExtension = path.extname(originalname);

        // Connect to MongoDB for GridFS
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'documents' });

        // Create a readable stream from the buffer
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);

        // Create a unique filename
        const filename = `${Date.now()}_${originalname}`;

        // Create an upload stream
        const uploadStream = bucket.openUploadStream(filename);

        // Get the file ID
        const fileId = uploadStream.id;

        // Pipe the readable stream to the upload stream
        readableStream.pipe(uploadStream);

        // Create a promise to handle the upload completion
        const uploadPromise = new Promise<void>((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        // Wait for the upload to complete
        await uploadPromise;

        // Create document record in MongoDB
        const document = new Document({
            title,
            description: description || '',
            fileUrl: `/api/documents/${fileId}`,
            fileName: originalname,
            fileSize: size,
            fileType: mimetype,
            branch,
            semester,
            subject,
            uploadedBy: req.user.uid // This comes from the auth middleware
        });

        await document.save();

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: {
                id: document._id,
                title: document.title,
                description: document.description,
                fileName: document.fileName,
                fileSize: document.fileSize,
                fileType: document.fileType,
                branch: document.branch,
                semester: document.semester,
                subject: document.subject,
                downloadUrl: document.fileUrl
            }
        });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

// Get documents by filtering criteria
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { branch, semester, subject, search } = req.query;

        const filter: any = {};

        if (branch) filter.branch = branch;
        if (semester) filter.semester = semester;
        if (subject) filter.subject = subject;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const documents = await Document.find(filter)
            .select('_id title description fileName fileSize fileType branch semester subject downloadCount createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({ documents });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to get documents' });
    }
};

// Download document
export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: 'Invalid document ID' });
            return;
        }

        // Get document from MongoDB
        const document = await Document.findById(id);

        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        // Extract the fileId from the URL
        const fileIdStr = document.fileUrl.split('/').pop();

        if (!fileIdStr) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const fileId = new mongoose.Types.ObjectId(fileIdStr);

        // Connect to MongoDB for GridFS
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'documents' });

        // Create a download stream
        const downloadStream = bucket.openDownloadStream(fileId);

        // Set headers
        res.setHeader('Content-Type', document.fileType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

        // Pipe the download stream to the response
        downloadStream.pipe(res);

        // Update download count
        await Document.findByIdAndUpdate(id, {
            $inc: { downloadCount: 1 },
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Document download error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
};

// Get document branches
export const getBranches = async (req: Request, res: Response): Promise<void> => {
    try {
        const branches = await Document.distinct('branch');
        res.status(200).json({ branches });
    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ error: 'Failed to get branches' });
    }
};

// Get document semesters for a branch
export const getSemesters = async (req: Request, res: Response): Promise<void> => {
    try {
        const { branch } = req.params;

        if (!branch) {
            res.status(400).json({ error: 'Branch parameter is required' });
            return;
        }

        const semesters = await Document.distinct('semester', { branch });
        res.status(200).json({ semesters });
    } catch (error) {
        console.error('Get semesters error:', error);
        res.status(500).json({ error: 'Failed to get semesters' });
    }
};

// Get document subjects for a branch and semester
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const { branch, semester } = req.params;

        if (!branch || !semester) {
            res.status(400).json({ error: 'Branch and semester parameters are required' });
            return;
        }

        const subjects = await Document.distinct('subject', { branch, semester });
        res.status(200).json({ subjects });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ error: 'Failed to get subjects' });
    }
};