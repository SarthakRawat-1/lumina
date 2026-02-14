import mongoose, { Schema, Document as MongoDocument, Types } from 'mongoose';

export interface IDocument extends MongoDocument {
    name: string;
    data: Buffer;
    userId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
    {
        name: { type: String, required: true, unique: true, index: true },
        data: { type: Buffer, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    },
    {
        timestamps: true,
    }
);

documentSchema.index({ userId: 1, updatedAt: -1 });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
