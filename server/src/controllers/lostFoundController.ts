import { Request, Response } from 'express';
import LostAndFound from '../models/LostAndFound';
import Notification from '../models/Notification';
import User from '../models/User';

// Create lost/found item
export const createItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const {
            type, category, title, description, photos, coordinates, address,
            dateOccurred, contactInfo, reward
        } = req.body;

        const item = new LostAndFound({
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
            const nearbyUsers = await User.find({
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
                await Notification.insertMany(notifications);
            }
        }

        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get all lost/found items
export const getItems = async (req: Request, res: Response) => {
    try {
        const { type, category, status, lat, lng, search } = req.query;
        const query: any = {};

        if (type) query.type = type;
        if (category) query.category = category;
        if (status) query.status = status;
        else query.status = 'active';

        if (search) {
            query.$text = { $search: search as string };
        }

        let items;
        if (lat && lng) {
            items = await LostAndFound.find({
                ...query,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
                        },
                        $maxDistance: 20000,
                    },
                },
            })
                .populate('reporterId', 'displayName')
                .limit(50);
        } else {
            items = await LostAndFound.find(query)
                .populate('reporterId', 'displayName')
                .sort({ createdAt: -1 })
                .limit(50);
        }

        res.json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single item
export const getItem = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const item = await LostAndFound.findById(itemId)
            .populate('reporterId', 'displayName email')
            .populate('claims.userId', 'displayName');

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Claim an item
export const claimItem = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const userId = (req as any).user._id;
        const { message } = req.body;

        const item = await LostAndFound.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if already claimed by this user
        const existingClaim = item.claims.find(
            c => c.userId.toString() === userId.toString()
        );
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
        await Notification.create({
            userId: item.reporterId,
            type: 'lost_found',
            title: '📋 New Claim',
            message: `Someone has claimed the ${item.type} item: "${item.title}"`,
            priority: 'high',
            referenceId: item._id,
            referenceType: 'LostAndFound',
        });

        res.json({ message: 'Claim submitted', item });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Respond to claim (for item reporter)
export const respondToClaim = async (req: Request, res: Response) => {
    try {
        const { itemId, claimId } = req.params;
        const userId = (req as any).user._id;
        const { status } = req.body; // 'approved' or 'rejected'

        const item = await LostAndFound.findOne({ _id: itemId, reporterId: userId });
        if (!item) {
            return res.status(404).json({ message: 'Item not found or unauthorized' });
        }

        const claim = item.claims.find((c: any) => c._id?.toString() === claimId);
        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        claim.status = status;

        if (status === 'approved') {
            item.status = 'resolved';
        }

        await item.save();

        // Notify the claimant
        await Notification.create({
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update item status
export const updateItemStatus = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const userId = (req as any).user._id;
        const { status } = req.body;

        const item = await LostAndFound.findOneAndUpdate(
            { _id: itemId, reporterId: userId },
            { status },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found or unauthorized' });
        }

        res.json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get my items
export const getMyItems = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { type } = req.query;

        const query: any = { reporterId: userId };
        if (type) query.type = type;

        const items = await LostAndFound.find(query).sort({ createdAt: -1 });
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Find potential matches
export const findMatches = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;

        const item = await LostAndFound.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Find opposite type (if lost, find found items; vice versa)
        const oppositeType = item.type === 'lost' ? 'found' : 'lost';

        const matches = await LostAndFound.find({
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
