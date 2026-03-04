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
const safetyScoreSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.default = mongoose_1.default.model('SafetyScore', safetyScoreSchema);
