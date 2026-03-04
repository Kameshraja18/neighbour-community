import { useState, useEffect } from 'react';
import axios from 'axios';
import { getIncidents, updateIncidentStatus } from '../services/incidentService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SafetyScoreCard from '../components/SafetyScoreCard';

interface DashboardStats {
    total: number;
    resolved: number;
    open: number;
    highUrgency: number;
    resolutionRate: number;
}

interface SOSAlert {
    _id: string;
    userId: { displayName: string; phone?: string };
    status: string;
    createdAt: string;
    location: { coordinates: number[] };
}

const Dashboard = () => {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'incidents' | 'sos' | 'analytics'>('incidents');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !['moderator', 'authority_admin', 'super_admin'].includes(user.role)) {
            navigate('/');
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [incidentData, sosData, statsData] = await Promise.all([
                getIncidents(),
                axios.get('/api/sos/active').then(r => r.data).catch(() => []),
                axios.get('/api/analytics/stats?lat=0&lng=0').then(r => r.data).catch(() => null),
            ]);
            setIncidents(incidentData);
            setSOSAlerts(sosData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const updated = await updateIncidentStatus(id, newStatus);
            setIncidents(incidents.map(inc => inc._id === id ? updated : inc));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const respondToSOS = async (alertId: string) => {
        try {
            await axios.patch(`/api/sos/${alertId}/respond`);
            fetchData();
        } catch (error) {
            alert('Failed to respond to SOS');
        }
    };

    const resolveSOS = async (alertId: string) => {
        try {
            await axios.patch(`/api/sos/${alertId}/resolve`);
            fetchData();
        } catch (error) {
            alert('Failed to resolve SOS');
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            crime: '🚨', lighting: '💡', roads: '🛣️', animals: '🐕', other: '📌'
        };
        return icons[category] || '📌';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gradient mb-2">Authority Dashboard</h1>
                    <p className="text-gray-400">Manage incidents, respond to emergencies, and monitor community safety</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Total Incidents</p>
                        <p className="text-3xl font-bold text-white">{stats?.total || incidents.length}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Open</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {stats?.open || incidents.filter(i => i.status === 'open').length}
                        </p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">High Priority</p>
                        <p className="text-3xl font-bold text-red-400">
                            {stats?.highUrgency || incidents.filter(i => i.urgency === 'high').length}
                        </p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Active SOS</p>
                        <p className="text-3xl font-bold text-red-500 animate-pulse">
                            {sosAlerts.length}
                        </p>
                    </div>
                </div>

                {/* Active SOS Alerts Banner */}
                {sosAlerts.length > 0 && (
                    <div className="mb-6 bg-red-500/20 border border-red-500 rounded-xl p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🚨</span>
                            <div>
                                <p className="font-bold text-red-400">ACTIVE SOS ALERTS</p>
                                <p className="text-sm text-gray-300">{sosAlerts.length} emergency alert(s) require immediate attention</p>
                            </div>
                            <button
                                onClick={() => setActiveTab('sos')}
                                className="ml-auto px-4 py-2 bg-red-500 rounded-lg font-medium hover:bg-red-600"
                            >
                                View Alerts
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    {(['incidents', 'sos', 'analytics'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all capitalize ${activeTab === tab
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {tab === 'incidents' && '📋 '}
                            {tab === 'sos' && '🚨 '}
                            {tab === 'analytics' && '📊 '}
                            {tab}
                            {tab === 'sos' && sosAlerts.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {sosAlerts.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Incidents Tab */}
                {activeTab === 'incidents' && (
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Incident</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Category</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Urgency</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incidents.map((incident) => (
                                        <tr key={incident._id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{getCategoryIcon(incident.category)}</span>
                                                    <div>
                                                        <p className="font-medium text-white">{incident.title}</p>
                                                        <p className="text-sm text-gray-400 truncate max-w-xs">{incident.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm capitalize">
                                                    {incident.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-sm ${incident.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        incident.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {incident.urgency}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-sm ${incident.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                                                        incident.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            incident.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {incident.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {incident.status !== 'resolved' && (
                                                        <button
                                                            onClick={() => handleStatusChange(incident._id, 'resolved')}
                                                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                                                        >
                                                            ✓ Resolve
                                                        </button>
                                                    )}
                                                    {incident.status === 'open' && (
                                                        <button
                                                            onClick={() => handleStatusChange(incident._id, 'in_review')}
                                                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30"
                                                        >
                                                            👁️ Review
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {incidents.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <span className="text-4xl mb-4 block">✅</span>
                                    <p>No pending incidents</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SOS Tab */}
                {activeTab === 'sos' && (
                    <div className="space-y-4">
                        {sosAlerts.length === 0 ? (
                            <div className="glass rounded-xl p-12 text-center text-gray-400">
                                <span className="text-4xl mb-4 block">✅</span>
                                <p>No active SOS alerts</p>
                            </div>
                        ) : (
                            sosAlerts.map((alert) => (
                                <div key={alert._id} className="glass rounded-xl p-6 border border-red-500/30 bg-red-500/5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl animate-pulse">🚨</span>
                                            <div>
                                                <p className="font-bold text-lg text-red-400">SOS EMERGENCY</p>
                                                <p className="text-white">{alert.userId?.displayName || 'Unknown User'}</p>
                                                <p className="text-sm text-gray-400">
                                                    📍 {alert.location.coordinates[1].toFixed(4)}, {alert.location.coordinates[0].toFixed(4)}
                                                </p>
                                                <p className="text-sm text-gray-400">🕐 {formatTime(alert.createdAt)}</p>
                                                {alert.userId?.phone && (
                                                    <p className="text-sm text-cyan-400">📞 {alert.userId.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {alert.status === 'active' && (
                                                <button
                                                    onClick={() => respondToSOS(alert._id)}
                                                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium hover:opacity-90"
                                                >
                                                    📍 Respond
                                                </button>
                                            )}
                                            {alert.status === 'responded' && (
                                                <button
                                                    onClick={() => resolveSOS(alert._id)}
                                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90"
                                                >
                                                    ✓ Resolve
                                                </button>
                                            )}
                                            <span className={`text-center text-sm px-3 py-1 rounded ${alert.status === 'active' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {alert.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <SafetyScoreCard />

                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">Incidents by Category</h3>
                            <div className="space-y-3">
                                {['crime', 'lighting', 'roads', 'animals', 'other'].map(category => {
                                    const count = incidents.filter(i => i.category === category).length;
                                    const percentage = incidents.length > 0 ? (count / incidents.length) * 100 : 0;
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="capitalize flex items-center gap-2">
                                                    {getCategoryIcon(category)} {category}
                                                </span>
                                                <span>{count}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">Resolution Rate</h3>
                            <div className="flex items-center justify-center h-40">
                                <div className="relative w-32 h-32">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="64" cy="64" r="56"
                                            stroke="url(#resolutionGradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(stats?.resolutionRate || 0) / 100 * 352} 352`}
                                        />
                                        <defs>
                                            <linearGradient id="resolutionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#22c55e" />
                                                <stop offset="100%" stopColor="#06b6d4" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold">{Math.round(stats?.resolutionRate || 0)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {incidents.slice(0, 5).map((incident) => (
                                    <div key={incident._id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                        <span className="text-xl">{getCategoryIcon(incident.category)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{incident.title}</p>
                                            <p className="text-xs text-gray-400">{formatTime(incident.createdAt)}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs ${incident.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {incident.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
