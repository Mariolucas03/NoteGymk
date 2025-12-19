import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Trash2, Plus, Zap, Repeat, X, Trophy, ChevronLeft, ChevronRight,
    Check, Coins, Star, CalendarClock, Target, Gamepad2, Clock
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

// --- SUB-COMPONENTE: TARJETA ---
function MissionCard({ mission, onComplete, onDelete, getDifficultyColor }) {
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const THRESHOLD = 100;

    const handleStart = (clientX) => { setIsDragging(true); startX.current = clientX; };
    const handleMove = (clientX) => {
        if (!isDragging) return;
        const diff = clientX - startX.current;
        if (mission.completed && diff > 0) return;
        setDragX(diff);
    };
    const handleEnd = () => {
        setIsDragging(false);
        if (dragX > THRESHOLD) { if (!mission.completed) onComplete(mission); }
        else if (dragX < -THRESHOLD) { onDelete(mission._id); }
        setDragX(0);
    };

    const cardStyle = { transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' };
    let bgClass = 'bg-gray-900';
    if (dragX > 0) bgClass = 'bg-green-600';
    else if (dragX < 0) bgClass = 'bg-red-600';

    // Cálculo Porcentaje Barra
    const progressPercent = mission.target > 1 ? Math.min((mission.progress / mission.target) * 100, 100) : 0;

    return (
        <div className="relative w-full h-auto mb-3 select-none isolate overflow-hidden rounded-2xl">
            <div className={`absolute inset-0 flex items-center ${bgClass} -z-10 text-white font-bold px-6 justify-between`}>
                {dragX > 0 && <span className="flex gap-2"><Check /> Completar (+1)</span>}
                {dragX < 0 && <span className="flex gap-2 ml-auto">Eliminar <Trash2 /></span>}
            </div>

            <div
                style={cardStyle}
                onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
                onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
                onTouchEnd={handleEnd}
                onMouseDown={(e) => handleStart(e.clientX)}
                onMouseMove={(e) => handleMove(e.clientX)}
                onMouseUp={handleEnd}
                onMouseLeave={() => { if (isDragging) handleEnd() }}
                className={`relative bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-md h-full flex flex-col justify-between ${mission.completed ? 'opacity-50 grayscale border-transparent' : 'hover:border-gray-700'}`}
            >
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-base font-bold transition-all ${mission.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {mission.title}
                        </h3>
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${mission.type === 'habit' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : 'bg-orange-900/40 text-orange-300 border border-orange-500/30'}`}>
                            {mission.type === 'habit' ? <Repeat size={10} /> : <Check size={10} />}
                            {mission.type === 'habit' ? 'HÁBITO' : 'TEMPORAL'}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getDifficultyColor(mission.difficulty)}`}>
                            {mission.difficulty}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold bg-gray-800 px-2 py-1 rounded">
                            {mission.frequency === 'daily' ? 'Diaria' : mission.frequency === 'weekly' ? 'Semanal' : mission.frequency}
                        </span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-blue-600/10 px-2 py-1 rounded-lg border border-blue-500/20">
                            <Star size={12} className="text-blue-400 fill-blue-400" />
                            <span className="text-xs font-bold text-blue-200">+{mission.xpReward} XP</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-600/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                            <Coins size={12} className="text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-200">+{mission.coinReward}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-purple-600/10 px-2 py-1 rounded-lg border border-purple-500/20">
                            <Gamepad2 size={12} className="text-purple-400" />
                            <span className="text-xs font-bold text-purple-200">+{mission.gameCoinReward || mission.coinReward * 10}</span>
                        </div>
                    </div>
                </div>

                {/* CORRECCIÓN AQUÍ: Solo mostrar barra si target > 1 (Misiones de repetición) */}
                {mission.target > 1 && (
                    <div className="mt-4 pointer-events-none">
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wide">
                            <span className="flex items-center gap-1"><Target size={10} /> Progreso</span>
                            <span className={mission.completed ? 'text-green-500' : 'text-white'}>
                                {mission.progress} / {mission.target}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
                            <div className="absolute inset-0 w-full h-full opacity-10 bg-white/5"></div>
                            <div
                                className={`h-full transition-all duration-500 ease-out ${mission.completed ? 'bg-green-500' : 'bg-blue-600'}`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {!mission.completed && (
                    <div className="absolute right-4 bottom-4 text-gray-700 opacity-20 pointer-events-none">
                        <div className="flex"><ChevronLeft size={16} /><ChevronRight size={16} /></div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function Missions() {
    const { user, setUser } = useOutletContext();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily');
    const [showCreator, setShowCreator] = useState(false);
    const [toast, setToast] = useState(null);

    const [newMission, setNewMission] = useState({
        title: '', frequency: 'daily', type: 'habit', difficulty: 'easy', target: 1
    });

    useEffect(() => {
        setNewMission(prev => ({ ...prev, frequency: activeTab }));
        fetchMissions();
    }, [activeTab]);

    const fetchMissions = async () => {
        try {
            const res = await api.get('/missions');
            const safeMissions = Array.isArray(res.data) ? res.data : (res.data.missions || []);
            setMissions(safeMissions);
        } catch (error) { setMissions([]); }
        finally { setLoading(false); }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    const getRewardValues = (freq, diff) => {
        const baseXP = 10;
        const baseCoins = 5;

        const diffMult = { easy: 1, medium: 2, hard: 3, epic: 5 };
        const freqMult = { daily: 1, weekly: 5, monthly: 15, yearly: 100 };

        const m1 = diffMult[diff] || 1;
        const m2 = freqMult[freq] || 1;

        const calculatedCoins = baseCoins * m1 * m2;

        return {
            xp: baseXP * m1 * m2,
            coins: calculatedCoins,
            gameCoins: calculatedCoins * 10
        };
    };

    const getPreviewExpirationText = (freq) => {
        const now = new Date();
        const target = new Date();

        if (freq === 'daily') return "Hoy a las 00:00";

        if (freq === 'weekly') {
            const day = now.getDay();
            const diff = day === 0 ? 0 : 7 - day;
            target.setDate(now.getDate() + diff);
            const dateStr = `${target.getDate()}/${target.getMonth() + 1}`;
            return `Este Domingo (${dateStr}) a las 00:00`;
        }

        if (freq === 'monthly') {
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const dateStr = `${lastDay.getDate()}/${lastDay.getMonth() + 1}`;
            return `Fin de mes (${dateStr}) a las 00:00`;
        }

        if (freq === 'yearly') return `31 de Diciembre a las 00:00`;
        return "";
    };

    const previewRewards = getRewardValues(newMission.frequency, newMission.difficulty);
    const expirationText = getPreviewExpirationText(newMission.frequency);

    const handleComplete = async (mission) => {
        try {
            const res = await api.put(`/missions/${mission._id}/complete`);

            if (res.data.progressOnly) {
                setMissions(prev => prev.map(m => m._id === mission._id ? res.data.mission : m));
                showToast(`Progreso: ${res.data.mission.progress}/${res.data.mission.target}`, "info");
                return;
            }

            if (res.data.alreadyCompleted) {
                showToast("Ya la completaste hoy", "info");
                return;
            }

            if (res.data.user) {
                const updatedUser = { ...res.data.user };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            // Actualizar lista local
            setMissions(prev => prev.map(m => m._id === mission._id ? res.data.mission : m));

            const { xp, coins, gameCoins } = res.data.rewards || { xp: 0, coins: 0, gameCoins: 0 };

            if (xp > 0 || coins > 0) {
                let msg = `+${xp} XP | +${coins} 💰`;
                if (gameCoins > 0) msg += ` | +${gameCoins} 🎰`;
                if (res.data.leveledUp) msg += ` (NIVEL UP! 🔥)`;
                showToast(msg, "success");
            } else {
                showToast("Misión registrada", "info");
            }

        } catch (error) {
            showToast(error.response?.data?.message || "Error al completar", "error");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/missions/${id}`);
            setMissions(prev => prev.filter(m => m._id !== id));
            showToast("Misión eliminada", "info");
        } catch (error) { showToast("Error al borrar", "error"); }
    };

    const handleCreate = async () => {
        if (!newMission.title) return showToast("Escribe un título", "error");
        try {
            await api.post('/missions', newMission);
            setShowCreator(false);
            setNewMission({ ...newMission, title: '', target: 1 });
            fetchMissions();
            showToast("¡Misión creada!");
        } catch (error) { showToast("Error creando misión", "error"); }
    };

    const filteredMissions = missions.filter(m => m.frequency === activeTab);

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'hard': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'epic': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in select-none">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className="sticky top-0 bg-black/95 z-10 pb-4 pt-2 -mx-4 px-4 border-b border-gray-800 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-yellow-400 fill-yellow-400" /> Misiones
                    </h1>
                    <button onClick={() => setShowCreator(true)} className="bg-blue-600 p-2 rounded-xl text-white shadow-lg hover:bg-blue-500 transition-colors">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex gap-2 bg-gray-900 p-1 rounded-xl overflow-x-auto">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(freq => (
                        <button key={freq} onClick={() => setActiveTab(freq)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${activeTab === freq ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
                            {freq === 'daily' ? 'Diaria' : freq === 'weekly' ? 'Semanal' : freq === 'monthly' ? 'Mensual' : 'Anual'}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTA */}
            <div className="mt-4">
                {filteredMissions.length === 0 && !loading ? (
                    <div className="text-center py-20 opacity-50">
                        <Trophy size={48} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-400 text-sm">No hay misiones activas</p>
                    </div>
                ) : (
                    filteredMissions.map(m => (
                        <MissionCard
                            key={m._id}
                            mission={m}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                            getDifficultyColor={getDifficultyColor}
                        />
                    ))
                )}

                <div className="mt-8 mb-4 flex items-center justify-center gap-2 text-gray-500 opacity-60">
                    <CalendarClock size={14} />
                    <span className="text-xs font-mono font-medium tracking-wider">
                        CADUCA: {expirationText}
                    </span>
                </div>
            </div>

            {/* MODAL CREADOR */}
            {showCreator && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Nueva Misión</h2>
                            <button onClick={() => setShowCreator(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título (Igual para Sinergia)</label>
                                <input type="text" placeholder="Ej: Gym" autoFocus value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none mt-2 text-lg font-medium" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frecuencia</label>
                                    <select value={newMission.frequency} onChange={e => setNewMission({ ...newMission, frequency: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mt-2">
                                        <option value="daily">Diaria</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensual</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</label>
                                    <select value={newMission.type} onChange={e => setNewMission({ ...newMission, type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mt-2">
                                        <option value="habit">Hábito (Fija)</option>
                                        <option value="temporal">Tarea (Una vez)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repeticiones</label>
                                    <input type="number" min="1" value={newMission.target} onChange={e => setNewMission({ ...newMission, target: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mt-2" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dificultad</label>
                                    <select value={newMission.difficulty} onChange={e => setNewMission({ ...newMission, difficulty: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mt-2">
                                        <option value="easy">Fácil (x1)</option>
                                        <option value="medium">Media (x2)</option>
                                        <option value="hard">Difícil (x3)</option>
                                        <option value="epic">Épica (x5)</option>
                                    </select>
                                </div>
                            </div>

                            {/* 🔥 PREVIEW DE RECOMPENSAS (CON FICHAS) */}
                            <div className="space-y-2">
                                <div className="bg-black/30 p-3 rounded-xl border border-gray-700 flex justify-between items-center px-4">
                                    <div className="text-xs text-gray-400 font-bold uppercase">Recompensas:</div>
                                    <div className="flex gap-3">
                                        <span className="flex items-center gap-1 text-blue-400 font-bold text-xs"><Star size={12} /> +{previewRewards.xp} XP</span>
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold text-xs"><Coins size={12} /> +{previewRewards.coins}</span>
                                        <span className="flex items-center gap-1 text-purple-400 font-bold text-xs"><Gamepad2 size={12} /> +{previewRewards.gameCoins}</span>
                                    </div>
                                </div>
                                {/* CADUCIDAD */}
                                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
                                    <Clock size={12} />
                                    <span>{expirationText}</span>
                                </div>
                            </div>

                            <button onClick={handleCreate} className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform">Crear Misión</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}