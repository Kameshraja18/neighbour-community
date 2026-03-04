"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAreaStats = exports.getSafetyTrends = exports.getHeatmapData = exports.getSafetyScore = void 0;
const SafetyScore_1 = __importDefault(require("../models/SafetyScore"));
const Incident_1 = __importDefault(require("../models/Incident"));
// Get safety score for a location
const getSafetyScore = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude required' });
        }
        const coordinates = [parseFloat(lng), parseFloat(lat)];
        // Find nearest safety score
        const score = await SafetyScore_1.default.findOne({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: 1000, // 1km
                },
            },
        });
        if (score) {
            return res.json(score);
        }
        // Calculate safety score if not found
        const calculatedScore = await calculateSafetyScore(coordinates);
        res.json(calculatedScore);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSafetyScore = getSafetyScore;
// Get heatmap data for an area
const getHeatmapData = async (req, res) => {
    try {
        const { swLat, swLng, neLat, neLng, timeRange } = req.query;
        if (!swLat || !swLng || !neLat || !neLng) {
            return res.status(400).json({ message: 'Bounding box coordinates required' });
        }
        // Time filter
        const timeFilter = {};
        const now = new Date();
        if (timeRange === 'week') {
            timeFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        }
        else if (timeRange === 'month') {
            timeFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        }
        else if (timeRange === 'year') {
            timeFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        }
        // Get incidents in the bounding box
        const incidents = await Incident_1.default.find({
            ...timeFilter,
            location: {
                $geoWithin: {
                    $box: [
                        [parseFloat(swLng), parseFloat(swLat)],
                        [parseFloat(neLng), parseFloat(neLat)],
                    ],
                },
            },
        }).select('location category urgency');
        // Transform to heatmap format
        const heatmapData = incidents.map(inc => ({
            lat: inc.location.coordinates[1],
            lng: inc.location.coordinates[0],
            intensity: inc.urgency === 'high' ? 1 : inc.urgency === 'medium' ? 0.6 : 0.3,
            category: inc.category,
        }));
        res.json(heatmapData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getHeatmapData = getHeatmapData;
// Get safety trends for an area
const getSafetyTrends = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude required' });
        }
        const coordinates = [parseFloat(lng), parseFloat(lat)];
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Get incidents in the area for different time periods
        const baseQuery = {
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: parseInt(radius),
                },
            },
        };
        const [thisWeek, lastMonth, byCategory, byHour] = await Promise.all([
            Incident_1.default.countDocuments({
                ...baseQuery,
                createdAt: { $gte: weekAgo },
            }),
            Incident_1.default.countDocuments({
                ...baseQuery,
                createdAt: { $gte: monthAgo },
            }),
            Incident_1.default.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthAgo },
                        'location.coordinates': {
                            $geoWithin: {
                                $centerSphere: [coordinates, parseInt(radius) / 6378100],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                    },
                },
            ]),
            Incident_1.default.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthAgo },
                        'location.coordinates': {
                            $geoWithin: {
                                $centerSphere: [coordinates, parseInt(radius) / 6378100],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: { $hour: '$createdAt' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);
        // Calculate trend
        const avgLastMonth = lastMonth / 4; // Weekly average for last month
        let trend = 'stable';
        if (thisWeek > avgLastMonth * 1.2)
            trend = 'increasing';
        else if (thisWeek < avgLastMonth * 0.8)
            trend = 'decreasing';
        res.json({
            thisWeek,
            lastMonth,
            trend,
            byCategory: byCategory.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            byHour: byHour.map((h) => ({ hour: h._id, count: h.count })),
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSafetyTrends = getSafetyTrends;
// Get area statistics
const getAreaStats = async (req, res) => {
    try {
        const { lat, lng, radius = 2000 } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude required' });
        }
        const coordinates = [parseFloat(lng), parseFloat(lat)];
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const stats = await Incident_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthAgo },
                    'location.coordinates': {
                        $geoWithin: {
                            $centerSphere: [coordinates, parseInt(radius) / 6378100],
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
                    },
                    open: {
                        $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] },
                    },
                    highUrgency: {
                        $sum: { $cond: [{ $eq: ['$urgency', 'high'] }, 1, 0] },
                    },
                    avgResponseTime: { $avg: '$urgencyScore' },
                },
            },
        ]);
        const result = stats[0] || {
            total: 0,
            resolved: 0,
            open: 0,
            highUrgency: 0,
            avgResponseTime: 0,
        };
        res.json({
            ...result,
            resolutionRate: result.total > 0 ? (result.resolved / result.total) * 100 : 100,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAreaStats = getAreaStats;
// Helper function to calculate safety score
async function calculateSafetyScore(coordinates) {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // Get incidents in the area
    const incidents = await Incident_1.default.find({
        createdAt: { $gte: monthAgo },
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates },
                $maxDistance: 1000,
            },
        },
    });
    // Calculate base score
    let score = 100;
    const incidentDeductions = {
        crime: 15,
        lighting: 5,
        roads: 3,
        animals: 2,
        other: 2,
    };
    const urgencyMultipliers = {
        high: 1.5,
        medium: 1,
        low: 0.5,
    };
    const incidentCounts = {
        crime: 0,
        lighting: 0,
        roads: 0,
        animals: 0,
        other: 0,
    };
    incidents.forEach(inc => {
        const deduction = incidentDeductions[inc.category] || 2;
        const multiplier = urgencyMultipliers[inc.urgency] || 1;
        score -= deduction * multiplier;
        incidentCounts[inc.category]++;
    });
    score = Math.max(0, Math.min(100, score));
    return {
        location: { type: 'Point', coordinates },
        score: Math.round(score),
        breakdown: {
            crimeRate: Math.round(100 - incidentCounts.crime * 15),
            lighting: Math.round(100 - incidentCounts.lighting * 10),
            responseTime: 85, // Placeholder
            communityEngagement: 75, // Placeholder
            recentIncidents: Math.round(100 - incidents.length * 5),
        },
        incidentCounts,
        trend: score > 80 ? 'stable' : score > 60 ? 'stable' : 'declining',
        lastCalculated: new Date(),
    };
}
