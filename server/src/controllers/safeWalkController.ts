import { Request, Response } from 'express';
import SafeWalk from '../models/SafeWalk';
import Notification from '../models/Notification';
import User from '../models/User';

// Start a safe walk
export const startSafeWalk = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { startCoordinates, endCoordinates, expectedMinutes, trackedBy, checkInInterval } = req.body;

        const expectedArrivalTime = new Date(Date.now() + expectedMinutes * 60 * 1000);

        const safeWalk = new SafeWalk({
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
            const notifications = trackedBy.map((trackerId: string) => ({
                userId: trackerId,
                type: 'safe_walk',
                title: '👟 Safe Walk Started',
                message: 'Someone you care about has started a safe walk. You can track their progress.',
                priority: 'medium',
                referenceId: safeWalk._id,
                referenceType: 'SafeWalk',
            }));
            await Notification.insertMany(notifications);
        }

        res.status(201).json(safeWalk);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update location during walk
export const updateWalkLocation = async (req: Request, res: Response) => {
    try {
        const { walkId } = req.params;
        const userId = (req as any).user._id;
        const { coordinates } = req.body;

        const safeWalk = await SafeWalk.findOneAndUpdate(
            { _id: walkId, userId, status: 'active' },
            {
                'currentLocation.coordinates': coordinates,
                lastCheckIn: new Date(),
                $push: {
                    route: { coordinates, timestamp: new Date() },
                },
            },
            { new: true }
        );

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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Check in during walk
export const checkIn = async (req: Request, res: Response) => {
    try {
        const { walkId } = req.params;
        const userId = (req as any).user._id;

        const safeWalk = await SafeWalk.findOneAndUpdate(
            { _id: walkId, userId, status: 'active' },
            { lastCheckIn: new Date() },
            { new: true }
        );

        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }

        res.json({ message: 'Check-in successful', lastCheckIn: safeWalk.lastCheckIn });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Complete safe walk
export const completeSafeWalk = async (req: Request, res: Response) => {
    try {
        const { walkId } = req.params;
        const userId = (req as any).user._id;

        const safeWalk = await SafeWalk.findOneAndUpdate(
            { _id: walkId, userId, status: 'active' },
            {
                status: 'completed',
                actualArrivalTime: new Date(),
            },
            { new: true }
        );

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
            await Notification.insertMany(notifications);
        }

        res.json(safeWalk);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Trigger emergency during walk
export const triggerWalkEmergency = async (req: Request, res: Response) => {
    try {
        const { walkId } = req.params;
        const userId = (req as any).user._id;

        const safeWalk = await SafeWalk.findOneAndUpdate(
            { _id: walkId, userId, status: 'active' },
            { status: 'emergency' },
            { new: true }
        ).populate('userId', 'displayName email phone');

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
            await Notification.insertMany(notifications);
        }

        // Notify nearby authorities
        const nearbyAuthorities = await User.find({
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
            await Notification.insertMany(authorityNotifications);
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel safe walk
export const cancelSafeWalk = async (req: Request, res: Response) => {
    try {
        const { walkId } = req.params;
        const userId = (req as any).user._id;

        const safeWalk = await SafeWalk.findOneAndUpdate(
            { _id: walkId, userId, status: 'active' },
            { status: 'cancelled' },
            { new: true }
        );

        if (!safeWalk) {
            return res.status(404).json({ message: 'Active walk not found' });
        }

        res.json({ message: 'Walk cancelled', safeWalk });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get user's walks history
export const getMyWalks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { status } = req.query;

        const query: any = { userId };
        if (status) query.status = status;

        const walks = await SafeWalk.find(query)
            .populate('trackedBy', 'displayName')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(walks);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get walk details (for trackers)
export const getWalkDetails = async (req: Request, res: Response) => {
    try {
        const { walkId } = req.params;
        const userId = (req as any).user._id;

        const walk = await SafeWalk.findOne({
            _id: walkId,
            $or: [{ userId }, { trackedBy: userId }],
        }).populate('userId', 'displayName email phone');

        if (!walk) {
            return res.status(404).json({ message: 'Walk not found or unauthorized' });
        }

        res.json(walk);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get active walk
export const getActiveWalk = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        const activeWalk = await SafeWalk.findOne({
            userId,
            status: 'active',
        });

        res.json(activeWalk);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
