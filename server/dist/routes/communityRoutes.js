"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const communityController_1 = require("../controllers/communityController");
const router = express_1.default.Router();
// Groups
router.post('/groups', authMiddleware_1.protect, communityController_1.createGroup);
router.get('/groups', communityController_1.getGroups);
router.get('/groups/my-groups', authMiddleware_1.protect, communityController_1.getMyGroups);
router.get('/groups/:groupId', communityController_1.getGroup);
router.post('/groups/:groupId/join', authMiddleware_1.protect, communityController_1.joinGroup);
router.post('/groups/:groupId/leave', authMiddleware_1.protect, communityController_1.leaveGroup);
// Events
router.post('/events', authMiddleware_1.protect, communityController_1.createEvent);
router.get('/events', communityController_1.getEvents);
router.get('/events/my-events', authMiddleware_1.protect, communityController_1.getMyEvents);
router.get('/events/:eventId', communityController_1.getEvent);
router.post('/events/:eventId/rsvp', authMiddleware_1.protect, communityController_1.rsvpEvent);
exports.default = router;
