import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWatchArea extends Document {
    userId: Types.ObjectId;
    name: string;
    center: {
        type: 'Point';
        coordinates: number[]; // [lng, lat]
    };
    radiusMeters: number;
    categories: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const watchAreaSchema = new Schema<IWatchArea>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        center: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
        },
        radiusMeters: { type: Number, required: true },
        categories: { type: [String], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IWatchArea>('WatchArea', watchAreaSchema);
