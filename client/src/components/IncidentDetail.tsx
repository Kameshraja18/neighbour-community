import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle } from 'lucide-react';
import Timeline from './Timeline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface IncidentDetailProps {
    incident: any;
    onClose: () => void;
}

const IncidentDetail = ({ incident, onClose }: IncidentDetailProps) => {
    const [note, setNote] = useState('');
    const { user } = useAuth();

    // Optimistic update state could be handled here or parent

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        try {
            await axios.post(`${API_URL}/incidents/${incident._id}/notes`,
                { text: note, isOfficial: false },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setNote('');
            // Ideally refresh incident data here via socket or callback
        } catch (error) {
            console.error('Failed to add note', error);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-red-50 to-white">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${incident.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                    incident.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                    {incident.urgency} Priority
                                </span>
                                <span className="text-xs font-medium text-gray-500 uppercase">{incident.category}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Reported by</h3>
                                {incident.reporterId?.displayName && (
                                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                        {incident.reporterId.displayName}
                                        {incident.reporterId.isVerified && (
                                            <span className="text-blue-500 bg-blue-50 rounded-full p-0.5" title="Verified Resident">
                                                <CheckCircle className="h-3 w-3" />
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{incident.title}</h2>
                            <p className="text-gray-600 mt-1">{incident.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Map Placeholder or Media */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Reported by</h3>
                                {incident.reporterId?.displayName && (
                                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                        {incident.reporterId.displayName}
                                        {incident.reporterId.isVerified && (
                                            <span className="text-blue-500 bg-blue-50 rounded-full p-0.5" title="Verified Resident">
                                                <CheckCircle className="h-3 w-3" />
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Photos */}
                            {incident.photos && incident.photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    {incident.photos.map((photo: string, idx: number) => (
                                        <img
                                            key={idx}
                                            src={`${API_URL.replace('/api', '')}${photo}`}
                                            alt="Evidence"
                                            className="rounded-lg h-24 w-full object-cover border border-gray-200"
                                        />
                                    ))}
                                </div>
                            )}

                            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Activity Timeline</h3>
                            {/* Pass combined history and notes */}
                            <Timeline history={incident.history} notes={incident.notes || []} />
                        </div>
                    </div>

                    {/* Footer / Input */}
                    {user && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <form onSubmit={handleAddNote} className="flex gap-2">
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a progress update or note..."
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                                    disabled={!note.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default IncidentDetail;
