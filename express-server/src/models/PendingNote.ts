import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IPendingNote extends MongoDocument {
    documentId: string;
    content: string;
    title: string;
    sourceType: string;
    sourceId?: string;
    userId?: string;
    createdAt: Date;
    expiresAt: Date;
}

const pendingNoteSchema = new Schema<IPendingNote>(
    {
        documentId: { type: String, required: true, unique: true, index: true },
        content: { type: String, required: true },
        title: { type: String, required: true },
        sourceType: { type: String, required: true, enum: ['video', 'course', 'manual'] },
        sourceId: { type: String },
        userId: { type: String },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
            index: { expireAfterSeconds: 0 }
        }
    },
    {
        timestamps: true,
    }
);

export const PendingNoteModel = mongoose.model<IPendingNote>('PendingNote', pendingNoteSchema);
