import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIncident extends Document {
    reporterId: Types.ObjectId;
    category: 'lighting' | 'roads' | 'animals' | 'crime' | 'other';
    title: string;
    description: string;
    photos: string[];
    location: {
        type: 'Point';
        coordinates: number[]; // [lng, lat]
    };
    status: 'open' | 'in_review' | 'resolved' | 'rejected';
    urgency: 'low' | 'medium' | 'high';
    urgencyScore: number;
    assignedTo?: Types.ObjectId;
    visibility: 'public' | 'private-to-authorities';
    history: Array<{
        action: string;
        by: Types.ObjectId;
        note?: string; // Optional note for the action
        timestamp: Date;
    }>;
    notes: Array<{ // Discussion / Notes
        by: Types.ObjectId;
        text: string;
        isOfficial: boolean; // if true, it's an official progress update
        timestamp: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        category: {
            type: String,
            enum: ['lighting', 'roads', 'animals', 'crime', 'other'],
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        photos: { type: [String], default: [] },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
        },
        status: {
            type: String,
            enum: ['open', 'in_review', 'resolved', 'rejected'],
            default: 'open',
        },
        urgency: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low',
        },
        urgencyScore: { type: Number, default: 0 },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        visibility: {
            type: String,
            enum: ['public', 'private-to-authorities'],
            default: 'public',
        },
        history: [
            {
                action: String,
                by: { type: Schema.Types.ObjectId, ref: 'User' },
                note: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
        notes: [
            {
                by: { type: Schema.Types.ObjectId, ref: 'User' },
                text: String,
                isOfficial: { type: Boolean, default: false },
                timestamp: { type: Date, default: Date.now },
            }
        ],
    },
    { timestamps: true }
);

incidentSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IIncident>('Incident', incidentSchema);
