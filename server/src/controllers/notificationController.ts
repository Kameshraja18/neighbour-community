import { Request, Response } from 'express';
import Notification from '../models/Notification';
import AlertZone from '../models/AlertZone';

// === NOTIFICATIONS ===

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { unreadOnly, type, limit = 50 } = req.query;

        const query: any = { userId };
        if (unreadOnly === 'true') query.isRead = false;
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string));

        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = (req as any).user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = (req as any).user._id;

        await Notification.findOneAndDelete({ _id: notificationId, userId });
        res.json({ message: 'Notification deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Clear all notifications
export const clearAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        await Notification.deleteMany({ userId });
        res.json({ message: 'All notifications cleared' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// === ALERT ZONES ===

// Get user's alert zones
export const getAlertZones = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const zones = await AlertZone.find({ userId });
        res.json(zones);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create alert zone
export const createAlertZone = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { name, type, coordinates, radius, alertSettings } = req.body;

        const zone = new AlertZone({
            userId,
            name,
            type,
            location: {
                type: 'Point',
                coordinates,
            },
            radius,
            alertSettings,
        });

        await zone.save();
        res.status(201).json(zone);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update alert zone
export const updateAlertZone = async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const userId = (req as any).user._id;
        const updates = req.body;

        if (updates.coordinates) {
            updates.location = {
                type: 'Point',
                coordinates: updates.coordinates,
            };
            delete updates.coordinates;
        }

        const zone = await AlertZone.findOneAndUpdate(
            { _id: zoneId, userId },
            updates,
            { new: true }
        );

        if (!zone) {
            return res.status(404).json({ message: 'Alert zone not found' });
        }

        res.json(zone);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete alert zone
export const deleteAlertZone = async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const userId = (req as any).user._id;

        const zone = await AlertZone.findOneAndDelete({ _id: zoneId, userId });

        if (!zone) {
            return res.status(404).json({ message: 'Alert zone not found' });
        }

        res.json({ message: 'Alert zone deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle alert zone
export const toggleAlertZone = async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const userId = (req as any).user._id;

        const zone = await AlertZone.findOne({ _id: zoneId, userId });
        if (!zone) {
            return res.status(404).json({ message: 'Alert zone not found' });
        }

        zone.alertSettings.enabled = !zone.alertSettings.enabled;
        await zone.save();

        res.json(zone);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
