import express from 'express';
import { createIncident, getIncidents, updateIncidentStatus, addIncidentNote, triggerSOS, exportIncidents } from '../controllers/incidentController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

import upload from '../middleware/uploadMiddleware';

router.route('/')
    .get(getIncidents)
    .post(protect, upload.array('photos', 3), createIncident);

router.post('/sos', protect, triggerSOS);

router.route('/:id/status')
    .patch(protect, admin, updateIncidentStatus);

router.route('/:id/notes')
    .post(protect, addIncidentNote);

router.get('/export', protect, exportIncidents);

export default router;
