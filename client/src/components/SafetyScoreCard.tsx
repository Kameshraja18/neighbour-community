import { useState, useEffect } from 'react';
import axios from 'axios';

interface SafetyScoreData {
    score: number;
    breakdown: {
        crimeRate: number;
        lighting: number;
        responseTime: number;
        communityEngagement: number;
        recentIncidents: number;
    };
    trend: 'improving' | 'stable' | 'declining';
    incidentCounts: Record<string, number>;
}

interface Props {
    lat?: number;
    lng?: number;
}

const SafetyScoreCard = ({ lat, lng }: Props) => {
    const [score, setScore] = useState<SafetyScoreData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (lat && lng) {
            fetchScore();
        } else {
            getCurrentLocation();
        }
    }, [lat, lng]);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchScore(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    setIsLoading(false);
                }
            );
        }
    };

    const fetchScore = async (latitude?: number, longitude?: number) => {
        try {
            const res = await axios.get('/api/analytics/safety-score', {
                params: { lat: latitude || lat, lng: longitude || lng }
            });
            setScore(res.data);
        } catch (error) {
            console.error('Failed to fetch safety score');
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (value: number) => {
        if (value >= 80) return { bg: 'from-green-500 to-emerald-600', text: 'text-green-400' };
        if (value >= 60) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-400' };
        if (value >= 40) return { bg: 'from-orange-500 to-red-500', text: 'text-orange-400' };
        return { bg: 'from-red-500 to-red-700', text: 'text-red-400' };
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return { icon: '📈', text: 'Improving', color: 'text-green-400' };
            case 'declining': return { icon: '📉', text: 'Declining', color: 'text-red-400' };
            default: return { icon: '➡️', text: 'Stable', color: 'text-gray-400' };
        }
    };

    const getLabel = (value: number) => {
        if (value >= 80) return 'Excellent';
        if (value >= 60) return 'Good';
        if (value >= 40) return 'Moderate';
        return 'Needs Attention';
    };

    if (isLoading) {
        return (
            <div className="glass rounded-xl p-4 animate-pulse">
                <div className="h-20 bg-white/10 rounded-lg"></div>
            </div>
        );
    }

    if (!score) return null;

    const colors = getScoreColor(score.score);
    const trend = getTrendIcon(score.trend);

    return (
        <div
            className="glass rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Main Score Display */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-400">Safety Score</h3>
                    <span className={`text-xs flex items-center gap-1 ${trend.color}`}>
                        {trend.icon} {trend.text}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Circular Score */}
                    <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="8"
                                fill="none"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="url(#scoreGradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${(score.score / 100) * 226} 226`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={score.score >= 60 ? '#22c55e' : '#ef4444'} />
                                    <stop offset="100%" stopColor={score.score >= 60 ? '#06b6d4' : '#f97316'} />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-bold ${colors.text}`}>{score.score}</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className={`text-lg font-bold ${colors.text}`}>{getLabel(score.score)}</p>
                        <p className="text-sm text-gray-400">Based on recent activity in this area</p>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-white/10 p-4 bg-black/20 fade-in">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Score Breakdown</h4>

                    <div className="space-y-3">
                        {Object.entries(score.breakdown).map(([key, value]) => {
                            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            const barColor = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';

                            return (
                                <div key={key}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">{label}</span>
                                        <span className="text-gray-300">{value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                            style={{ width: `${value}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Incident Counts */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Incidents (30 days)</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(score.incidentCounts).map(([category, count]) => (
                                <div key={category} className="bg-white/5 rounded-lg p-2 text-center">
                                    <p className="text-lg font-bold">{count}</p>
                                    <p className="text-xs text-gray-400 capitalize">{category}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Expand Indicator */}
            <div className="text-center pb-2">
                <span className="text-gray-500 text-xs">{isExpanded ? '▲ Less' : '▼ More'}</span>
            </div>
        </div>
    );
};

export default SafetyScoreCard;
