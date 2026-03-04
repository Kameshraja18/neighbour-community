"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveWalk = exports.getWalkDetails = exports.getMyWalks = exports.cancelSafeWalk = exports.triggerWalkEmergency = exports.completeSafeWalk = exports.checkIn = exports.updateWalkLocation = exports.startSafeWalk = void 0;
const SafeWalk_1 = __importDefault(require("../models/SafeWalk"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
// Start a safe walk
const startSafeWalk = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startCoordinates, endCoordinates, expectedMinutes, trackedBy, checkInInterval } = req.body;
        const expectedArrivalTime = new Date(Date.now() + expectedMinutes * 60 * 1000);
        const safeWalk = new SafeWalk_1.default({
            userId,
            startLocation: {
                type: 'Point',
                coordinates: startCoordinates,
            },
            endLocation: {
                type: 'Point',
                coordinates: endCoordinates,
            },
            currentLocation: {
                type: 'Point',
                coordinates: startCoordinates,
            },
            expectedArrivalTime,
            trackedBy: trackedBy || [],
            checkInInterval: checkInInterval || 5,
            lastCheckIn: new Date(),
            route: [{ coordinates: startCoordinates, timestamp: new Date() }],
        });
        await safeWalk.save();
        // Notify trackers
        if (trackedBy && trackedBy.length > 0) {
            const notifications = trackedBy.map((trackerId) => ({
                userId: trackerId,
                type: 'safe_walk',
                title: '👟 Safe Walk Started',
                message: 'Someone you care about has started a safe walk. You can track their progress.',
                priority: 'medium',
                referenceId: safeWalk._id,
                referenceType: 'SafeWalk',
            }));
            await Notification_1.default.insertMany(notifications);
        }
        res.status(201).json(safeWalk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.startSafeWalk = startSafeWalk;
// Update location during walk
const updateWalkLocation = async (req, res) => {
    try {
        const { walkId } = req.params;
        const userId = req.user._id;
        const { coordinates } = req.body;
        const safeWalk = await SafeWalk_1.default.findOneAndUpdate({ _id: walkId, userId, status: 'active' }, {
            'currentLocation.coordinates': coordinates,
            lastCheckIn: new Date(),
            $push: {
                route: { coordinates, timestamp: new Date() },
            },
        }, { new: true });
        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }
        // Emit real-time location update
        const io = req.app.get('socketio');
        if (io) {
            io.emit(`safe_walk_${walkId}`, {
                coordinates,
                timestamp: new Date(),
            });
        }
        res.json(safeWalk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateWalkLocation = updateWalkLocation;
// Check in during walk
const checkIn = async (req, res) => {
    try {
        const { walkId } = req.params;
        const userId = req.user._id;
        const safeWalk = await SafeWalk_1.default.findOneAndUpdate({ _id: walkId, userId, status: 'active' }, { lastCheckIn: new Date() }, { new: true });
        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }
        res.json({ message: 'Check-in successful', lastCheckIn: safeWalk.lastCheckIn });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.checkIn = checkIn;
// Complete safe walk
const completeSafeWalk = async (req, res) => {
    try {
        const { walkId } = req.params;
        const userId = req.user._id;
        const safeWalk = await SafeWalk_1.default.findOneAndUpdate({ _id: walkId, userId, status: 'active' }, {
            status: 'completed',
            actualArrivalTime: new Date(),
        }, { new: true });
        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }
        // Notify trackers
        if (safeWalk.trackedBy.length > 0) {
            const notifications = safeWalk.trackedBy.map((trackerId) => ({
                userId: trackerId,
                type: 'safe_walk',
                title: '✅ Arrived Safely',
                message: 'Your friend has arrived at their destination safely!',
                priority: 'low',
                referenceId: safeWalk._id,
                referenceType: 'SafeWalk',
            }));
            await Notification_1.default.insertMany(notifications);
        }
        res.json(safeWalk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.completeSafeWalk = completeSafeWalk;
// Trigger emergency during walk
const triggerWalkEmergency = async (req, res) => {
    try {
        const { walkId } = req.params;
        const userId = req.user._id;
        const safeWalk = await SafeWalk_1.default.findOneAndUpdate({ _id: walkId, userId, status: 'active' }, { status: 'emergency' }, { new: true }).populate('userId', 'displayName email phone');
        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }
        // Notify all trackers with critical priority
        if (safeWalk.trackedBy.length > 0) {
            const notifications = safeWalk.trackedBy.map((trackerId) => ({
                userId: trackerId,
                type: 'safe_walk',
                title: '🚨 EMERGENCY - Safe Walk Alert',
                message: 'Your friend has triggered an emergency during their walk!',
                priority: 'critical',
                referenceId: safeWalk._id,
                referenceType: 'SafeWalk',
                location: safeWalk.currentLocation,
            }));
            await Notification_1.default.insertMany(notifications);
        }
        // Notify nearby authorities
        const nearbyAuthorities = await User_1.default.find({
            role: { $in: ['moderator', 'authority_admin'] },
            homeLocation: {
                $near: {
                    $geometry: safeWalk.currentLocation,
                    $maxDistance: 3000,
                },
            },
        });
        const authorityNotifications = nearbyAuthorities.map((auth) => ({
            userId: auth._id,
            type: 'safe_walk',
            title: '🚨 Safe Walk Emergency',
            message: 'A community member has triggered an emergency during their walk.',
            priority: 'critical',
            referenceId: safeWalk._id,
            referenceType: 'SafeWalk',
            location: safeWalk.currentLocation,
        }));
        if (authorityNotifications.length > 0) {
            await Notification_1.default.insertMany(authorityNotifications);
        }
        // Emit real-time emergency
        const io = req.app.get('socketio');
        if (io) {
            io.emit('safe_walk_emergency', {
                walkId: safeWalk._id,
                location: safeWalk.currentLocation,
                user: safeWalk.userId,
            });
        }
        res.json(safeWalk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.triggerWalkEmergency = triggerWalkEmergency;
// Cancel safe walk
const cancelSafeWalk = async (req, res) => {
    try {
        const { walkId } = req.params;
        const userId = req.user._id;
        const safeWalk = await SafeWalk_1.default.findOneAndUpdate({ _id: walkId, userId, status: 'active' }, { status: 'cancelled' }, { new: true });
        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }
        res.json({ message: 'Walk cancelled', safeWalk });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.cancelSafeWalk = cancelSafeWalk;
// Get user's walks history
const getMyWalks = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;
        const query = { userId };
        if (status)
            query.status = status;
        const walks = await SafeWalk_1.default.find(query)
            .populate('trackedBy', 'displayName')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(walks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMyWalks = getMyWalks;
// Get walk details (for trackers)
const getWalkDetails = async (req, res) => {
    try {
        const { walkId } = req.params;
        const userId = req.user._id;
        const walk = await SafeWalk_1.default.findOne({
            _id: walkId,
            $or: [{ userId }, { trackedBy: userId }],
        }).populate('userId', 'displayName email phone');
        if (!walk) {
            return res.status(404).json({ message: 'Walk not found or unauthorized' });
        }
        res.json(walk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getWalkDetails = getWalkDetails;
// Get active walk
const getActiveWalk = async (req, res) => {
    try {
        const userId = req.user._id;
        const activeWalk = await SafeWalk_1.default.findOne({
            userId,
            status: 'active',
        });
        res.json(activeWalk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getActiveWalk = getActiveWalk;
