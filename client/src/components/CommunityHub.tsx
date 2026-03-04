import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface CommunityGroup {
    _id: string;
    name: string;
    description: string;
    category: string;
    members: Array<{ userId: string; role: string }>;
    isPrivate: boolean;
    createdBy: { displayName: string };
}

interface CommunityEvent {
    _id: string;
    title: string;
    description: string;
    category: string;
    startDate: string;
    endDate: string;
    location: { address?: string };
    organizer: { displayName: string };
    attendees: Array<{ userId: string; status: string }>;
    isVirtual: boolean;
    virtualLink?: string;
}

const CommunityHub = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'groups' | 'events' | 'my-groups'>('groups');
    const [groups, setGroups] = useState<CommunityGroup[]>([]);
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);

    // Form states
    const [groupForm, setGroupForm] = useState({
        name: '', description: '', category: 'neighborhood_watch', isPrivate: false
    });
    const [eventForm, setEventForm] = useState({
        title: '', description: '', category: 'community_meeting',
        startDate: '', endDate: '', address: '', isVirtual: false, virtualLink: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'groups') fetchGroups();
            else if (activeTab === 'events') fetchEvents();
            else if (activeTab === 'my-groups') fetchMyGroups();
        }
    }, [isOpen, activeTab]);

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/community/groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Failed to fetch groups');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyGroups = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/community/groups/my-groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Failed to fetch my groups');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/community/events', { params: { upcoming: true } });
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch events');
        } finally {
            setIsLoading(false);
        }
    };

    const joinGroup = async (groupId: string) => {
        try {
            await axios.post(`/api/community/groups/${groupId}/join`);
            fetchGroups();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to join group');
        }
    };

    const leaveGroup = async (groupId: string) => {
        try {
            await axios.post(`/api/community/groups/${groupId}/leave`);
            if (activeTab === 'my-groups') fetchMyGroups();
            else fetchGroups();
        } catch (error) {
            console.error('Failed to leave group');
        }
    };

    const createGroup = async () => {
        try {
            await axios.post('/api/community/groups', groupForm);
            setShowCreateGroup(false);
            setGroupForm({ name: '', description: '', category: 'neighborhood_watch', isPrivate: false });
            fetchGroups();
        } catch (error) {
            console.error('Failed to create group');
        }
    };

    const rsvpEvent = async (eventId: string, status: 'going' | 'interested') => {
        try {
            await axios.post(`/api/community/events/${eventId}/rsvp`, { status });
            fetchEvents();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to RSVP');
        }
    };

    const createEvent = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                await axios.post('/api/community/events', {
                    ...eventForm,
                    coordinates: [position.coords.longitude, position.coords.latitude]
                });
                setShowCreateEvent(false);
                setEventForm({
                    title: '', description: '', category: 'community_meeting',
                    startDate: '', endDate: '', address: '', isVirtual: false, virtualLink: ''
                });
                fetchEvents();
            } catch (error) {
                console.error('Failed to create event');
            }
        });
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            neighborhood_watch: '👁️', community: '🏘️', emergency_response: '🚨',
            safety_workshop: '🛡️', community_meeting: '🤝', emergency_drill: '🔔',
            social: '🎉', other: '📌'
        };
        return icons[category] || '📌';
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const isMember = (group: CommunityGroup) => {
        return user && group.members.some(m => m.userId === user._id);
    };

    const isAttending = (event: CommunityEvent) => {
        return user && event.attendees.some(a => a.userId === user._id && a.status === 'going');
    };

    const groupCategories = ['neighborhood_watch', 'community', 'emergency_response', 'other'];
    const eventCategories = ['safety_workshop', 'community_meeting', 'emergency_drill', 'social', 'other'];

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-44 left-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg flex items-center justify-center text-xl hover:scale-105 transition-transform"
                style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}
            >
                👥
            </button>

            {/* Main Panel */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="glass-dark rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden fade-in-scale"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gradient">Community Hub</h2>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2">
                                {(['groups', 'events', 'my-groups'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {tab === 'groups' && '🏘️ Groups'}
                                        {tab === 'events' && '📅 Events'}
                                        {tab === 'my-groups' && '⭐ My Groups'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Groups Tab */}
                            {(activeTab === 'groups' || activeTab === 'my-groups') && (
                                <>
                                    {user && activeTab === 'groups' && (
                                        <button
                                            onClick={() => setShowCreateGroup(true)}
                                            className="w-full mb-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            ➕ Create New Group
                                        </button>
                                    )}

                                    {isLoading ? (
                                        <div className="text-center py-8 text-gray-400">Loading...</div>
                                    ) : groups.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <span className="text-4xl mb-4 block">🏘️</span>
                                            <p>{activeTab === 'my-groups' ? 'You haven\'t joined any groups yet' : 'No groups available'}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {groups.map((group) => (
                                                <div key={group._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-3xl">{getCategoryIcon(group.category)}</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-medium">{group.name}</h3>
                                                                {group.isPrivate && (
                                                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Private</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-400 line-clamp-2">{group.description}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                <span>👥 {group.members.length} members</span>
                                                                <span>Created by {group.createdBy.displayName}</span>
                                                            </div>
                                                        </div>
                                                        {user && (
                                                            <button
                                                                onClick={() => isMember(group) ? leaveGroup(group._id) : joinGroup(group._id)}
                                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isMember(group)
                                                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                                    }`}
                                                            >
                                                                {isMember(group) ? 'Leave' : 'Join'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Events Tab */}
                            {activeTab === 'events' && (
                                <>
                                    {user && (
                                        <button
                                            onClick={() => setShowCreateEvent(true)}
                                            className="w-full mb-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            ➕ Create New Event
                                        </button>
                                    )}

                                    {isLoading ? (
                                        <div className="text-center py-8 text-gray-400">Loading...</div>
                                    ) : events.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <span className="text-4xl mb-4 block">📅</span>
                                            <p>No upcoming events</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {events.map((event) => (
                                                <div key={event._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-3 text-center min-w-[60px]">
                                                            <p className="text-xs uppercase">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}</p>
                                                            <p className="text-2xl font-bold">{new Date(event.startDate).getDate()}</p>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-lg">{getCategoryIcon(event.category)}</span>
                                                                <h3 className="font-medium">{event.title}</h3>
                                                                {event.isVirtual && (
                                                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Virtual</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-400 line-clamp-2">{event.description}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                <span>🕐 {formatDateTime(event.startDate)}</span>
                                                                <span>👥 {event.attendees.filter(a => a.status === 'going').length} going</span>
                                                            </div>
                                                        </div>
                                                        {user && (
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={() => rsvpEvent(event._id, 'going')}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAttending(event)
                                                                            ? 'bg-emerald-500 text-white'
                                                                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                                        }`}
                                                                >
                                                                    {isAttending(event) ? '✓ Going' : 'RSVP'}
                                                                </button>
                                                                <button
                                                                    onClick={() => rsvpEvent(event._id, 'interested')}
                                                                    className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-xs hover:bg-white/10"
                                                                >
                                                                    Interested
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="glass-dark rounded-2xl w-full max-w-md p-6 fade-in-scale">
                        <h3 className="text-lg font-bold mb-4">Create New Group</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={groupForm.name}
                                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                            />
                            <textarea
                                placeholder="Description"
                                value={groupForm.description}
                                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none"
                            />
                            <select
                                value={groupForm.category}
                                onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                            >
                                {groupCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                ))}
                            </select>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={groupForm.isPrivate}
                                    onChange={(e) => setGroupForm({ ...groupForm, isPrivate: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <span>Private Group</span>
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateGroup(false)}
                                    className="flex-1 py-3 bg-white/10 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createGroup}
                                    disabled={!groupForm.name || !groupForm.description}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateEvent && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="glass-dark rounded-2xl w-full max-w-md p-6 fade-in-scale max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Create New Event</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Event Title"
                                value={eventForm.title}
                                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                            />
                            <textarea
                                placeholder="Description"
                                value={eventForm.description}
                                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none"
                            />
                            <select
                                value={eventForm.category}
                                onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                            >
                                {eventCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-400">Start</label>
                                    <input
                                        type="datetime-local"
                                        value={eventForm.startDate}
                                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">End</label>
                                    <input
                                        type="datetime-local"
                                        value={eventForm.endDate}
                                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Address / Location"
                                value={eventForm.address}
                                onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                            />
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={eventForm.isVirtual}
                                    onChange={(e) => setEventForm({ ...eventForm, isVirtual: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <span>Virtual Event</span>
                            </label>
                            {eventForm.isVirtual && (
                                <input
                                    type="url"
                                    placeholder="Virtual Meeting Link"
                                    value={eventForm.virtualLink}
                                    onChange={(e) => setEventForm({ ...eventForm, virtualLink: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                                />
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateEvent(false)}
                                    className="flex-1 py-3 bg-white/10 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createEvent}
                                    disabled={!eventForm.title || !eventForm.startDate || !eventForm.endDate}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CommunityHub;
