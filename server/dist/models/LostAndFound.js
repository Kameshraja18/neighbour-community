"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const lostAndFoundSchema = new mongoose_1.Schema({
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
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
    matchedWith: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LostAndFound' },
    claims: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            message: { type: String },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            createdAt: { type: Date, default: Date.now },
        },
    ],
}, { timestamps: true });
lostAndFoundSchema.index({ title: 'text', description: 'text' });
exports.default = mongoose_1.default.model('LostAndFound', lostAndFoundSchema);
