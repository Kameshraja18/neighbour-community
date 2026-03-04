import { Request, Response } from 'express';
import WatchArea from '../models/WatchArea';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
    user?: IUser;
}

// @desc    Create a watch area
// @route   POST /api/watch-areas
export const createWatchArea = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, latitude, longitude, radiusMeters, categories } = req.body;

        const watchArea = await WatchArea.create({
            userId: req.user?._id,
            name,
            center: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
            radiusMeters,
            categories,
        });

        res.status(201).json(watchArea);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my watch areas
// @route   GET /api/watch-areas/mine
export const getMyWatchAreas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const watchAreas = await WatchArea.find({ userId: req.user?._id });
        res.json(watchAreas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
