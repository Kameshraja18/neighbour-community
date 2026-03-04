import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    triggerSOS,
    getActiveSOSAlerts,
    respondToSOS,
    resolveSOS,
    cancelSOS,
    getEmergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
} from '../controllers/sosController';

const router = express.Router();

// SOS Alerts
router.post('/trigger', protect, triggerSOS);
router.get('/active', protect, getActiveSOSAlerts);
router.patch('/:alertId/respond', protect, respondToSOS);
router.patch('/:alertId/resolve', protect, resolveSOS);
router.patch('/:alertId/cancel', protect, cancelSOS);

// Emergency Contacts
router.get('/contacts', protect, getEmergencyContacts);
router.post('/contacts', protect, addEmergencyContact);
router.patch('/contacts/:contactId', protect, updateEmergencyContact);
router.delete('/contacts/:contactId', protect, deleteEmergencyContact);

export default router;
