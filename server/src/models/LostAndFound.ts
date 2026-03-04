import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILostAndFound extends Document {
    reporterId: Types.ObjectId;
    type: 'lost' | 'found';
    category: 'pet' | 'electronics' | 'documents' | 'keys' | 'wallet' | 'jewelry' | 'clothing' | 'other';
    title: string;
    description: string;
    photos: string[];
    location: {
        type: 'Point';
        coordinates: number[];
        address?: string;
    };
    dateOccurred: Date;
    status: 'active' | 'resolved' | 'expired';
    contactInfo: {
        phone?: string;
        email?: string;
        preferredMethod: 'phone' | 'email' | 'app_message';
    };
    reward?: {
        offered: boolean;
        amount?: number;
        currency?: string;
    };
    matchedWith?: Types.ObjectId; // Link to matching lost/found item
    claims: Array<{
        userId: Types.ObjectId;
        message: string;
        status: 'pending' | 'approved' | 'rejected';
        createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const lostAndFoundSchema = new Schema<ILostAndFound>(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['lost', 'found'], required: true },
        category: {
            type: String,
            enum: ['pet', 'electronics', 'documents', 'keys', 'wallet', 'jewelry', 'clothing', 'other'],
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        photos: { type: [String], default: [] },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
            address: { type: String },
        },
        dateOccurred: { type: Date, required: true },
        status: {
            type: String,
            enum: ['active', 'resolved', 'expired'],
            default: 'active',
        },
        contactInfo: {
            phone: { type: String },
            email: { type: String },
            preferredMethod: { type: String, enum: ['phone', 'email', 'app_message'], default: 'app_message' },
        },
        reward: {
            offered: { type: Boolean, default: false },
            amount: { type: Number },
            currency: { type: String, default: 'INR' },
        },
        matchedWith: { type: Schema.Types.ObjectId, ref: 'LostAndFound' },
        claims: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                message: { type: String },
                status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

lostAndFoundSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<ILostAndFound>('LostAndFound', lostAndFoundSchema);
