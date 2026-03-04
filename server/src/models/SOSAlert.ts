import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISOSAlert extends Document {
    userId: Types.ObjectId;
    location: {
        type: 'Point';
        coordinates: number[]; // [lng, lat]
    };
    status: 'active' | 'responded' | 'resolved' | 'cancelled';
    message?: string;
    respondedBy?: Types.ObjectId;
    respondedAt?: Date;
    resolvedAt?: Date;
    notifiedContacts: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const sosAlertSchema = new Schema<ISOSAlert>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
        },
        status: {
            type: String,
            enum: ['active', 'responded', 'resolved', 'cancelled'],
            default: 'active',
        },
        message: { type: String },
        respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        respondedAt: { type: Date },
        resolvedAt: { type: Date },
        notifiedContacts: [{ type: Schema.Types.ObjectId, ref: 'EmergencyContact' }],
    },
    { timestamps: true }
);

export default mongoose.model<ISOSAlert>('SOSAlert', sosAlertSchema);
