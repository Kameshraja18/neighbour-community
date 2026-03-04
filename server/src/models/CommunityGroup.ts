import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommunityGroup extends Document {
    name: string;
    description: string;
    coverImage?: string;
    area: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    members: Array<{
        userId: Types.ObjectId;
        role: 'admin' | 'moderator' | 'member';
        joinedAt: Date;
    }>;
    isPrivate: boolean;
    verificationRequired: boolean;
    category: 'neighborhood_watch' | 'community' | 'emergency_response' | 'other';
    settings: {
        allowAnonymousPosts: boolean;
        requireApproval: boolean;
        alertRadius: number; // km
    };
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const communityGroupSchema = new Schema<ICommunityGroup>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        coverImage: { type: String },
        area: {
            type: { type: String, enum: ['Polygon'], default: 'Polygon' },
            coordinates: { type: [[[Number]]], index: '2dsphere' },
        },
        members: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
        isPrivate: { type: Boolean, default: false },
        verificationRequired: { type: Boolean, default: false },
        category: {
            type: String,
            enum: ['neighborhood_watch', 'community', 'emergency_response', 'other'],
            default: 'community',
        },
        settings: {
            allowAnonymousPosts: { type: Boolean, default: false },
            requireApproval: { type: Boolean, default: true },
            alertRadius: { type: Number, default: 5 },
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<ICommunityGroup>('CommunityGroup', communityGroupSchema);
