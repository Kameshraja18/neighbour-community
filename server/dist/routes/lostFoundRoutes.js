"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const lostFoundController_1 = require("../controllers/lostFoundController");
const router = express_1.default.Router();
router.post('/', authMiddleware_1.protect, lostFoundController_1.createItem);
router.get('/', lostFoundController_1.getItems);
router.get('/my-items', authMiddleware_1.protect, lostFoundController_1.getMyItems);
router.get('/:itemId', lostFoundController_1.getItem);
router.get('/:itemId/matches', authMiddleware_1.protect, lostFoundController_1.findMatches);
router.post('/:itemId/claim', authMiddleware_1.protect, lostFoundController_1.claimItem);
router.patch('/:itemId/claims/:claimId', authMiddleware_1.protect, lostFoundController_1.respondToClaim);
router.patch('/:itemId/status', authMiddleware_1.protect, lostFoundController_1.updateItemStatus);
exports.default = router;
