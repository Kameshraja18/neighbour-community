import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/authService';
import { motion } from 'framer-motion';

const Register = () => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('citizen');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await registerApi({ displayName, email, password, role });
            login(data.token, data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-amber-600/20 rounded-full blur-[128px] pointer-events-none" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">
                        Join the Network
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Help make your community safer
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            required
                            className="w-full bg-black/20 text-white border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-red-500 focus:bg-black/40 transition-all placeholder:text-gray-500"
                            placeholder="Display Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                        <input
                            type="email"
                            required
                            className="w-full bg-black/20 text-white border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-red-500 focus:bg-black/40 transition-all placeholder:text-gray-500"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            required
                            className="w-full bg-black/20 text-white border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-red-500 focus:bg-black/40 transition-all placeholder:text-gray-500"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <select
                            className="w-full bg-black/20 text-white border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-red-500 focus:bg-black/40 transition-all"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="citizen" className="bg-gray-800">Citizen</option>
                            <option value="moderator" className="bg-gray-800">Moderator</option>
                            <option value="authority_admin" className="bg-gray-800">Authority</option>
                        </select>
                    </div>

                    {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-0.5 transition-all"
                    >
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-400">
                    Already a member?{' '}
                    <Link to="/login" className="font-medium text-amber-500 hover:text-amber-400 transition-colors">
                        Sign in here
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
