import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident } from '../services/incidentService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
    iconUrl: markerIconPng,
    shadowUrl: markerShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Component to handle map clicks for manual location
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);

    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
        locationfound(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    // Auto-locate on mount
    const map = useMapEvents({});
    useEffect(() => {
        map.locate();
    }, [map]);

    return position === null ? null : (
        <Marker position={position} icon={DefaultIcon}></Marker>
    );
};

const ReportIncident = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'other',
        latitude: 0,
        longitude: 0,
        visibility: 'public',
        fuzzLocation: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (formData.latitude === 0 && formData.longitude === 0) {
                throw new Error('Please select a location on the map');
            }

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('latitude', formData.latitude.toString());
            data.append('longitude', formData.longitude.toString());
            data.append('visibility', formData.visibility);
            data.append('fuzzLocation', formData.fuzzLocation.toString());

            // @ts-ignore
            if (formData.photos) {
                // @ts-ignore
                for (let i = 0; i < formData.photos.length; i++) {
                    // @ts-ignore
                    data.append('photos', formData.photos[i]);
                }
            }

            await createIncident(data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Report an Incident</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md border"
                    >
                        <option value="lighting">Lighting / Dark Street</option>
                        <option value="roads">Roads / Potholes</option>
                        <option value="animals">Animals</option>
                        <option value="crime">Suspicious Activity / Crime</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Brief summary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Detailed description..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Photos (Max 3)</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files) {
                                // @ts-ignore
                                setFormData({ ...formData, photos: e.target.files });
                            }
                        }}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location (Click on map to exact pin)</label>
                    <div className="h-64 w-full rounded-md overflow-hidden border border-gray-300 relative z-0">
                        <MapContainer center={[51.505, -0.09]} zoom={13} className="h-full w-full">
                            <TileLayer
                                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationPicker onLocationSelect={handleLocationSelect} />
                        </MapContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>

                    <div className="mt-4 flex items-center">
                        <input
                            id="anonymize"
                            type="checkbox"
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            checked={formData.visibility === 'public' && false} // Just a visual toggle for now, mapped to state below
                            onChange={(e) => {
                                // We'll handle this by adding a specific 'anonymize' flag to formData or just using it in submit
                                // For simplicity let's stick to standard visibility, but we need a new 'isAnonymousLocation' field ideally.
                                // Let's just pass a flag 'fuzzLocation' to the backend.
                                setFormData(prev => ({ ...prev, fuzzLocation: e.target.checked }));
                            }}
                        />
                        <label htmlFor="anonymize" className="ml-2 block text-sm text-gray-900">
                            Mask my exact location (Approximate location only)
                        </label>
                    </div>
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full inline-flex justify-center border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm rounded-md disabled:bg-red-300"
                    >
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportIncident;
