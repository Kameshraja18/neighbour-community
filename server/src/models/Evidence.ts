import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEvidence extends Document {
    incidentId: Types.ObjectId;
    uploaderId: Types.ObjectId;
    type: 'photo' | 'video' | 'audio' | 'document';
    fileUrl: string;
    thumbnailUrl?: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    duration?: number; // For audio/video in seconds
    metadata: {
        capturedAt?: Date;
        deviceInfo?: string;
        location?: {
            type: 'Point';
            coordinates: number[];
        };
    };
    isAnonymous: boolean;
    verificationStatus: 'pending' | 'verified' | 'flagged' | 'rejected';
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const evidenceSchema = new Schema<IEvidence>(
    {
        incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', required: true },
        uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: ['photo', 'video', 'audio', 'document'],
            required: true,
        },
        fileUrl: { type: String, required: true },
        thumbnailUrl: { type: String },
        originalFilename: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        duration: { type: Number },
        metadata: {
            capturedAt: { type: Date },
            deviceInfo: { type: String },
            location: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number] },
            },
        },
        isAnonymous: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'flagged', 'rejected'],
            default: 'pending',
        },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },
        description: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IEvidence>('Evidence', evidenceSchema);
