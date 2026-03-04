import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmergencyContact extends Document {
    userId: Types.ObjectId;
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const emergencyContactSchema = new Schema<IEmergencyContact>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IEmergencyContact>('EmergencyContact', emergencyContactSchema);
