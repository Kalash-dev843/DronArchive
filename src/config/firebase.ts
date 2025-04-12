import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Parse the private key correctly
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing Firebase credentials in environment variables');
}

// Initialize Firebase Admin SDK
const firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const auth = admin.auth();
export const firestore = admin.firestore();

export default firebaseApp;

