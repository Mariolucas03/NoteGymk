import React, { useState, useEffect } from 'react';
import { Plus, Flame, LogOut } from 'lucide-react';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import MissionCard from './components/MissionCard';
import AddMissionModal from './components/AddMissionModal';

// --- API Helper ---
const API_URL = process.env.REACT_APP_API_URL;

const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    };

    const res = await fetch(`${API_URL}${endpoint}`, config);
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            throw new Error('Unauthorized');
        }
        const err = await res.json();
        throw new Error(err.message || 'API Error');
    }
    return res.json();
};

export default function App() {
    // --- State ---
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [missions, setMissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [activeFooterTab, setActiveFooterTab] = useState('home');
    const [missionFrequency, setMissionFrequency] = useState('daily'); // Active Tab for missions
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Auth Form State
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Effects ---
    useEffect(() => {
        if (token) {
            fetchDashboard();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    // --- Actions ---
    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            const data = await apiCall('/dashboard');
            setUser(data.user);
            setMissions(data.missions);
        } catch (err) {
            console.error("Error fetching dashboard:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setAuthLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const body = isLogin ? { email, password } : { name, email, password };

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const handleAddMission = async (newMissionData) => {
        try {
            const savedMission = await apiCall('/missions', 'POST', newMissionData);
            setMissions(prev => [...prev, savedMission]);
        } catch (err) {
            console.error("Error creating mission:", err);
        }
    };

    const handleCompleteMission = async (id) => {
        try {
            // Optimistic Update
            setMissions(prev => prev.map(m => m._id === id ? { ...m, isCompleted: true } : m));

            const data = await apiCall(`/missions/${id}/complete`, 'PUT');

            // Sync with server response
            setUser(data.user);
            setMissions(prev => prev.map(m => m._id === id ? data.mission : m));

        } catch (err) {
            console.error("Error completing mission:", err);
            fetchDashboard(); // Revert on error
        }
    };

    const handleDeleteMission = async (id) => {
        try {
            // 1. Avisar al Backend
            await apiCall(`/missions/${id}`, 'DELETE');
            // 2. Si hay éxito, borrar del Frontend
            setMissions(prev => prev.filter(m => m._id !== id));
        } catch (err) {
            console.error("Error deleting mission:", err);
            fetchDashboard(); // Revert on error
        }
    };

    const handleIncrementMission = async (id) => {
        try {
            // Optimistic Update
            setMissions(prev => prev.map(m => {
                if (m._id === id) {
                    const nextVal = (m.currentValue || 0) + 1;
                    const isNowComplete = nextVal >= m.targetValue;
                    return { ...m, currentValue: nextVal, isCompleted: isNowComplete };
                }
                return m;
            }));

            const data = await apiCall(`/missions/${id}/increment`, 'POST');

            // Sync with server
            setUser(data.user);
            setMissions(prev => prev.map(m => m._id === id ? data.mission : m));

        } catch (err) {
        }


        // --- Render: Auth Screen ---
        if (!token) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                    <div className="w-full max-w-sm bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                        <h1 className="text-3xl font-bold text-white mb-2 text-center">RPG Life</h1>
                        <p className="text-slate-400 text-center mb-8">Gamifica tu vida</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="flex flex-col gap-4">
                            {!isLogin && (
                                <input
                                    type="text"
                                    placeholder="Nombre de Héroe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-violet-500 transition-colors"
                                />
                            )}
                            <input
                                type="text"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-violet-500 transition-colors"
                            />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-violet-500 transition-colors"
                            />

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl mt-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {authLoading ? 'Cargando...' : (isLogin ? 'Iniciar Aventura' : 'Crear Personaje')}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // --- Render: Loading ---
        if (isLoading && !user) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
                </div>
            );
        }

        // --- Render: Dashboard ---
        return (
            <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-24 pt-20">

                <Header user={user || {}} />

                <main className="max-w-md mx-auto px-4">

                    {/* Streak */}
                    <div className="flex items-center justify-center gap-2 mb-6 bg-orange-500/10 border border-orange-500/20 py-2 rounded-full w-fit mx-auto px-4">
                        <Flame size={18} className="text-orange-500 animate-pulse" fill="currentColor" />
                        <span className="text-orange-400 font-bold text-sm">Racha: {user?.streak || 0} días</span>
                    </div>

                    {/* Missions Header & Tabs */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                                {['daily', 'weekly', 'monthly', 'annual'].map((freq) => (
                                    <button
                                        key={freq}
                                        onClick={() => setMissionFrequency(freq)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${missionFrequency === freq
                                            ? 'bg-violet-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {freq === 'daily' ? 'Fija' :
                                            freq === 'weekly' ? 'Semanal' :
                                                freq === 'monthly' ? 'Mensual' : 'Anual'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-full shadow-lg shadow-violet-900/20 active:scale-90 transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Missions List */}
                    <div className="flex flex-col gap-1">
                        {missions.filter(m => m.frequency === missionFrequency).length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">
                                <p>No hay misiones {missionFrequency === 'daily' ? 'fijas' : missionFrequency + 'es'}.</p>
                                <p>¡Añade una para empezar!</p>
                            </div>
                        ) : (
                            missions
                                .filter(m => m.frequency === missionFrequency)
                                .map(mission => (
                                    <MissionCard
                                        key={mission._id}
                                        mission={{ ...mission, id: mission._id }}
                                        onComplete={handleCompleteMission}
                                        onDelete={handleDeleteMission}
                                        onIncrement={handleIncrementMission}
                                    />
                                ))
                        )}
                    </div>

                    {/* Logout */}
                    <div className="mt-10 text-center">
                        <button
                            onClick={handleLogout}
                            className="text-slate-500 hover:text-red-400 text-xs flex items-center justify-center gap-1 mx-auto"
                        >
                            <LogOut size={12} /> Cerrar Sesión
                        </button>
                    </div>

                </main>

                <AddMissionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddMission}
                />

                <FooterNav activeTab={activeFooterTab} onTabChange={setActiveFooterTab} />
            </div>
        );
    }