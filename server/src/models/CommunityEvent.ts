import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommunityEvent extends Document {
    title: string;
    description: string;
    coverImage?: string;
    groupId?: Types.ObjectId;
    organizer: Types.ObjectId;
    location: {
        type: 'Point';
        coordinates: number[];
        address: string;
    };
    startDate: Date;
    endDate: Date;
    category: 'safety_workshop' | 'community_meeting' | 'emergency_drill' | 'social' | 'other';
    maxAttendees?: number;
    attendees: Array<{
        userId: Types.ObjectId;
        status: 'going' | 'interested' | 'not_going';
        registeredAt: Date;
    }>;
    isVirtual: boolean;
    virtualLink?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    createdAt: Date;
    updatedAt: Date;
}

const communityEventSchema = new Schema<ICommunityEvent>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        coverImage: { type: String },
        groupId: { type: Schema.Types.ObjectId, ref: 'CommunityGroup' },
        organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
            address: { type: String },
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        category: {
            type: String,
            enum: ['safety_workshop', 'community_meeting', 'emergency_drill', 'social', 'other'],
            default: 'community_meeting',
        },
        maxAttendees: { type: Number },
        attendees: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                status: { type: String, enum: ['going', 'interested', 'not_going'], default: 'interested' },
                registeredAt: { type: Date, default: Date.now },
            },
        ],
        isVirtual: { type: Boolean, default: false },
        virtualLink: { type: String },
        isRecurring: { type: Boolean, default: false },
        recurringPattern: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<ICommunityEvent>('CommunityEvent', communityEventSchema);
