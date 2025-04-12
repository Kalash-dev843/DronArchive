import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    uid: string;
    email: string;
    displayName: string;
    role: 'viewer' | 'uploader' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    role: {
        type: String,
        enum: ['viewer', 'uploader', 'admin'],
        default: 'viewer'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);