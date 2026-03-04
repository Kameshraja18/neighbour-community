"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const incidentController_1 = require("../controllers/incidentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
router.route('/')
    .get(incidentController_1.getIncidents)
    .post(authMiddleware_1.protect, uploadMiddleware_1.default.array('photos', 3), incidentController_1.createIncident);
router.post('/sos', authMiddleware_1.protect, incidentController_1.triggerSOS);
router.route('/:id/status')
    .patch(authMiddleware_1.protect, authMiddleware_1.admin, incidentController_1.updateIncidentStatus);
router.route('/:id/notes')
    .post(authMiddleware_1.protect, incidentController_1.addIncidentNote);
router.get('/export', authMiddleware_1.protect, incidentController_1.exportIncidents);
exports.default = router;
