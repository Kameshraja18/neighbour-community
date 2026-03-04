"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleAlertZone = exports.deleteAlertZone = exports.updateAlertZone = exports.createAlertZone = exports.getAlertZones = exports.clearAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const AlertZone_1 = __importDefault(require("../models/AlertZone"));
// === NOTIFICATIONS ===
// Get user notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { unreadOnly, type, limit = 50 } = req.query;
        const query = { userId };
        if (unreadOnly === 'true')
            query.isRead = false;
        if (type)
            query.type = type;
        const notifications = await Notification_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        const unreadCount = await Notification_1.default.countDocuments({ userId, isRead: false });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        const notification = await Notification_1.default.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true, readAt: new Date() }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAsRead = markAsRead;
// Mark all as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification_1.default.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        await Notification_1.default.findOneAndDelete({ _id: notificationId, userId });
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteNotification = deleteNotification;
// Clear all notifications
const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification_1.default.deleteMany({ userId });
        res.json({ message: 'All notifications cleared' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.clearAllNotifications = clearAllNotifications;
// === ALERT ZONES ===
// Get user's alert zones
const getAlertZones = async (req, res) => {
    try {
        const userId = req.user._id;
        const zones = await AlertZone_1.default.find({ userId });
        res.json(zones);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAlertZones = getAlertZones;
// Create alert zone
const createAlertZone = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, type, coordinates, radius, alertSettings } = req.body;
        const zone = new AlertZone_1.default({
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createAlertZone = createAlertZone;
// Update alert zone
const updateAlertZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const userId = req.user._id;
        const updates = req.body;
        if (updates.coordinates) {
            updates.location = {
                type: 'Point',
                coordinates: updates.coordinates,
            };
            delete updates.coordinates;
        }
        const zone = await AlertZone_1.default.findOneAndUpdate({ _id: zoneId, userId }, updates, { new: true });
        if (!zone) {
            return res.status(404).json({ message: 'Alert zone not found' });
        }
        res.json(zone);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateAlertZone = updateAlertZone;
// Delete alert zone
const deleteAlertZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const userId = req.user._id;
        const zone = await AlertZone_1.default.findOneAndDelete({ _id: zoneId, userId });
        if (!zone) {
            return res.status(404).json({ message: 'Alert zone not found' });
        }
        res.json({ message: 'Alert zone deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteAlertZone = deleteAlertZone;
// Toggle alert zone
const toggleAlertZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const userId = req.user._id;
        const zone = await AlertZone_1.default.findOne({ _id: zoneId, userId });
        if (!zone) {
            return res.status(404).json({ message: 'Alert zone not found' });
        }
        zone.alertSettings.enabled = !zone.alertSettings.enabled;
        await zone.save();
        res.json(zone);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.toggleAlertZone = toggleAlertZone;
