import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import User from '../models/User';

// Add user property to Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email: string;
                role: string;
            };
        }
    }
}

// Verify Firebase Authentication token
export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - No token provided' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await auth.verifyIdToken(token);
            const uid = decodedToken.uid;

            // Get user data from MongoDB
            const user = await User.findOne({ uid });

            if (!user) {
                res.status(401).json({ error: 'Unauthorized - User not found' });
                return;
            }

            // Add user data to request object
            req.user = {
                uid: user.uid,
                email: user.email,
                role: user.role
            };

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Unauthorized - Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Check if user has uploader role
export const isUploader = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized - User not authenticated' });
        return;
    }

    if (req.user.role === 'uploader' || req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
};

// Check if user has admin role
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized - User not authenticated' });
        return;
    }

    if (req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
};