import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    branch: string;
    semester: string;
    subject: string;
    uploadedBy: string;
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: String, required: true },
    subject: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    downloadCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);