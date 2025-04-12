import mongoose, { Document, Schema } from 'mongoose';

export interface IInvite extends Document {
    email: string;
    inviteCode: string;
    role: 'uploader' | 'admin';
    expiresAt: Date;
    used: boolean;
    createdBy: string;
    createdAt: Date;
}

const InviteSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    inviteCode: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ['uploader', 'admin'],
        default: 'uploader'
    },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IInvite>('Invite', InviteSchema);