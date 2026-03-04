"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const sosController_1 = require("../controllers/sosController");
const router = express_1.default.Router();
// SOS Alerts
router.post('/trigger', authMiddleware_1.protect, sosController_1.triggerSOS);
router.get('/active', authMiddleware_1.protect, sosController_1.getActiveSOSAlerts);
router.patch('/:alertId/respond', authMiddleware_1.protect, sosController_1.respondToSOS);
router.patch('/:alertId/resolve', authMiddleware_1.protect, sosController_1.resolveSOS);
router.patch('/:alertId/cancel', authMiddleware_1.protect, sosController_1.cancelSOS);
// Emergency Contacts
router.get('/contacts', authMiddleware_1.protect, sosController_1.getEmergencyContacts);
router.post('/contacts', authMiddleware_1.protect, sosController_1.addEmergencyContact);
router.patch('/contacts/:contactId', authMiddleware_1.protect, sosController_1.updateEmergencyContact);
router.delete('/contacts/:contactId', authMiddleware_1.protect, sosController_1.deleteEmergencyContact);
exports.default = router;
