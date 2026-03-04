import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
    userId: Types.ObjectId;
    type: 'incident' | 'sos' | 'safe_walk' | 'community' | 'event' | 'lost_found' | 'system';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    referenceId?: Types.ObjectId;
    referenceType?: string;
    location?: {
        type: 'Point';
        coordinates: number[];
    };
    isRead: boolean;
    readAt?: Date;
    actionUrl?: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: ['incident', 'sos', 'safe_walk', 'community', 'event', 'lost_found', 'system'],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        referenceId: { type: Schema.Types.ObjectId },
        referenceType: { type: String },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
        },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
        actionUrl: { type: String },
        expiresAt: { type: Date },
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
