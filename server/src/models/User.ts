import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
    displayName: string;
    email: string;
    passwordHash: string;
    role: 'citizen' | 'moderator' | 'authority_admin' | 'super_admin';
    phone?: string;
    homeLocation?: {
        type: 'Point';
        coordinates: number[]; // [lng, lat]
    };
    notificationPrefs: {
        push: boolean;
        email: boolean;
        categories: string[];
    };
    isVerified: boolean;
    verificationBadge?: {
        type: 'resident' | 'business' | 'authority';
        verifiedAt: Date;
        verifiedBy?: Types.ObjectId;
    };
    trustScore: number;
    profilePicture?: string;
    bio?: string;
    emergencyInfo?: {
        bloodType?: string;
        allergies?: string[];
        medicalConditions?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        displayName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ['citizen', 'moderator', 'authority_admin', 'super_admin'],
            default: 'citizen',
        },
        phone: { type: String },
        homeLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
        },
        notificationPrefs: {
            push: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            categories: { type: [String], default: [] },
        },
        isVerified: { type: Boolean, default: false },
        verificationBadge: {
            type: { type: String, enum: ['resident', 'business', 'authority'] },
            verifiedAt: { type: Date },
            verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
        trustScore: { type: Number, default: 50 },
        profilePicture: { type: String },
        bio: { type: String },
        emergencyInfo: {
            bloodType: { type: String },
            allergies: { type: [String], default: [] },
            medicalConditions: { type: [String], default: [] },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
