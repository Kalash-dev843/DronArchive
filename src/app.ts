import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import connectDB from './config/mongodb';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files from public directory
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'DronArchive API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`DronArchive server running on port ${port}`);
});

export default app;