import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthorityDashboard = () => {
    const [stats, setStats] = useState<any>({ total: 0, open: 0, resolved: 0, avgTime: '0h' });
    const [incidents, setIncidents] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/incidents`);
            setIncidents(data);

            // Calculate Stats
            const total = data.length;
            const open = data.filter((i: any) => i.status === 'open').length;
            const resolved = data.filter((i: any) => i.status === 'resolved').length;
            const avgTime = '24h'; // Mock calculation for now

            setStats({ total, open, resolved, avgTime });
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_URL}/incidents/export`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `incidents_export_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to export data');
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Authority Dashboard</h1>
                    <p className="text-gray-400">Overview of city safety and response metrics.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Download className="h-5 w-5" />
                    Export CSV
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Incidents"
                    value={stats.total}
                    icon={<AlertCircle className="h-6 w-6 text-blue-400" />}
                    color="bg-blue-500/10 border-blue-500/20"
                />
                <MetricCard
                    title="Active Cases"
                    value={stats.open}
                    icon={<AlertCircle className="h-6 w-6 text-red-400" />}
                    color="bg-red-500/10 border-red-500/20"
                />
                <MetricCard
                    title="Resolved"
                    value={stats.resolved}
                    icon={<CheckCircle className="h-6 w-6 text-green-400" />}
                    color="bg-green-500/10 border-green-500/20"
                />
                <MetricCard
                    title="Avg Response Time"
                    value={stats.avgTime}
                    icon={<Clock className="h-6 w-6 text-purple-400" />}
                    color="bg-purple-500/10 border-purple-500/20"
                />
            </div>

            {/* Recent Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-lg text-white">Recent Incidents</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Urgency</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {incidents.slice(0, 5).map((inc) => (
                                <tr key={inc._id} className="text-gray-300 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{inc.title}</td>
                                    <td className="px-6 py-4 capitalize">{inc.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${inc.status === 'open' ? 'bg-red-500/20 text-red-400' :
                                            inc.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20'
                                            }`}>
                                            {inc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 uppercase text-xs font-bold">{inc.urgency}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(inc.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color }: any) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className={`p-6 rounded-xl border ${color} relative overflow-hidden`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                {icon}
            </div>
        </div>
    </motion.div>
);

export default AuthorityDashboard;
