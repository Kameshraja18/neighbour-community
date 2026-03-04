"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const safeWalkController_1 = require("../controllers/safeWalkController");
const router = express_1.default.Router();
router.post('/start', authMiddleware_1.protect, safeWalkController_1.startSafeWalk);
router.patch('/:walkId/location', authMiddleware_1.protect, safeWalkController_1.updateWalkLocation);
router.post('/:walkId/checkin', authMiddleware_1.protect, safeWalkController_1.checkIn);
router.patch('/:walkId/complete', authMiddleware_1.protect, safeWalkController_1.completeSafeWalk);
router.post('/:walkId/emergency', authMiddleware_1.protect, safeWalkController_1.triggerWalkEmergency);
router.patch('/:walkId/cancel', authMiddleware_1.protect, safeWalkController_1.cancelSafeWalk);
router.get('/my-walks', authMiddleware_1.protect, safeWalkController_1.getMyWalks);
router.get('/active', authMiddleware_1.protect, safeWalkController_1.getActiveWalk);
router.get('/:walkId', authMiddleware_1.protect, safeWalkController_1.getWalkDetails);
exports.default = router;
