import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface SafeWalkData {
    _id: string;
    status: 'active' | 'completed' | 'emergency' | 'cancelled';
    startLocation: { coordinates: number[] };
    endLocation: { coordinates: number[] };
    currentLocation?: { coordinates: number[] };
    expectedArrivalTime: string;
    lastCheckIn?: string;
}

const SafeWalkPanel = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeWalk, setActiveWalk] = useState<SafeWalkData | null>(null);
    const [destination, setDestination] = useState('');
    const [expectedMinutes, setExpectedMinutes] = useState(15);
    const [isLoading, setIsLoading] = useState(false);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (user) {
            fetchActiveWalk();
        }
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [user]);

    useEffect(() => {
        if (activeWalk && activeWalk.status === 'active') {
            startLocationTracking();
        }
    }, [activeWalk]);

    const fetchActiveWalk = async () => {
        try {
            const res = await axios.get('/api/safe-walk/active');
            setActiveWalk(res.data);
        } catch (error) {
            console.error('Failed to fetch active walk');
        }
    };

    const startLocationTracking = () => {
        if (!navigator.geolocation || !activeWalk) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                try {
                    await axios.patch(`/api/safe-walk/${activeWalk._id}/location`, {
                        coordinates: [position.coords.longitude, position.coords.latitude],
                    });
                } catch (error) {
                    console.error('Failed to update location');
                }
            },
            (error) => console.error('Geolocation error:', error),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
    };

    const startWalk = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // For demo, using a fixed end location offset
                    const endCoords = [
                        position.coords.longitude + 0.01,
                        position.coords.latitude + 0.01,
                    ];

                    const res = await axios.post('/api/safe-walk/start', {
                        startCoordinates: [position.coords.longitude, position.coords.latitude],
                        endCoordinates: endCoords,
                        expectedMinutes,
                        checkInInterval: 5,
                    });

                    setActiveWalk(res.data);
                } catch (error) {
                    console.error('Failed to start walk');
                } finally {
                    setIsLoading(false);
                }
            },
            () => {
                alert('Unable to get location');
                setIsLoading(false);
            }
        );
    };

    const checkIn = async () => {
        if (!activeWalk) return;
        try {
            await axios.post(`/api/safe-walk/${activeWalk._id}/checkin`);
            fetchActiveWalk();
        } catch (error) {
            console.error('Failed to check in');
        }
    };

    const completeWalk = async () => {
        if (!activeWalk) return;
        try {
            await axios.patch(`/api/safe-walk/${activeWalk._id}/complete`);
            setActiveWalk(null);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        } catch (error) {
            console.error('Failed to complete walk');
        }
    };

    const triggerEmergency = async () => {
        if (!activeWalk) return;
        try {
            await axios.post(`/api/safe-walk/${activeWalk._id}/emergency`);
            fetchActiveWalk();
            if ('vibrate' in navigator) {
                navigator.vibrate([500, 200, 500]);
            }
        } catch (error) {
            console.error('Failed to trigger emergency');
        }
    };

    const cancelWalk = async () => {
        if (!activeWalk) return;
        try {
            await axios.patch(`/api/safe-walk/${activeWalk._id}/cancel`);
            setActiveWalk(null);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        } catch (error) {
            console.error('Failed to cancel walk');
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getTimeRemaining = () => {
        if (!activeWalk) return '';
        const arrival = new Date(activeWalk.expectedArrivalTime);
        const now = new Date();
        const diff = arrival.getTime() - now.getTime();
        if (diff < 0) return 'Overdue';
        const mins = Math.floor(diff / 60000);
        return `${mins} min remaining`;
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-24 left-6 z-40 w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center text-2xl
                    transition-all duration-300 transform hover:scale-105
                    ${activeWalk
                        ? 'bg-gradient-to-br from-green-500 to-teal-600 animate-pulse'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }
                `}
                style={{ boxShadow: activeWalk ? '0 0 30px rgba(34, 197, 94, 0.5)' : '0 8px 32px rgba(59, 130, 246, 0.4)' }}
            >
                👟
            </button>

            {/* Active Walk Banner */}
            {activeWalk && activeWalk.status === 'active' && !isOpen && (
                <div className="fixed bottom-44 left-6 glass-dark rounded-xl p-3 z-30 border border-green-500/30">
                    <p className="text-sm text-green-400 font-medium">🚶 Walk Active</p>
                    <p className="text-xs text-gray-400">{getTimeRemaining()}</p>
                </div>
            )}

            {/* Main Panel */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="glass-dark rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gradient">Safe Walk</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {!activeWalk ? (
                            /* Start Walk Form */
                            <div className="space-y-4">
                                <div className="text-center py-6">
                                    <div className="text-6xl mb-4">👟</div>
                                    <p className="text-gray-300">
                                        Start a tracked walk and share your journey with trusted contacts.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Destination</label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="Where are you going?"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Expected Duration: {expectedMinutes} minutes
                                    </label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={expectedMinutes}
                                        onChange={(e) => setExpectedMinutes(parseInt(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>5 min</span>
                                        <span>2 hours</span>
                                    </div>
                                </div>

                                <button
                                    onClick={startWalk}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Starting...' : '🚶 Start Safe Walk'}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    Your location will be tracked and shared with your emergency contacts.
                                </p>
                            </div>
                        ) : (
                            /* Active Walk Controls */
                            <div className="space-y-4">
                                {activeWalk.status === 'emergency' && (
                                    <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 text-center animate-pulse">
                                        <p className="text-red-400 font-bold text-lg">🚨 EMERGENCY ACTIVE</p>
                                        <p className="text-sm text-gray-300">Help has been notified</p>
                                    </div>
                                )}

                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-400">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-sm ${activeWalk.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                activeWalk.status === 'emergency' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {activeWalk.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-400">ETA</span>
                                        <span className="font-medium">{formatTime(activeWalk.expectedArrivalTime)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Time Remaining</span>
                                        <span className="font-medium text-cyan-400">{getTimeRemaining()}</span>
                                    </div>
                                </div>

                                {activeWalk.status === 'active' && (
                                    <>
                                        <button
                                            onClick={checkIn}
                                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-medium hover:opacity-90"
                                        >
                                            ✓ I'm Okay (Check In)
                                        </button>

                                        <button
                                            onClick={completeWalk}
                                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-medium hover:opacity-90"
                                        >
                                            ✅ I've Arrived Safely
                                        </button>

                                        <button
                                            onClick={triggerEmergency}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-xl font-bold text-lg hover:opacity-90"
                                        >
                                            🚨 EMERGENCY
                                        </button>

                                        <button
                                            onClick={cancelWalk}
                                            className="w-full py-2 bg-white/10 rounded-xl text-gray-400 hover:bg-white/20"
                                        >
                                            Cancel Walk
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default SafeWalkPanel;
