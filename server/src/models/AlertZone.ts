import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAlertZone extends Document {
    userId: Types.ObjectId;
    name: string;
    type: 'home' | 'work' | 'school' | 'custom';
    location: {
        type: 'Point';
        coordinates: number[];
    };
    radius: number; // meters
    alertSettings: {
        enabled: boolean;
        categories: string[];
        severity: ('low' | 'medium' | 'high' | 'critical')[];
        quietHours?: {
            enabled: boolean;
            start: string; // HH:MM
            end: string;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const alertZoneSchema = new Schema<IAlertZone>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ['home', 'work', 'school', 'custom'],
            default: 'custom',
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
        },
        radius: { type: Number, default: 1000 }, // 1km default
        alertSettings: {
            enabled: { type: Boolean, default: true },
            categories: { type: [String], default: ['crime', 'emergency'] },
            severity: { type: [String], default: ['high', 'critical'] },
            quietHours: {
                enabled: { type: Boolean, default: false },
                start: { type: String },
                end: { type: String },
            },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IAlertZone>('AlertZone', alertZoneSchema);
