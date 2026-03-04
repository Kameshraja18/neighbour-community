import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import IncidentDetail from './IncidentDetail';
// @ts-ignore
import HeatmapLayer from './HeatmapLayer';
import { Flame, Clock } from 'lucide-react';

// Fix Icon issue with Webpack/Vite
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xPng from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
    iconUrl: markerIconPng,
    iconRetinaUrl: markerIcon2xPng,
    shadowUrl: markerShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LocationMarker = () => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        map.locate().on('locationfound', function (e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            map.flyTo(e.latlng, map.getZoom());
        });
    }, [map]);

    return position === null ? null : (
        <Marker position={position} icon={DefaultIcon}>
            <Popup>You are here</Popup>
        </Marker>
    );
};

const LeafletMap = () => {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [tickerIncident, setTickerIncident] = useState<any>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [timeRange, setTimeRange] = useState<string>('all');
    const navigate = useNavigate();
    const { socket } = useSocket();

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const params: any = {};
                if (timeRange !== 'all') params.timeRange = timeRange;

                const { data } = await axios.get(`${API_URL}/incidents`, { params });
                setIncidents(data);
            } catch (error) {
                console.error('Failed to fetch incidents', error);
            }
        };
        fetchIncidents();
    }, [timeRange]);

    useEffect(() => {
        if (!socket) return;

        socket.on('incident:created', (newIncident: any) => {
            setIncidents((prev) => [newIncident, ...prev]);
            setTickerIncident(newIncident);
            setTimeout(() => setTickerIncident(null), 5000); // Hide ticker after 5s
        });

        socket.on('incident:updated', (updatedIncident: any) => {
            setIncidents((prev) => prev.map(inc => inc._id === updatedIncident._id ? updatedIncident : inc));
            if (selectedIncident && selectedIncident._id === updatedIncident._id) {
                setSelectedIncident(updatedIncident);
            }
        });

        return () => {
            socket.off('incident:created');
            socket.off('incident:updated');
        };
    }, [socket, selectedIncident]);

    // Safety Score Calculation (Simple client-side demo)
    // 5.0 base score, minus 0.1 per incident in view
    const safetyScore = Math.max(0, 5.0 - (incidents.length * 0.1)).toFixed(1);
    const scoreColor = Number(safetyScore) > 4 ? 'text-green-500' : Number(safetyScore) > 2.5 ? 'text-yellow-500' : 'text-red-500';

    const heatmapPoints = incidents.map(inc => [
        inc.location.coordinates[1], // lat
        inc.location.coordinates[0], // lng
        inc.urgency === 'high' ? 1.0 : inc.urgency === 'medium' ? 0.6 : 0.3 // intensity
    ]) as [number, number, number][];

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {showHeatmap && heatmapPoints.length > 0 && (
                    <HeatmapLayer points={heatmapPoints} />
                )}

                {/* Always show markers unless heatmap is exclusive? Let's show markers on top for now or toggle */}
                {!showHeatmap && (
                    <>
                        <LocationMarker />
                        {incidents.map((incident) => (
                            <Marker
                                key={incident._id}
                                position={[incident.location.coordinates[1], incident.location.coordinates[0]]} // [lat, lng]
                                icon={DefaultIcon}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <h3 className="font-bold text-gray-900">{incident.title}</h3>
                                        <p className="text-sm text-gray-700">{incident.description}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${incident.urgency === 'high' ? 'bg-red-100 text-red-800' :
                                                incident.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {incident.urgency.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500 capitalize">{incident.category}</span>
                                            <button
                                                onClick={() => setSelectedIncident(incident)}
                                                className="text-xs text-red-600 font-bold hover:underline ml-2"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </>
                )}
            </MapContainer>

            {/* Analytics Controls */}
            <motion.div
                className="absolute top-20 left-4 z-[1000] flex flex-col gap-2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
            >
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`p-3 rounded-full shadow-lg border-2 transition-all ${showHeatmap ? 'bg-red-600 border-red-400 text-white' : 'bg-white border-white/20 text-gray-600 hover:bg-gray-50'}`}
                        title="Toggle Heatmap"
                    >
                        <Flame className="h-5 w-5" />
                    </button>

                    <div className="group relative">
                        <button className="p-3 bg-white rounded-full shadow-lg border-2 border-white/20 text-gray-600 hover:bg-gray-50" title="Time Filter">
                            <Clock className="h-5 w-5" />
                        </button>
                        <div className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl p-2 hidden group-hover:block w-32 border border-gray-100">
                            {['all', '30d', '7d', '24h'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`block w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg mb-1 transition-colors ${timeRange === range ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                    {range === 'all' ? 'All Time' : `Last ${range}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Safety Score Card */}
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/20 mt-2 w-40">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Area Safety Score</p>
                    <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${scoreColor}`}>{safetyScore}</span>
                        <span className="text-xs text-gray-400 mb-1">/ 5.0</span>
                    </div>
                </div>
            </motion.div>

            {selectedIncident && (
                <IncidentDetail
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                />
            )}

            {/* Search Bar Overlay */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-lg"
            >
                <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search locations or incidents..."
                        className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
                    />
                </div>
            </motion.div>

            {/* Live Ticker Overlay */}
            <AnimatePresence>
                {tickerIncident && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        className="absolute top-20 right-4 z-[1000] max-w-xs bg-red-600 text-white p-4 rounded-xl shadow-2xl border border-red-400/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">New Alert!</h4>
                                <p className="text-xs mt-1 font-medium">{tickerIncident.title}</p>
                                <p className="text-[10px] opacity-80 mt-1">{tickerIncident.category} • Just now</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button for Report */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/report')}
                className="absolute bottom-8 right-8 z-[1000] bg-gradient-to-r from-red-600 to-amber-600 text-white p-4 rounded-full shadow-lg border-2 border-white/20 flex items-center justify-center"
                aria-label="Report Incident"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </motion.button>
        </div>
    );
};

export default LeafletMap;
