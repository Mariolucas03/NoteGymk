import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash2, Plus, Zap, Repeat, X, Trophy, ChevronLeft, ChevronRight, Check, Coins, Star, CalendarClock } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

// --- SUB-COMPONENTE: TARJETA ---
function MissionCard({ mission, onComplete, onDelete, getDifficultyColor }) {
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0); // useRef is used here

    const THRESHOLD = 100;

    const handleStart = (clientX) => {
        setIsDragging(true);
        startX.current = clientX;
    };

    const handleMove = (clientX) => {
        if (!isDragging) return;
        const diff = clientX - startX.current;
        if (mission.completed && diff > 0) return;
        setDragX(diff);
    };

    const handleEnd = () => {
        setIsDragging(false);
        if (dragX > THRESHOLD) {
            if (!mission.completed) onComplete(mission);
        } else if (dragX < -THRESHOLD) {
            onDelete(mission._id);
        }
        setDragX(0);
    };

    const cardStyle = {
        transform: `translateX(${dragX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'pan-y'
    };

    let bgClass = 'bg-gray-900';
    let iconLeft = null;
    let iconRight = null;

    if (dragX > 0) {
        bgClass = 'bg-green-600';
        iconLeft = <div className="absolute left-6 flex items-center gap-2 font-bold text-white"><Check size={24} /> Completar</div>;
    } else if (dragX < 0) {
        bgClass = 'bg-red-600';
        iconRight = <div className="absolute right-6 flex items-center gap-2 font-bold text-white">Eliminar <Trash2 size={24} /></div>;
    }

    return (
        <div className="relative w-full h-auto mb-3 select-none isolate overflow-hidden rounded-2xl">
            <div className={`absolute inset-0 flex items-center ${bgClass} -z-10`}>
                {iconLeft} {iconRight}
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
                        <h3 className={`text-base font-bold transition-all ${mission.completed ? 'text-gray-500 line-through decoration-2' : 'text-white'}`}>
                            {mission.title}
                        </h3>
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${mission.type === 'habit' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : 'bg-orange-900/40 text-orange-300 border border-orange-500/30'}`}>
                            {mission.type === 'habit' ? <Repeat size={10} /> : <Check size={10} />}
                            {mission.type === 'habit' ? 'HÁBITO' : 'TEMPORAL'}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getDifficultyColor(mission.difficulty)}`}>
                            {mission.difficulty}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 bg-blue-600/10 px-2 py-1 rounded-lg border border-blue-500/20">
                            <Star size={12} className="text-blue-400 fill-blue-400" />
                            <span className="text-xs font-bold text-blue-200">+{mission.xpReward} XP</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-600/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                            <Coins size={12} className="text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-200">+{mission.coinReward}</span>
                        </div>
                    </div>
                </div>

                {mission.target > 1 && (
                    <div className="mt-4 pointer-events-none">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">
                            <span>Progreso</span><span>{mission.progress} / {mission.target}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(mission.progress / mission.target) * 100}%` }}></div>
                        </div>
                    </div>
                )}

                {!mission.completed && (
                    <div className="absolute right-4 bottom-4 text-gray-700 opacity-20">
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
    // ✅ 1. INICIALIZACIÓN SEGURA: Array vacío
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

            // ✅ 2. DOBLE SEGURIDAD: Verificar qué devuelve la API
            let safeMissions = [];

            if (Array.isArray(res.data)) {
                safeMissions = res.data;
            } else if (res.data && Array.isArray(res.data.missions)) {
                safeMissions = res.data.missions;
            }

            setMissions(safeMissions);

            if (res.data.user && res.data.user.coins !== undefined) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
            }
        } catch (error) {
            console.error("Error cargando:", error);
            setMissions([]); // Fallback a vacío
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleComplete = async (mission) => {
        try {
            const res = await api.put(`/missions/${mission._id}/complete`);
            const { xp, coins, user: updatedUser, synergyCount } = res.data;

            fetchMissions();

            if (xp > 0 || coins > 0) {
                if (updatedUser) {
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                let msg = `+${xp} XP | +${coins} Monedas`;
                if (synergyCount > 0) msg += ` (Combo x${synergyCount} 🔥)`;
                showToast(msg);
            }
        } catch (error) { showToast("Error al completar", "error"); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/missions/${id}`);
            // ✅ 3. ACTUALIZACIÓN SEGURA DE ESTADO
            setMissions(prev => (prev || []).filter(m => m._id !== id));
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
            showToast("¡Nueva misión añadida!");
        } catch (error) { showToast("Error creando misión", "error"); }
    };

    // ✅ 4. FILTRADO SUPER SEGURO
    const filteredMissions = (missions || []).filter(m => m && m.frequency === activeTab);

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'hard': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'epic': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            default: return 'text-gray-400';
        }
    };

    const getExpirationDate = (freq) => {
        const now = new Date();
        let targetDate = new Date();
        switch (freq) {
            case 'daily': break;
            case 'weekly':
                const day = now.getDay();
                const diff = day === 0 ? 0 : 7 - day;
                targetDate.setDate(now.getDate() + diff);
                break;
            case 'monthly':
                targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'yearly':
                targetDate = new Date(now.getFullYear(), 11, 31);
                break;
            default: return '';
        }
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        return `${dd}-${mm}-${targetDate.getFullYear()}`;
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
                        CADUCA: {getExpirationDate(activeTab)}
                    </span>
                </div>
                <div className="h-20"></div>
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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título</label>
                                <input type="text" placeholder="Ej: Leer 30 min" autoFocus value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none mt-2 text-lg font-medium" />
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
                                        <option value="temporal">Tarea (Temporal)</option>
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
                                        <option value="easy">Fácil (-5 Vida)</option>
                                        <option value="medium">Media (-3 Vida)</option>
                                        <option value="hard">Difícil (-1 Vida)</option>
                                        <option value="epic">Épica (0 Vida)</option>
                                    </select>
                                </div>
                            </div>

                            <button onClick={handleCreate} className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold shadow-lg mt-4 active:scale-95 transition-transform">Crear Misión</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}