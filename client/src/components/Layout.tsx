import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Map, ShieldAlert, FileText, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

// Premium Feature Components
import SOSButton from './SOSButton';
import SafeWalkPanel from './SafeWalkPanel';
import NotificationCenter from './NotificationCenter';
import LostAndFound from './LostAndFound';
import CommunityHub from './CommunityHub';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Live Map', icon: Map },
        ...(user ? [{ path: '/report', label: 'Report', icon: FileText }] : []),
        ...(user && ['moderator', 'authority_admin', 'super_admin'].includes(user.role)
            ? [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
            : []
        ),
    ];

    return (
        <div className="h-screen w-full bg-gray-900 flex overflow-hidden">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Glassmorphic Sidebar */}
            <motion.nav
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-20 lg:w-64 h-full bg-white/10 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between py-6 transition-all duration-300"
            >
                <div className="flex flex-col items-center w-full">
                    <Link to="/" className="flex items-center gap-3 mb-10 px-4">
                        <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <ShieldAlert className="h-10 w-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        </motion.div>
                        <span className="hidden lg:block font-bold text-2xl text-white tracking-wide">SafetyNet</span>
                    </Link>

                    <div className="w-full px-2 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${location.pathname === item.path
                                    ? 'bg-red-600/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {location.pathname === item.path && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-red-600/10 rounded-xl"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className={`h-6 w-6 relative z-10 ${location.pathname === item.path ? 'animate-bounce-slow' : 'group-hover:scale-110 transition-transform'}`} />
                                <span className="hidden lg:block font-medium relative z-10">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="px-4 w-full">
                    {user ? (
                        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden lg:block overflow-hidden flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                                    <p className="text-xs text-gray-400 truncate capitalize">{user.role}</p>
                                </div>
                                {/* Notification Bell */}
                                <div className="hidden lg:block">
                                    <NotificationCenter />
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 hover:shadow-red-600/40 text-red-100 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-red-500/20 hover:border-red-500"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden lg:block">Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/login"
                                className="w-full text-center py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full text-center py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02]"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </motion.nav>

            <main className="flex-1 relative z-0 bg-gray-900 overflow-hidden">
                <Outlet />

                {/* Premium Feature Components - Only for logged in users */}
                {user && (
                    <>
                        {/* SOS Panic Button */}
                        <SOSButton />

                        {/* Safe Walk Tracking */}
                        <SafeWalkPanel />

                        {/* Lost and Found */}
                        <LostAndFound />

                        {/* Community Hub */}
                        <CommunityHub />

                        {/* Mobile Notification Bell */}
                        <div className="lg:hidden fixed top-4 right-4 z-40">
                            <NotificationCenter />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Layout;
