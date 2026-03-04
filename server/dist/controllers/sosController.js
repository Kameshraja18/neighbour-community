"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmergencyContact = exports.updateEmergencyContact = exports.addEmergencyContact = exports.getEmergencyContacts = exports.cancelSOS = exports.resolveSOS = exports.respondToSOS = exports.getActiveSOSAlerts = exports.triggerSOS = void 0;
const SOSAlert_1 = __importDefault(require("../models/SOSAlert"));
const EmergencyContact_1 = __importDefault(require("../models/EmergencyContact"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
// Trigger SOS Alert
const triggerSOS = async (req, res) => {
    try {
        const userId = req.user._id;
        const { coordinates, message } = req.body;
        // Get user's emergency contacts
        const emergencyContacts = await EmergencyContact_1.default.find({ userId });
        // Create SOS Alert
        const sosAlert = new SOSAlert_1.default({
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
        const nearbyAuthorities = await User_1.default.find({
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
            await Notification_1.default.insertMany(notifications);
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.triggerSOS = triggerSOS;
// Get active SOS alerts (for authorities)
const getActiveSOSAlerts = async (req, res) => {
    try {
        const alerts = await SOSAlert_1.default.find({ status: 'active' })
            .populate('userId', 'displayName email phone')
            .sort({ createdAt: -1 });
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getActiveSOSAlerts = getActiveSOSAlerts;
// Respond to SOS Alert
const respondToSOS = async (req, res) => {
    try {
        const { alertId } = req.params;
        const responderId = req.user._id;
        const alert = await SOSAlert_1.default.findByIdAndUpdate(alertId, {
            status: 'responded',
            respondedBy: responderId,
            respondedAt: new Date(),
        }, { new: true }).populate('userId', 'displayName email phone');
        if (!alert) {
            return res.status(404).json({ message: 'SOS Alert not found' });
        }
        // Notify the user that help is on the way
        await Notification_1.default.create({
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.respondToSOS = respondToSOS;
// Resolve SOS Alert
const resolveSOS = async (req, res) => {
    try {
        const { alertId } = req.params;
        const alert = await SOSAlert_1.default.findByIdAndUpdate(alertId, {
            status: 'resolved',
            resolvedAt: new Date(),
        }, { new: true });
        if (!alert) {
            return res.status(404).json({ message: 'SOS Alert not found' });
        }
        res.json(alert);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.resolveSOS = resolveSOS;
// Cancel SOS Alert (by user)
const cancelSOS = async (req, res) => {
    try {
        const { alertId } = req.params;
        const userId = req.user._id;
        const alert = await SOSAlert_1.default.findOneAndUpdate({ _id: alertId, userId }, { status: 'cancelled' }, { new: true });
        if (!alert) {
            return res.status(404).json({ message: 'SOS Alert not found or unauthorized' });
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('sos_cancelled', { alertId: alert._id });
        }
        res.json(alert);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.cancelSOS = cancelSOS;
// Emergency Contacts CRUD
const getEmergencyContacts = async (req, res) => {
    try {
        const userId = req.user._id;
        const contacts = await EmergencyContact_1.default.find({ userId }).sort({ isPrimary: -1 });
        res.json(contacts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEmergencyContacts = getEmergencyContacts;
const addEmergencyContact = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, phone, relationship, isPrimary } = req.body;
        // If setting as primary, unset other primaries
        if (isPrimary) {
            await EmergencyContact_1.default.updateMany({ userId }, { isPrimary: false });
        }
        const contact = new EmergencyContact_1.default({
            userId,
            name,
            phone,
            relationship,
            isPrimary,
        });
        await contact.save();
        res.status(201).json(contact);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.addEmergencyContact = addEmergencyContact;
const updateEmergencyContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user._id;
        const updates = req.body;
        if (updates.isPrimary) {
            await EmergencyContact_1.default.updateMany({ userId }, { isPrimary: false });
        }
        const contact = await EmergencyContact_1.default.findOneAndUpdate({ _id: contactId, userId }, updates, { new: true });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json(contact);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateEmergencyContact = updateEmergencyContact;
const deleteEmergencyContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user._id;
        const contact = await EmergencyContact_1.default.findOneAndDelete({ _id: contactId, userId });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteEmergencyContact = deleteEmergencyContact;
