import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface EmergencyContact {
    _id: string;
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
}

const SOSButton = () => {
    const { user } = useAuth();
    const [isTriggered, setIsTriggered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [showPanel, setShowPanel] = useState(false);
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
    const [currentAlert, setCurrentAlert] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchContacts();
        }
    }, [user]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isTriggered && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (isTriggered && countdown === 0) {
            triggerSOS();
        }
        return () => clearTimeout(timer);
    }, [isTriggered, countdown]);

    const fetchContacts = async () => {
        try {
            const res = await axios.get('/api/sos/contacts');
            setContacts(res.data);
        } catch (error) {
            console.error('Failed to fetch contacts');
        }
    };

    const triggerSOS = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const res = await axios.post('/api/sos/trigger', {
                        coordinates: [position.coords.longitude, position.coords.latitude],
                        message: 'Emergency! I need immediate assistance!',
                    });
                    setCurrentAlert(res.data.alert);
                    // Vibrate if supported
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200, 100, 200]);
                    }
                } catch (error) {
                    console.error('Failed to trigger SOS');
                } finally {
                    setIsLoading(false);
                }
            },
            () => {
                alert('Unable to get location');
                setIsLoading(false);
                setIsTriggered(false);
                setCountdown(3);
            }
        );
    };

    const cancelSOS = async () => {
        if (currentAlert) {
            try {
                await axios.patch(`/api/sos/${currentAlert._id}/cancel`);
            } catch (error) {
                console.error('Failed to cancel SOS');
            }
        }
        setIsTriggered(false);
        setCountdown(3);
        setCurrentAlert(null);
    };

    const addContact = async () => {
        try {
            await axios.post('/api/sos/contacts', newContact);
            fetchContacts();
            setNewContact({ name: '', phone: '', relationship: '' });
        } catch (error) {
            console.error('Failed to add contact');
        }
    };

    const deleteContact = async (id: string) => {
        try {
            await axios.delete(`/api/sos/contacts/${id}`);
            fetchContacts();
        } catch (error) {
            console.error('Failed to delete contact');
        }
    };

    return (
        <>
            {/* Floating SOS Button */}
            <div className="fixed bottom-24 right-6 z-50">
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className="w-4 h-4 mb-2 rounded-full bg-gray-800/80 text-white text-xs flex items-center justify-center hover:bg-gray-700 transition-all"
                    title="Settings"
                >
                    ⚙
                </button>

                <button
                    onClick={() => setIsTriggered(true)}
                    disabled={isTriggered || isLoading}
                    className={`
                        w-20 h-20 rounded-full font-bold text-white shadow-2xl
                        transition-all duration-300 transform
                        ${isTriggered
                            ? 'bg-gradient-to-br from-orange-500 to-red-600 scale-110 animate-pulse'
                            : 'bg-gradient-to-br from-red-500 to-red-700 hover:scale-105 hover:shadow-red-500/50'
                        }
                        flex flex-col items-center justify-center
                    `}
                    style={{
                        boxShadow: isTriggered
                            ? '0 0 40px rgba(239, 68, 68, 0.6)'
                            : '0 8px 32px rgba(239, 68, 68, 0.4)'
                    }}
                >
                    {isTriggered ? (
                        <>
                            <span className="text-3xl">{countdown}</span>
                            <span className="text-[10px]">TAP TO CANCEL</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">🆘</span>
                            <span className="text-xs">SOS</span>
                        </>
                    )}
                </button>

                {isTriggered && (
                    <button
                        onClick={cancelSOS}
                        className="absolute inset-0 w-20 h-20 rounded-full bg-transparent"
                    />
                )}
            </div>

            {/* Alert Active Notification */}
            {currentAlert && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass-dark rounded-xl p-4 border border-red-500/50 animate-pulse">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🚨</span>
                        <div>
                            <p className="text-red-400 font-bold">SOS ACTIVE</p>
                            <p className="text-sm text-gray-300">Help is on the way!</p>
                        </div>
                        <button
                            onClick={cancelSOS}
                            className="ml-4 px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Panel */}
            {showPanel && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPanel(false)}>
                    <div
                        className="glass-dark rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4 text-gradient">Emergency Contacts</h2>

                        {/* Current Contacts */}
                        <div className="space-y-3 mb-6">
                            {contacts.map((contact) => (
                                <div key={contact._id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div>
                                        <p className="font-medium">
                                            {contact.name}
                                            {contact.isPrimary && (
                                                <span className="ml-2 text-xs bg-purple-500/30 px-2 py-0.5 rounded">Primary</span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-400">{contact.phone} • {contact.relationship}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteContact(contact._id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {contacts.length === 0 && (
                                <p className="text-gray-400 text-center py-4">No emergency contacts added</p>
                            )}
                        </div>

                        {/* Add Contact Form */}
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="font-medium mb-3">Add New Contact</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Relationship (e.g., Parent, Friend)"
                                    value={newContact.relationship}
                                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                />
                                <button
                                    onClick={addContact}
                                    disabled={!newContact.name || !newContact.phone || !newContact.relationship}
                                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                    Add Contact
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPanel(false)}
                            className="mt-4 w-full py-2 bg-white/10 rounded-lg hover:bg-white/20"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SOSButton;
