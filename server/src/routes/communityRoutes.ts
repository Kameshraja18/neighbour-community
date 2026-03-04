import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createGroup,
    getGroups,
    getGroup,
    joinGroup,
    leaveGroup,
    getMyGroups,
    createEvent,
    getEvents,
    getEvent,
    rsvpEvent,
    getMyEvents,
} from '../controllers/communityController';

const router = express.Router();

// Groups
router.post('/groups', protect, createGroup);
router.get('/groups', getGroups);
router.get('/groups/my-groups', protect, getMyGroups);
router.get('/groups/:groupId', getGroup);
router.post('/groups/:groupId/join', protect, joinGroup);
router.post('/groups/:groupId/leave', protect, leaveGroup);

// Events
router.post('/events', protect, createEvent);
router.get('/events', getEvents);
router.get('/events/my-events', protect, getMyEvents);
router.get('/events/:eventId', getEvent);
router.post('/events/:eventId/rsvp', protect, rsvpEvent);

export default router;
