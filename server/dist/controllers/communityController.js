"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyEvents = exports.rsvpEvent = exports.getEvent = exports.getEvents = exports.createEvent = exports.getMyGroups = exports.leaveGroup = exports.joinGroup = exports.getGroup = exports.getGroups = exports.createGroup = void 0;
const CommunityGroup_1 = __importDefault(require("../models/CommunityGroup"));
const CommunityEvent_1 = __importDefault(require("../models/CommunityEvent"));
const Notification_1 = __importDefault(require("../models/Notification"));
// === COMMUNITY GROUPS ===
// Create a community group
const createGroup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, description, coverImage, areaCoordinates, isPrivate, verificationRequired, category } = req.body;
        const group = new CommunityGroup_1.default({
            name,
            description,
            coverImage,
            area: areaCoordinates ? {
                type: 'Polygon',
                coordinates: areaCoordinates,
            } : undefined,
            members: [{ userId, role: 'admin', joinedAt: new Date() }],
            isPrivate,
            verificationRequired,
            category,
            createdBy: userId,
        });
        await group.save();
        res.status(201).json(group);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createGroup = createGroup;
// Get all groups
const getGroups = async (req, res) => {
    try {
        const { category, nearby, lat, lng } = req.query;
        const query = { isPrivate: false };
        if (category)
            query.category = category;
        let groups;
        if (nearby && lat && lng) {
            groups = await CommunityGroup_1.default.find({
                ...query,
                area: {
                    $nearSphere: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)],
                        },
                        $maxDistance: 10000,
                    },
                },
            }).populate('createdBy', 'displayName');
        }
        else {
            groups = await CommunityGroup_1.default.find(query)
                .populate('createdBy', 'displayName')
                .sort({ createdAt: -1 });
        }
        res.json(groups);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getGroups = getGroups;
// Get single group
const getGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await CommunityGroup_1.default.findById(groupId)
            .populate('members.userId', 'displayName email')
            .populate('createdBy', 'displayName');
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        res.json(group);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getGroup = getGroup;
// Join a group
const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        const group = await CommunityGroup_1.default.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        // Check if already a member
        const isMember = group.members.some(m => m.userId.toString() === userId.toString());
        if (isMember) {
            return res.status(400).json({ message: 'Already a member' });
        }
        group.members.push({ userId, role: 'member', joinedAt: new Date() });
        await group.save();
        // Notify group admins
        const admins = group.members.filter(m => m.role === 'admin');
        const notifications = admins.map(admin => ({
            userId: admin.userId,
            type: 'community',
            title: '👥 New Member',
            message: `A new member has joined ${group.name}`,
            priority: 'low',
            referenceId: group._id,
            referenceType: 'CommunityGroup',
        }));
        await Notification_1.default.insertMany(notifications);
        res.json({ message: 'Joined group successfully', group });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.joinGroup = joinGroup;
// Leave a group
const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        const group = await CommunityGroup_1.default.findByIdAndUpdate(groupId, { $pull: { members: { userId } } }, { new: true });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        res.json({ message: 'Left group successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.leaveGroup = leaveGroup;
// Get my groups
const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await CommunityGroup_1.default.find({ 'members.userId': userId })
            .populate('createdBy', 'displayName')
            .sort({ createdAt: -1 });
        res.json(groups);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMyGroups = getMyGroups;
// === COMMUNITY EVENTS ===
// Create event
const createEvent = async (req, res) => {
    try {
        const userId = req.user._id;
        const { title, description, coverImage, groupId, coordinates, address, startDate, endDate, category, maxAttendees, isVirtual, virtualLink } = req.body;
        const event = new CommunityEvent_1.default({
            title,
            description,
            coverImage,
            groupId,
            organizer: userId,
            location: {
                type: 'Point',
                coordinates,
                address,
            },
            startDate,
            endDate,
            category,
            maxAttendees,
            isVirtual,
            virtualLink,
            attendees: [{ userId, status: 'going', registeredAt: new Date() }],
        });
        await event.save();
        res.status(201).json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createEvent = createEvent;
// Get events
const getEvents = async (req, res) => {
    try {
        const { category, upcoming, groupId, lat, lng } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (groupId)
            query.groupId = groupId;
        if (upcoming === 'true')
            query.endDate = { $gte: new Date() };
        let events;
        if (lat && lng) {
            events = await CommunityEvent_1.default.find({
                ...query,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)],
                        },
                        $maxDistance: 20000,
                    },
                },
            })
                .populate('organizer', 'displayName')
                .populate('groupId', 'name');
        }
        else {
            events = await CommunityEvent_1.default.find(query)
                .populate('organizer', 'displayName')
                .populate('groupId', 'name')
                .sort({ startDate: 1 });
        }
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEvents = getEvents;
// Get single event
const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await CommunityEvent_1.default.findById(eventId)
            .populate('organizer', 'displayName email')
            .populate('groupId', 'name')
            .populate('attendees.userId', 'displayName');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEvent = getEvent;
// RSVP to event
const rsvpEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;
        const { status } = req.body; // 'going', 'interested', 'not_going'
        const event = await CommunityEvent_1.default.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        // Check max attendees
        if (status === 'going' && event.maxAttendees) {
            const goingCount = event.attendees.filter(a => a.status === 'going').length;
            if (goingCount >= event.maxAttendees) {
                return res.status(400).json({ message: 'Event is full' });
            }
        }
        // Update or add attendance
        const existingIndex = event.attendees.findIndex(a => a.userId.toString() === userId.toString());
        if (existingIndex > -1) {
            event.attendees[existingIndex].status = status;
        }
        else {
            event.attendees.push({ userId, status, registeredAt: new Date() });
        }
        await event.save();
        res.json({ message: 'RSVP updated', event });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.rsvpEvent = rsvpEvent;
// Get my events
const getMyEvents = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query; // 'organized' or 'attending'
        let events;
        if (type === 'organized') {
            events = await CommunityEvent_1.default.find({ organizer: userId })
                .populate('groupId', 'name')
                .sort({ startDate: 1 });
        }
        else {
            events = await CommunityEvent_1.default.find({ 'attendees.userId': userId })
                .populate('organizer', 'displayName')
                .populate('groupId', 'name')
                .sort({ startDate: 1 });
        }
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMyEvents = getMyEvents;
