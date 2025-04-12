import { Request, Response } from 'express';
import { auth } from '../config/firebase';
import User from '../models/User';
import Invite from '../models/Invite';
import { v4 as uuidv4 } from 'uuid';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, displayName, inviteCode } = req.body;

        if (!email || !password || !displayName) {
            res.status(400).json({ error: 'Email, password, and display name are required' });
            return;
        }

        // Check if user is using an invite code (for uploader role)
        let userRole = 'viewer';

        if (inviteCode) {
            const invite = await Invite.findOne({ inviteCode, email, used: false });

            if (!invite || new Date() > invite.expiresAt) {
                res.status(400).json({ error: 'Invalid or expired invite code' });
                return;
            }

            userRole = invite.role;
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName
        });

        // Create user in MongoDB
        const newUser = new User({
            uid: userRecord.uid,
            email,
            displayName,
            role: userRole
        });

        await newUser.save();

        // If invite was used, mark it as used
        if (inviteCode) {
            await Invite.findOneAndUpdate(
                { inviteCode, email },
                { used: true }
            );
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
    // Note: Actual authentication is handled by Firebase on the client side
    // This endpoint would typically verify the token sent from the client
    try {
        const { idToken } = req.body;

        if (!idToken) {
            res.status(400).json({ error: 'ID token is required' });
            return;
        }

        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Get user data from MongoDB
        const user = await User.findOne({ uid });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Create a custom token if needed for additional auth purposes
        const customToken = await auth.createCustomToken(uid);

        res.status(200).json({
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            },
            token: customToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Create an invite
export const createInvite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, role } = req.body;
        const createdBy = req.user.uid; // This comes from the auth middleware

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Check if invite already exists for this email
        const existingInvite = await Invite.findOne({ email, used: false });
        if (existingInvite) {
            res.status(400).json({ error: 'An active invite already exists for this email' });
            return;
        }

        // Generate invite code
        const inviteCode = uuidv4();

        // Set expiration date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invite in database
        const newInvite = new Invite({
            email,
            inviteCode,
            role: role || 'uploader',
            expiresAt,
            createdBy
        });

        await newInvite.save();

        res.status(201).json({
            message: 'Invite created successfully',
            invite: {
                email,
                inviteCode,
                role: newInvite.role,
                expiresAt
            }
        });
    } catch (error) {
        console.error('Create invite error:', error);
        res.status(500).json({ error: 'Failed to create invite' });
    }
};

// Get all invites (admin only)
export const getAllInvites = async (req: Request, res: Response): Promise<void> => {
    try {
        const invites = await Invite.find();
        res.status(200).json({ invites });
    } catch (error) {
        console.error('Get invites error:', error);
        res.status(500).json({ error: 'Failed to get invites' });
    }
};