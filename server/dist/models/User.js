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
const userSchema = new mongoose_1.Schema({
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
        verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    },
    trustScore: { type: Number, default: 50 },
    profilePicture: { type: String },
    bio: { type: String },
    emergencyInfo: {
        bloodType: { type: String },
        allergies: { type: [String], default: [] },
        medicalConditions: { type: [String], default: [] },
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('User', userSchema);
