"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyWatchAreas = exports.createWatchArea = void 0;
const WatchArea_1 = __importDefault(require("../models/WatchArea"));
// @desc    Create a watch area
// @route   POST /api/watch-areas
const createWatchArea = async (req, res) => {
    try {
        const { name, latitude, longitude, radiusMeters, categories } = req.body;
        const watchArea = await WatchArea_1.default.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.createWatchArea = createWatchArea;
// @desc    Get my watch areas
// @route   GET /api/watch-areas/mine
const getMyWatchAreas = async (req, res) => {
    try {
        const watchAreas = await WatchArea_1.default.find({ userId: req.user?._id });
        res.json(watchAreas);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getMyWatchAreas = getMyWatchAreas;
