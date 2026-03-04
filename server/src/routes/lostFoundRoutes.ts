import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createItem,
    getItems,
    getItem,
    claimItem,
    respondToClaim,
    updateItemStatus,
    getMyItems,
    findMatches,
} from '../controllers/lostFoundController';

const router = express.Router();

router.post('/', protect, createItem);
router.get('/', getItems);
router.get('/my-items', protect, getMyItems);
router.get('/:itemId', getItem);
router.get('/:itemId/matches', protect, findMatches);
router.post('/:itemId/claim', protect, claimItem);
router.patch('/:itemId/claims/:claimId', protect, respondToClaim);
router.patch('/:itemId/status', protect, updateItemStatus);

export default router;
