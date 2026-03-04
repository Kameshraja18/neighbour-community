import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
    points: [number, number, number][]; // [lat, lng, intensity]
}

const HeatmapLayer = ({ points }: HeatmapLayerProps) => {
    const map = useMap();

    useEffect(() => {
        if (!points.length) return;

        // @ts-ignore - leaflet.heat adds this method
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);

    return null;
};

export default HeatmapLayer;
