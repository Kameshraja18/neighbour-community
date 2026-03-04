import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    startSafeWalk,
    updateWalkLocation,
    checkIn,
    completeSafeWalk,
    triggerWalkEmergency,
    cancelSafeWalk,
    getMyWalks,
    getWalkDetails,
    getActiveWalk,
} from '../controllers/safeWalkController';

const router = express.Router();

router.post('/start', protect, startSafeWalk);
router.patch('/:walkId/location', protect, updateWalkLocation);
router.post('/:walkId/checkin', protect, checkIn);
router.patch('/:walkId/complete', protect, completeSafeWalk);
router.post('/:walkId/emergency', protect, triggerWalkEmergency);
router.patch('/:walkId/cancel', protect, cancelSafeWalk);
router.get('/my-walks', protect, getMyWalks);
router.get('/active', protect, getActiveWalk);
router.get('/:walkId', protect, getWalkDetails);

export default router;
