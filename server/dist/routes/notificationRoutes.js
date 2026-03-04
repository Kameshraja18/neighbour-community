"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// Notifications
router.get('/', authMiddleware_1.protect, notificationController_1.getNotifications);
router.patch('/:notificationId/read', authMiddleware_1.protect, notificationController_1.markAsRead);
router.patch('/read-all', authMiddleware_1.protect, notificationController_1.markAllAsRead);
router.delete('/:notificationId', authMiddleware_1.protect, notificationController_1.deleteNotification);
router.delete('/', authMiddleware_1.protect, notificationController_1.clearAllNotifications);
// Alert Zones
router.get('/zones', authMiddleware_1.protect, notificationController_1.getAlertZones);
router.post('/zones', authMiddleware_1.protect, notificationController_1.createAlertZone);
router.patch('/zones/:zoneId', authMiddleware_1.protect, notificationController_1.updateAlertZone);
router.delete('/zones/:zoneId', authMiddleware_1.protect, notificationController_1.deleteAlertZone);
router.post('/zones/:zoneId/toggle', authMiddleware_1.protect, notificationController_1.toggleAlertZone);
exports.default = router;
