"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const router = express_1.default.Router();
router.get('/safety-score', analyticsController_1.getSafetyScore);
router.get('/heatmap', analyticsController_1.getHeatmapData);
router.get('/trends', analyticsController_1.getSafetyTrends);
router.get('/stats', analyticsController_1.getAreaStats);
exports.default = router;
