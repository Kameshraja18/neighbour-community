import { Request, Response } from 'express';
import SOSAlert from '../models/SOSAlert';
import EmergencyContact from '../models/EmergencyContact';
import User from '../models/User';
import Notification from '../models/Notification';

// Trigger SOS Alert
export const triggerSOS = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { coordinates, message } = req.body;

        // Get user's emergency contacts
        const emergencyContacts = await EmergencyContact.find({ userId });

        // Create SOS Alert
        const sosAlert = new SOSAlert({
            userId,
            location: {
                type: 'Point',
                coordinates,
            },
            message,
            notifiedContacts: emergencyContacts.map(c => c._id),
        });

        await sosAlert.save();

        // Find nearby authorities and users
        const nearbyAuthorities = await User.find({
            role: { $in: ['moderator', 'authority_admin', 'super_admin'] },
            homeLocation: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: 5000, // 5km radius
                },
            },
        });

        // Create notifications for authorities
        const notifications = nearbyAuthorities.map(authority => ({
            userId: authority._id,
            type: 'sos',
            title: '🚨 SOS ALERT - Immediate Assistance Required',
            message: message || 'A community member needs immediate help!',
            priority: 'critical',
            referenceId: sosAlert._id,
            referenceType: 'SOSAlert',
            location: {
                type: 'Point',
                coordinates,
            },
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Emit real-time alert via Socket.IO
        const io = req.app.get('socketio');
        if (io) {
            io.emit('sos_alert', {
                alertId: sosAlert._id,
                location: sosAlert.location,
                userId,
                message,
                timestamp: sosAlert.createdAt,
            });
        }

        res.status(201).json({
            success: true,
            alert: sosAlert,
            notifiedCount: nearbyAuthorities.length + emergencyContacts.length,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get active SOS alerts (for authorities)
export const getActiveSOSAlerts = async (req: Request, res: Response) => {
    try {
        const alerts = await SOSAlert.find({ status: 'active' })
            .populate('userId', 'displayName email phone')
            .sort({ createdAt: -1 });

        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Respond to SOS Alert
export const respondToSOS = async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const responderId = (req as any).user._id;

        const alert = await SOSAlert.findByIdAndUpdate(
            alertId,
            {
                status: 'responded',
                respondedBy: responderId,
                respondedAt: new Date(),
            },
            { new: true }
        ).populate('userId', 'displayName email phone');

        if (!alert) {
            return res.status(404).json({ message: 'SOS Alert not found' });
        }

        // Notify the user that help is on the way
        await Notification.create({
            userId: alert.userId,
            type: 'sos',
            title: '✅ Help is on the way!',
            message: 'An authority has responded to your SOS alert.',
            priority: 'high',
            referenceId: alert._id,
            referenceType: 'SOSAlert',
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('sos_response', {
                alertId: alert._id,
                responderId,
                status: 'responded',
            });
        }

        res.json(alert);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Resolve SOS Alert
export const resolveSOS = async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;

        const alert = await SOSAlert.findByIdAndUpdate(
            alertId,
            {
                status: 'resolved',
                resolvedAt: new Date(),
            },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: 'SOS Alert not found' });
        }

        res.json(alert);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel SOS Alert (by user)
export const cancelSOS = async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const userId = (req as any).user._id;

        const alert = await SOSAlert.findOneAndUpdate(
            { _id: alertId, userId },
            { status: 'cancelled' },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: 'SOS Alert not found or unauthorized' });
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('sos_cancelled', { alertId: alert._id });
        }

        res.json(alert);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Emergency Contacts CRUD
export const getEmergencyContacts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const contacts = await EmergencyContact.find({ userId }).sort({ isPrimary: -1 });
        res.json(contacts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addEmergencyContact = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { name, phone, relationship, isPrimary } = req.body;

        // If setting as primary, unset other primaries
        if (isPrimary) {
            await EmergencyContact.updateMany({ userId }, { isPrimary: false });
        }

        const contact = new EmergencyContact({
            userId,
            name,
            phone,
            relationship,
            isPrimary,
        });

        await contact.save();
        res.status(201).json(contact);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateEmergencyContact = async (req: Request, res: Response) => {
    try {
        const { contactId } = req.params;
        const userId = (req as any).user._id;
        const updates = req.body;

        if (updates.isPrimary) {
            await EmergencyContact.updateMany({ userId }, { isPrimary: false });
        }

        const contact = await EmergencyContact.findOneAndUpdate(
            { _id: contactId, userId },
            updates,
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json(contact);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteEmergencyContact = async (req: Request, res: Response) => {
    try {
        const { contactId } = req.params;
        const userId = (req as any).user._id;

        const contact = await EmergencyContact.findOneAndDelete({ _id: contactId, userId });

        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
