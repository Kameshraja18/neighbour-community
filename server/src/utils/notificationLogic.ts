// Simple Haversine or just use MongoDB query.
// For MVP, we will use MongoDB to find matching watch areas for an incident.

import WatchArea from '../models/WatchArea';

export const findMatchingWatchAreas = async (longitude: number, latitude: number, category: string) => {
    return await WatchArea.find({
        isActive: true,
        categories: category, // if categories array contains this category, logic might vary (all vs any).
        // Usually "categories" in WatchArea is list of interested categories.
        // If it's a simple array of strings, we check if it includes.
        // Mongoose: categories: { $in: [category] }
        // AND location check
        center: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
                // We need to check if incident is within radius of WatchArea.
                // $near sorts by distance. We need $geoIntersects if we defined circles as polygons, 
                // OR we iterate.
                // Reverse query: "Which WatchAreas cover this point?"
                // This is tricky with Points + Radius stored in document.
                // Easier approach: Store WatchArea as Polygon (Circle) or use $geoWithin with centerSphere?
                // But $geoWithin searches for documents INSIDE a geometry.
                // Here documents are Centers. Incident is a Point.
                // Document covers Point if dist(Doc, Point) <= Radius.
                // We can do this manually or use $near and filter.
            }
        }
    });
};
