import express from 'express';
import { createWatchArea, getMyWatchAreas } from '../controllers/watchAreaController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/', createWatchArea);
router.get('/mine', getMyWatchAreas);

export default router;
