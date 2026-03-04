import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
}

const NotificationCenter = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'sos': return '🚨';
            case 'incident': return '⚠️';
            case 'safe_walk': return '👟';
            case 'community': return '👥';
            case 'event': return '📅';
            case 'lost_found': return '🔍';
            default: return '🔔';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'border-red-500 bg-red-500/10';
            case 'high': return 'border-orange-500 bg-orange-500/10';
            case 'medium': return 'border-yellow-500 bg-yellow-500/10';
            default: return 'border-gray-600 bg-white/5';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    if (!user) return null;

    return (
        <>
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-50"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md glass-dark shadow-2xl fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold">Notifications</h2>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-cyan-400 hover:text-cyan-300"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white p-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto h-[calc(100vh-60px)]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <span className="text-4xl mb-4">🔕</span>
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`
                                                p-4 border-l-4 transition-all hover:bg-white/5 cursor-pointer
                                                ${getPriorityColor(notification.priority)}
                                                ${!notification.isRead ? 'bg-white/5' : ''}
                                            `}
                                            onClick={() => markAsRead(notification._id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{getIcon(notification.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`font-medium ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification._id);
                                                            }}
                                                            className="text-gray-500 hover:text-red-400 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {formatTime(notification.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full ml-1" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationCenter;
