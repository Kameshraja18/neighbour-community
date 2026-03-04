import { Request, Response } from 'express';
import Incident from '../models/Incident';
import { IUser } from '../models/User';
import { calculateUrgency } from '../utils/urgency';

interface AuthRequest extends Request {
    user?: IUser;
}

// @desc    Create a new incident
// @route   POST /api/incidents
// @access  Private
export const createIncident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, category, latitude, longitude, visibility, fuzzLocation } = req.body;

        if (!latitude || !longitude) {
            res.status(400).json({ message: 'Location (latitude, longitude) is required' });
            return;
        }

        const { score, level } = calculateUrgency(title, description, category);

        // Handle Location Fuzzing
        let finalLat = Number(latitude);
        let finalLng = Number(longitude);

        if (fuzzLocation === 'true' || fuzzLocation === true) {
            // Add random offset ~100-200m
            const offsetLat = (Math.random() - 0.5) * 0.004;
            const offsetLng = (Math.random() - 0.5) * 0.004;
            finalLat += offsetLat;
            finalLng += offsetLng;
        }

        // Handle File Uploads
        let photos: string[] = [];
        if (req.files) {
            photos = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
        }

        const incident = await Incident.create({
            reporterId: req.user?._id,
            title,
            description,
            category,
            location: {
                type: 'Point',
                coordinates: [finalLng, finalLat], // Ensure numbers
            },
            photos,
            visibility,
            urgency: level,
            urgencyScore: score,
            history: [{ action: 'created', by: req.user?._id, timestamp: new Date() }],
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('incident:created', incident);
        }

        res.status(201).json(incident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all incidents (with filters & geo)
// @route   GET /api/incidents
// @access  Public (some data hidden)
export const getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng, radius, category, status } = req.query;

        let query: any = {};

        if (status) query.status = status;
        if (category) query.category = category;

        // Time Filter
        const { timeRange } = req.query;
        if (timeRange) {
            const now = new Date();
            let past = new Date();
            if (timeRange === '24h') past.setHours(now.getHours() - 24);
            if (timeRange === '7d') past.setDate(now.getDate() - 7);
            if (timeRange === '30d') past.setDate(now.getDate() - 30);

            if (['24h', '7d', '30d'].includes(timeRange as string)) {
                query.createdAt = { $gte: past };
            }
        }

        // Geospatial Query
        if (lat && lng && radius) {
            const radiusInMeters = Number(radius); // e.g. 5000 for 5km
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)],
                    },
                    $maxDistance: radiusInMeters,
                },
            };
        }

        // Populate reporter displayName for public feed, hide sensitive info if anonymous (TODO)
        const incidents = await Incident.find(query)
            .populate('reporterId', 'displayName')
            .sort({ createdAt: -1 });

        res.json(incidents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update incident status (Authority)
// @route   PATCH /api/incidents/:id/status
// @access  Private/Authority
export const updateIncidentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            res.status(404).json({ message: 'Incident not found' });
            return;
        }

        incident.status = status;
        incident.history.push({
            action: `status_changed_to_${status}`,
            by: req.user?._id as any,
            timestamp: new Date(),
        });

        await incident.save();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('incident:updated', incident);
        }

        res.json(incident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a note/progress update to incident
// @route   POST /api/incidents/:id/notes
// @access  Private (Comments), Authority (Progress Updates)
export const addIncidentNote = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { text, isOfficial } = req.body;
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            res.status(404).json({ message: 'Incident not found' });
            return;
        }

        // Only authority can make official updates
        const officialUpdate = isOfficial && ['moderator', 'authority_admin', 'super_admin'].includes(req.user?.role || '');

        incident.notes.push({
            by: req.user?._id as any,
            text,
            isOfficial: officialUpdate,
            timestamp: new Date(),
        });

        // If official, also add to history as a milestone
        if (officialUpdate) {
            incident.history.push({
                action: 'progress_update',
                by: req.user?._id as any,
                note: text,
                timestamp: new Date(),
            });
        }

        await incident.save();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('incident:updated', incident);
        }

        res.json(incident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Trigger SOS / Panic Alert
// @route   POST /api/incidents/sos
// @access  Private
export const triggerSOS = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            res.status(400).json({ message: 'GPS Location required for SOS' });
            return;
        }

        // Create high priority incident
        const incident = await Incident.create({
            reporterId: req.user?._id,
            title: 'SOS / EMERGENCY ALERT',
            description: `Emergency panic button triggered by ${req.user?.displayName || 'User'}`,
            category: 'crime', // Default to crime level urgency
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)],
            },
            urgency: 'high',
            urgencyScore: 100, // Max score
            visibility: 'public',
            photos: [],
            history: [{ action: 'sos_triggered', by: req.user?._id, timestamp: new Date() }],
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('incident:created', incident);
            io.emit('sos:alert', incident);
        }

        res.status(201).json(incident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Export incidents to CSV
// @route   GET /api/incidents/export
// @access  Private/Authority
export const exportIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const incidents = await Incident.find({}).sort({ createdAt: -1 });

        // Simple CSV construction
        const headers = ['ID', 'Title', 'Category', 'Urgency', 'Status', 'CreatedAt', 'Latitude', 'Longitude'];
        const rows = incidents.map(inc => [
            inc._id,
            `"${inc.title.replace(/"/g, '""')}"`, // Escape quotes
            inc.category,
            inc.urgency,
            inc.status,
            inc.createdAt.toISOString(),
            inc.location.coordinates[1],
            inc.location.coordinates[0]
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="incidents.csv"');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
