import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getSafetyScore,
    getHeatmapData,
    getSafetyTrends,
    getAreaStats,
} from '../controllers/analyticsController';

const router = express.Router();

router.get('/safety-score', getSafetyScore);
router.get('/heatmap', getHeatmapData);
router.get('/trends', getSafetyTrends);
router.get('/stats', getAreaStats);

export default router;
