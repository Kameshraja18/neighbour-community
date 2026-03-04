import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface LostFoundItem {
    _id: string;
    type: 'lost' | 'found';
    category: string;
    title: string;
    description: string;
    photos: string[];
    location: { coordinates: number[]; address?: string };
    dateOccurred: string;
    status: string;
    reward?: { offered: boolean; amount?: number };
    reporterId: { _id?: string; displayName: string };
    createdAt: string;
}

const LostAndFound = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'browse' | 'report' | 'my-items'>('browse');
    const [items, setItems] = useState<LostFoundItem[]>([]);
    const [filter, setFilter] = useState({ type: '', category: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        type: 'lost' as 'lost' | 'found',
        category: 'pet',
        title: '',
        description: '',
        dateOccurred: new Date().toISOString().split('T')[0],
        reward: false,
        rewardAmount: 0,
    });

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen, filter, activeTab]);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const endpoint = activeTab === 'my-items' ? '/api/lost-found/my-items' : '/api/lost-found';
            const res = await axios.get(endpoint, {
                params: { type: filter.type, category: filter.category }
            });
            setItems(res.data);
        } catch (error) {
            console.error('Failed to fetch items');
        } finally {
            setIsLoading(false);
        }
    };

    const submitItem = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await axios.post('/api/lost-found', {
                        ...formData,
                        coordinates: [position.coords.longitude, position.coords.latitude],
                        reward: formData.reward ? { offered: true, amount: formData.rewardAmount } : undefined,
                    });
                    setActiveTab('my-items');
                    fetchItems();
                    setFormData({
                        type: 'lost',
                        category: 'pet',
                        title: '',
                        description: '',
                        dateOccurred: new Date().toISOString().split('T')[0],
                        reward: false,
                        rewardAmount: 0,
                    });
                } catch (error) {
                    console.error('Failed to submit item');
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

    const claimItem = async (itemId: string, message: string) => {
        try {
            await axios.post(`/api/lost-found/${itemId}/claim`, { message });
            alert('Claim submitted! The owner will be notified.');
            setSelectedItem(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit claim');
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            pet: '🐕', electronics: '📱', documents: '📄', keys: '🔑',
            wallet: '👛', jewelry: '💍', clothing: '👕', other: '📦'
        };
        return icons[category] || '📦';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const categories = ['pet', 'electronics', 'documents', 'keys', 'wallet', 'jewelry', 'clothing', 'other'];

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-44 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg flex items-center justify-center text-xl hover:scale-105 transition-transform"
                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
            >
                🔍
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
                                <h2 className="text-xl font-bold text-gradient">Lost & Found</h2>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2">
                                {(['browse', 'report', 'my-items'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {tab === 'browse' && '🔍 Browse'}
                                        {tab === 'report' && '➕ Report'}
                                        {tab === 'my-items' && '📋 My Items'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Browse Tab */}
                            {activeTab === 'browse' && (
                                <>
                                    {/* Filters */}
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        <select
                                            value={filter.type}
                                            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <option value="">All Types</option>
                                            <option value="lost">Lost</option>
                                            <option value="found">Found</option>
                                        </select>
                                        <select
                                            value={filter.category}
                                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Items Grid */}
                                    {isLoading ? (
                                        <div className="text-center py-8 text-gray-400">Loading...</div>
                                    ) : items.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <span className="text-4xl mb-4 block">📭</span>
                                            <p>No items found</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {items.map((item) => (
                                                <div
                                                    key={item._id}
                                                    onClick={() => setSelectedItem(item)}
                                                    className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all border border-white/10"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-3xl">{getCategoryIcon(item.category)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'lost'
                                                                    ? 'bg-red-500/20 text-red-400'
                                                                    : 'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                    {item.type.toUpperCase()}
                                                                </span>
                                                                {item.reward?.offered && (
                                                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                                        💰 Reward
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="font-medium truncate">{item.title}</h3>
                                                            <p className="text-sm text-gray-400 truncate">{item.description}</p>
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                {formatDate(item.dateOccurred)} • {item.reporterId.displayName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Report Tab */}
                            {activeTab === 'report' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        {(['lost', 'found'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, type })}
                                                className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.type === type
                                                    ? type === 'lost'
                                                        ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                                        : 'bg-gradient-to-r from-green-500 to-teal-500'
                                                    : 'bg-white/10'
                                                    }`}
                                            >
                                                {type === 'lost' ? '😢 I Lost Something' : '🎉 I Found Something'}
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Category</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setFormData({ ...formData, category: cat })}
                                                    className={`p-3 rounded-lg text-center transition-all ${formData.category === cat
                                                        ? 'bg-purple-500/30 border border-purple-500'
                                                        : 'bg-white/5 border border-transparent'
                                                        }`}
                                                >
                                                    <span className="text-2xl block">{getCategoryIcon(cat)}</span>
                                                    <span className="text-xs capitalize">{cat}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Title (e.g., Golden Retriever, iPhone 15)"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-purple-500 outline-none"
                                    />

                                    <textarea
                                        placeholder="Description (color, size, distinguishing features...)"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-purple-500 outline-none resize-none"
                                    />

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Date {formData.type}</label>
                                        <input
                                            type="date"
                                            value={formData.dateOccurred}
                                            onChange={(e) => setFormData({ ...formData, dateOccurred: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-purple-500 outline-none"
                                        />
                                    </div>

                                    {formData.type === 'lost' && (
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.reward}
                                                    onChange={(e) => setFormData({ ...formData, reward: e.target.checked })}
                                                    className="w-5 h-5 rounded accent-yellow-500"
                                                />
                                                <span>Offer a reward 💰</span>
                                            </label>
                                            {formData.reward && (
                                                <input
                                                    type="number"
                                                    placeholder="Reward amount (₹)"
                                                    value={formData.rewardAmount || ''}
                                                    onChange={(e) => setFormData({ ...formData, rewardAmount: parseInt(e.target.value) })}
                                                    className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-yellow-500 outline-none"
                                                />
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={submitItem}
                                        disabled={!formData.title || !formData.description || isLoading}
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Submitting...' : `Report ${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Item`}
                                    </button>
                                </div>
                            )}

                            {/* My Items Tab */}
                            {activeTab === 'my-items' && (
                                <>
                                    {items.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <span className="text-4xl mb-4 block">📝</span>
                                            <p>You haven't reported any items yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div
                                                    key={item._id}
                                                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                                                            <div>
                                                                <h3 className="font-medium">{item.title}</h3>
                                                                <p className="text-sm text-gray-400">{formatDate(item.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs ${item.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                            item.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {item.status}
                                                        </span>
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

            {/* Item Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="glass-dark rounded-2xl w-full max-w-lg p-6 fade-in-scale"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <span className="text-5xl">{getCategoryIcon(selectedItem.category)}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${selectedItem.type === 'lost'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-green-500/20 text-green-400'
                                        }`}>
                                        {selectedItem.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded capitalize">
                                        {selectedItem.category}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold">{selectedItem.title}</h3>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <p className="text-gray-300 mb-4">{selectedItem.description}</p>

                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-gray-400">Date</p>
                                <p className="font-medium">{formatDate(selectedItem.dateOccurred)}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-gray-400">Reported by</p>
                                <p className="font-medium">{selectedItem.reporterId.displayName}</p>
                            </div>
                        </div>

                        {selectedItem.reward?.offered && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                                <p className="text-yellow-400 font-medium">💰 Reward Offered: ₹{selectedItem.reward.amount}</p>
                            </div>
                        )}

                        {user && selectedItem.reporterId._id !== user._id && (
                            <button
                                onClick={() => {
                                    const message = prompt('Enter a message for the owner:');
                                    if (message) claimItem(selectedItem._id, message);
                                }}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium hover:opacity-90"
                            >
                                {selectedItem.type === 'lost' ? '🙋 I Found This!' : '🙋 This is Mine!'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default LostAndFound;
