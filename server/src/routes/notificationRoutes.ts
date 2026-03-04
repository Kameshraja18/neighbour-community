import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getAlertZones,
    createAlertZone,
    updateAlertZone,
    deleteAlertZone,
    toggleAlertZone,
} from '../controllers/notificationController';

const router = express.Router();

// Notifications
router.get('/', protect, getNotifications);
router.patch('/:notificationId/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);
router.delete('/:notificationId', protect, deleteNotification);
router.delete('/', protect, clearAllNotifications);

// Alert Zones
router.get('/zones', protect, getAlertZones);
router.post('/zones', protect, createAlertZone);
router.patch('/zones/:zoneId', protect, updateAlertZone);
router.delete('/zones/:zoneId', protect, deleteAlertZone);
router.post('/zones/:zoneId/toggle', protect, toggleAlertZone);

export default router;
