import { Request, Response } from 'express';
import CommunityGroup from '../models/CommunityGroup';
import CommunityEvent from '../models/CommunityEvent';
import Notification from '../models/Notification';

// === COMMUNITY GROUPS ===

// Create a community group
export const createGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { name, description, coverImage, areaCoordinates, isPrivate, verificationRequired, category } = req.body;

        const group = new CommunityGroup({
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get all groups
export const getGroups = async (req: Request, res: Response) => {
    try {
        const { category, nearby, lat, lng } = req.query;
        const query: any = { isPrivate: false };

        if (category) query.category = category;

        let groups;
        if (nearby && lat && lng) {
            groups = await CommunityGroup.find({
                ...query,
                area: {
                    $nearSphere: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
                        },
                        $maxDistance: 10000,
                    },
                },
            }).populate('createdBy', 'displayName');
        } else {
            groups = await CommunityGroup.find(query)
                .populate('createdBy', 'displayName')
                .sort({ createdAt: -1 });
        }

        res.json(groups);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single group
export const getGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const group = await CommunityGroup.findById(groupId)
            .populate('members.userId', 'displayName email')
            .populate('createdBy', 'displayName');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Join a group
export const joinGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = (req as any).user._id;

        const group = await CommunityGroup.findById(groupId);
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
        await Notification.insertMany(notifications);

        res.json({ message: 'Joined group successfully', group });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Leave a group
export const leaveGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = (req as any).user._id;

        const group = await CommunityGroup.findByIdAndUpdate(
            groupId,
            { $pull: { members: { userId } } },
            { new: true }
        );

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json({ message: 'Left group successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get my groups
export const getMyGroups = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        const groups = await CommunityGroup.find({ 'members.userId': userId })
            .populate('createdBy', 'displayName')
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// === COMMUNITY EVENTS ===

// Create event
export const createEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const {
            title, description, coverImage, groupId, coordinates, address,
            startDate, endDate, category, maxAttendees, isVirtual, virtualLink
        } = req.body;

        const event = new CommunityEvent({
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get events
export const getEvents = async (req: Request, res: Response) => {
    try {
        const { category, upcoming, groupId, lat, lng } = req.query;
        const query: any = {};

        if (category) query.category = category;
        if (groupId) query.groupId = groupId;
        if (upcoming === 'true') query.endDate = { $gte: new Date() };

        let events;
        if (lat && lng) {
            events = await CommunityEvent.find({
                ...query,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
                        },
                        $maxDistance: 20000,
                    },
                },
            })
                .populate('organizer', 'displayName')
                .populate('groupId', 'name');
        } else {
            events = await CommunityEvent.find(query)
                .populate('organizer', 'displayName')
                .populate('groupId', 'name')
                .sort({ startDate: 1 });
        }

        res.json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single event
export const getEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const event = await CommunityEvent.findById(eventId)
            .populate('organizer', 'displayName email')
            .populate('groupId', 'name')
            .populate('attendees.userId', 'displayName');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// RSVP to event
export const rsvpEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const userId = (req as any).user._id;
        const { status } = req.body; // 'going', 'interested', 'not_going'

        const event = await CommunityEvent.findById(eventId);
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
        const existingIndex = event.attendees.findIndex(
            a => a.userId.toString() === userId.toString()
        );

        if (existingIndex > -1) {
            event.attendees[existingIndex].status = status;
        } else {
            event.attendees.push({ userId, status, registeredAt: new Date() });
        }

        await event.save();
        res.json({ message: 'RSVP updated', event });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get my events
export const getMyEvents = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { type } = req.query; // 'organized' or 'attending'

        let events;
        if (type === 'organized') {
            events = await CommunityEvent.find({ organizer: userId })
                .populate('groupId', 'name')
                .sort({ startDate: 1 });
        } else {
            events = await CommunityEvent.find({ 'attendees.userId': userId })
                .populate('organizer', 'displayName')
                .populate('groupId', 'name')
                .sort({ startDate: 1 });
        }

        res.json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
