"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatches = exports.getMyItems = exports.updateItemStatus = exports.respondToClaim = exports.claimItem = exports.getItem = exports.getItems = exports.createItem = void 0;
const LostAndFound_1 = __importDefault(require("../models/LostAndFound"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
// Create lost/found item
const createItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, category, title, description, photos, coordinates, address, dateOccurred, contactInfo, reward } = req.body;
        const item = new LostAndFound_1.default({
            reporterId: userId,
            type,
            category,
            title,
            description,
            photos,
            location: {
                type: 'Point',
                coordinates,
                address,
            },
            dateOccurred,
            contactInfo,
            reward,
        });
        await item.save();
        // Notify nearby users about found items (potential owners)
        if (type === 'found') {
            const nearbyUsers = await User_1.default.find({
                homeLocation: {
                    $near: {
                        $geometry: { type: 'Point', coordinates },
                        $maxDistance: 5000,
                    },
                },
            }).limit(50);
            const notifications = nearbyUsers.map(user => ({
                userId: user._id,
                type: 'lost_found',
                title: `🔍 ${category.charAt(0).toUpperCase() + category.slice(1)} Found Nearby`,
                message: `Someone found a ${category}: "${title}"`,
                priority: 'medium',
                referenceId: item._id,
                referenceType: 'LostAndFound',
                location: item.location,
            }));
            if (notifications.length > 0) {
                await Notification_1.default.insertMany(notifications);
            }
        }
        res.status(201).json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createItem = createItem;
// Get all lost/found items
const getItems = async (req, res) => {
    try {
        const { type, category, status, lat, lng, search } = req.query;
        const query = {};
        if (type)
            query.type = type;
        if (category)
            query.category = category;
        if (status)
            query.status = status;
        else
            query.status = 'active';
        if (search) {
            query.$text = { $search: search };
        }
        let items;
        if (lat && lng) {
            items = await LostAndFound_1.default.find({
                ...query,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)],
                        },
                        $maxDistance: 20000,
                    },
                },
            })
                .populate('reporterId', 'displayName')
                .limit(50);
        }
        else {
            items = await LostAndFound_1.default.find(query)
                .populate('reporterId', 'displayName')
                .sort({ createdAt: -1 })
                .limit(50);
        }
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getItems = getItems;
// Get single item
const getItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await LostAndFound_1.default.findById(itemId)
            .populate('reporterId', 'displayName email')
            .populate('claims.userId', 'displayName');
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getItem = getItem;
// Claim an item
const claimItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user._id;
        const { message } = req.body;
        const item = await LostAndFound_1.default.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        // Check if already claimed by this user
        const existingClaim = item.claims.find(c => c.userId.toString() === userId.toString());
        if (existingClaim) {
            return res.status(400).json({ message: 'You have already claimed this item' });
        }
        item.claims.push({
            userId,
            message,
            status: 'pending',
            createdAt: new Date(),
        });
        await item.save();
        // Notify the reporter
        await Notification_1.default.create({
            userId: item.reporterId,
            type: 'lost_found',
            title: '📋 New Claim',
            message: `Someone has claimed the ${item.type} item: "${item.title}"`,
            priority: 'high',
            referenceId: item._id,
            referenceType: 'LostAndFound',
        });
        res.json({ message: 'Claim submitted', item });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.claimItem = claimItem;
// Respond to claim (for item reporter)
const respondToClaim = async (req, res) => {
    try {
        const { itemId, claimId } = req.params;
        const userId = req.user._id;
        const { status } = req.body; // 'approved' or 'rejected'
        const item = await LostAndFound_1.default.findOne({ _id: itemId, reporterId: userId });
        if (!item) {
            return res.status(404).json({ message: 'Item not found or unauthorized' });
        }
        const claim = item.claims.find((c) => c._id?.toString() === claimId);
        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }
        claim.status = status;
        if (status === 'approved') {
            item.status = 'resolved';
        }
        await item.save();
        // Notify the claimant
        await Notification_1.default.create({
            userId: claim.userId,
            type: 'lost_found',
            title: status === 'approved' ? '✅ Claim Approved!' : '❌ Claim Rejected',
            message: status === 'approved'
                ? `Your claim for "${item.title}" has been approved!`
                : `Your claim for "${item.title}" was rejected.`,
            priority: status === 'approved' ? 'high' : 'medium',
            referenceId: item._id,
            referenceType: 'LostAndFound',
        });
        res.json({ message: `Claim ${status}`, item });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.respondToClaim = respondToClaim;
// Update item status
const updateItemStatus = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user._id;
        const { status } = req.body;
        const item = await LostAndFound_1.default.findOneAndUpdate({ _id: itemId, reporterId: userId }, { status }, { new: true });
        if (!item) {
            return res.status(404).json({ message: 'Item not found or unauthorized' });
        }
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateItemStatus = updateItemStatus;
// Get my items
const getMyItems = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query;
        const query = { reporterId: userId };
        if (type)
            query.type = type;
        const items = await LostAndFound_1.default.find(query).sort({ createdAt: -1 });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMyItems = getMyItems;
// Find potential matches
const findMatches = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await LostAndFound_1.default.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        // Find opposite type (if lost, find found items; vice versa)
        const oppositeType = item.type === 'lost' ? 'found' : 'lost';
        const matches = await LostAndFound_1.default.find({
            type: oppositeType,
            category: item.category,
            status: 'active',
            location: {
                $near: {
                    $geometry: item.location,
                    $maxDistance: 10000, // 10km
                },
            },
            dateOccurred: {
                $gte: new Date(item.dateOccurred.getTime() - 7 * 24 * 60 * 60 * 1000),
                $lte: new Date(item.dateOccurred.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
        })
            .populate('reporterId', 'displayName')
            .limit(10);
        res.json(matches);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.findMatches = findMatches;
