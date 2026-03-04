import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISafeWalk extends Document {
    userId: Types.ObjectId;
    startLocation: {
        type: 'Point';
        coordinates: number[];
    };
    endLocation: {
        type: 'Point';
        coordinates: number[];
    };
    currentLocation?: {
        type: 'Point';
        coordinates: number[];
    };
    status: 'active' | 'completed' | 'emergency' | 'cancelled';
    expectedArrivalTime: Date;
    actualArrivalTime?: Date;
    trackedBy: Types.ObjectId[]; // Users watching this walk
    checkInInterval: number; // minutes
    lastCheckIn?: Date;
    route: Array<{
        coordinates: number[];
        timestamp: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const safeWalkSchema = new Schema<ISafeWalk>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        startLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        endLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        currentLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number] },
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'emergency', 'cancelled'],
            default: 'active',
        },
        expectedArrivalTime: { type: Date, required: true },
        actualArrivalTime: { type: Date },
        trackedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        checkInInterval: { type: Number, default: 5 },
        lastCheckIn: { type: Date },
        route: [
            {
                coordinates: { type: [Number] },
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

safeWalkSchema.index({ 'startLocation': '2dsphere' });
safeWalkSchema.index({ 'endLocation': '2dsphere' });
safeWalkSchema.index({ 'currentLocation': '2dsphere' });

export default mongoose.model<ISafeWalk>('SafeWalk', safeWalkSchema);
