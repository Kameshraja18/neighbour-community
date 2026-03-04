import mongoose, { Document, Schema } from 'mongoose';

export interface ISafetyScore extends Document {
    location: {
        type: 'Point';
        coordinates: number[];
    };
    gridId: string; // Unique grid cell identifier
    score: number; // 0-100
    breakdown: {
        crimeRate: number;
        lighting: number;
        responseTime: number;
        communityEngagement: number;
        recentIncidents: number;
    };
    incidentCounts: {
        crime: number;
        lighting: number;
        roads: number;
        animals: number;
        other: number;
    };
    timeBasedScores: {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
    };
    lastCalculated: Date;
    trend: 'improving' | 'stable' | 'declining';
    createdAt: Date;
    updatedAt: Date;
}

const safetyScoreSchema = new Schema<ISafetyScore>(
    {
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
        },
        gridId: { type: String, required: true, unique: true },
        score: { type: Number, required: true, min: 0, max: 100 },
        breakdown: {
            crimeRate: { type: Number, default: 0 },
            lighting: { type: Number, default: 0 },
            responseTime: { type: Number, default: 0 },
            communityEngagement: { type: Number, default: 0 },
            recentIncidents: { type: Number, default: 0 },
        },
        incidentCounts: {
            crime: { type: Number, default: 0 },
            lighting: { type: Number, default: 0 },
            roads: { type: Number, default: 0 },
            animals: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
        timeBasedScores: {
            morning: { type: Number, default: 100 },
            afternoon: { type: Number, default: 100 },
            evening: { type: Number, default: 100 },
            night: { type: Number, default: 100 },
        },
        lastCalculated: { type: Date, default: Date.now },
        trend: {
            type: String,
            enum: ['improving', 'stable', 'declining'],
            default: 'stable',
        },
    },
    { timestamps: true }
);

export default mongoose.model<ISafetyScore>('SafetyScore', safetyScoreSchema);
