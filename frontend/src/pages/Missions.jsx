import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash2, Plus, Zap, HeartCrack, Repeat, Clock, X, Trophy, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

// --- SUB-COMPONENTE: TARJETA DESLIZABLE (SWIPE CARD) ---
function MissionCard({ mission, onComplete, onDelete, getDifficultyColor }) {
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);

    // Umbral para disparar la acción (píxeles)
    const THRESHOLD = 100;

    // --- MANEJADORES DE TOQUE/RATÓN ---
    const handleStart = (clientX) => {
        // Permitimos deslizar incluso si está completada para poder borrarla si queremos, 
        // o bloqueamos completar si ya está hecha.
        if (mission.completed) {
            // Opcional: Si quieres que las completadas SOLO se puedan borrar (izquierda),
            // podrías añadir lógica aquí. Por ahora dejamos libertad de movimiento.
        }
        setIsDragging(true);
        startX.current = clientX;
    };

    const handleMove = (clientX) => {
        if (!isDragging) return;
        const diff = clientX - startX.current;

        // Limitamos un poco el movimiento si la misión está completada y se intenta completar de nuevo
        if (mission.completed && diff > 0) return;

        setDragX(diff);
    };

    const handleEnd = () => {
        setIsDragging(false);

        if (dragX > THRESHOLD) {
            // Deslizaste a la DERECHA (Positivo) -> COMPLETAR
            if (!mission.completed) onComplete(mission);
        } else if (dragX < -THRESHOLD) {
            // Deslizaste a la IZQUIERDA (Negativo) -> ELIMINAR
            onDelete(mission._id);
        }

        // Reset posición (con animación suave)
        setDragX(0);
    };

    // Estilos dinámicos para el movimiento
    const cardStyle = {
        transform: `translateX(${dragX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', // Efecto rebote suave
        cursor: isDragging ? 'grabbing' : 'grab',
        willChange: 'transform' // Optimización de rendimiento para evitar temblores
    };

    // Lógica visual del fondo (Colores e Iconos)
    let bgClass = 'bg-gray-900'; // Color base por si acaso
    let iconLeft = null;
    let iconRight = null;

    if (dragX > 0) {
        // Arrastrando a Derecha -> VERDE (Completar)
        bgClass = 'bg-green-600';
        iconLeft = (
            <div className="absolute left-6 flex items-center gap-2 font-bold text-white animate-in fade-in zoom-in duration-200">
                <Check size={24} strokeWidth={3} /> Completar
            </div>
        );
    } else if (dragX < 0) {
        // Arrastrando a Izquierda -> ROJO (Eliminar)
        bgClass = 'bg-red-600';
        iconRight = (
            <div className="absolute right-6 flex items-center gap-2 font-bold text-white animate-in fade-in zoom-in duration-200">
                Eliminar <Trash2 size={24} strokeWidth={3} />
            </div>
        );
    }

    return (
        <div className="relative w-full h-auto mb-3 select-none isolate">

            {/* CAPA DE FONDO (ACCIONES) */}
            <div className={`absolute inset-0 rounded-2xl flex items-center ${bgClass} overflow-hidden -z-10`}>
                {iconLeft}
                {iconRight}
            </div>

            {/* CAPA SUPERIOR (TARJETA) */}
            <div
                style={cardStyle}
                // Eventos Touch (Móvil)
                onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
                onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
                onTouchEnd={handleEnd}
                // Eventos Mouse (PC)
                onMouseDown={(e) => handleStart(e.clientX)}
                onMouseMove={(e) => handleMove(e.clientX)}
                onMouseUp={handleEnd}
                onMouseLeave={() => { if (isDragging) handleEnd() }}

                className={`
                    relative bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-md h-full flex flex-col justify-between
                    ${mission.completed ? 'opacity-50 grayscale border-transparent' : 'hover:border-gray-700'}
                `}
            >
                <div className="flex justify-between items-start pointer-events-none">
                    <div className="flex-1">
                        {/* Título (Sin el botón círculo antiguo) */}
                        <h3 className={`text-base font-bold mb-2 transition-all ${mission.completed ? 'text-gray-500 line-through decoration-2' : 'text-white'}`}>
                            {mission.title}
                        </h3>

                        {/* Badges / Etiquetas */}
                        <div className="flex flex-wrap gap-2">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getDifficultyColor(mission.difficulty)}`}>
                                {mission.difficulty}
                            </span>
                            <span className="text-[10px] font-mono text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/30 font-bold">
                                +{mission.xpReward}XP +{mission.coinReward}💰
                            </span>
                            {mission.lifePenalty > 0 && (
                                <span className="text-[10px] font-mono text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-900/30 flex items-center gap-1 font-bold">
                                    <HeartCrack size={10} /> -{mission.lifePenalty}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Indicadores de Swipe (Solo si no está completada) */}
                    {!mission.completed && (
                        <div className="flex flex-col items-center justify-center text-gray-700 opacity-40 ml-2 mt-1 gap-1">
                            <ChevronRight size={16} />
                            <ChevronLeft size={16} />
                        </div>
                    )}
                </div>

                {/* Barra de Progreso (Si es misión de repeticiones) */}
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
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL DE MISIONES ---
export default function Missions() {
    const { setUser } = useOutletContext();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily');
    const [showCreator, setShowCreator] = useState(false);
    const [toast, setToast] = useState(null);

    const [newMission, setNewMission] = useState({
        title: '',
        frequency: 'daily',
        type: 'habit',
        difficulty: 'easy',
        target: 1
    });

    useEffect(() => {
        setNewMission(prev => ({ ...prev, frequency: activeTab }));
        fetchMissions();
    }, [activeTab]);

    const fetchMissions = async () => {
        try {
            const res = await api.get('/missions');
            setMissions(res.data.missions);
            if (res.data.user) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleComplete = async (mission) => {
        try {
            const res = await api.put(`/missions/${mission._id}/complete`);
            const { completed, xp, coins, user, synergyCount } = res.data;

            // Recargamos para actualizar todas las misiones (incluidas las afectadas por sinergia)
            fetchMissions();

            if (xp > 0 || coins > 0) {
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                let msg = `+${xp} XP | +${coins} Monedas`;
                if (synergyCount > 0) msg += ` (Combo x${synergyCount} 🔥)`;
                showToast(msg);
            }
        } catch (error) {
            showToast("Error al completar misión", "error");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/missions/${id}`);
            setMissions(prev => prev.filter(m => m._id !== id));
            showToast("Misión eliminada", "info");
        } catch (error) {
            showToast("Error al borrar", "error");
        }
    };

    const handleCreate = async () => {
        if (!newMission.title) return showToast("Escribe un título", "error");
        try {
            await api.post('/missions', newMission);
            setShowCreator(false);
            setNewMission({ ...newMission, title: '', target: 1 });
            fetchMissions();
            showToast("¡Nueva misión añadida!");
        } catch (error) {
            showToast("Error creando misión", "error");
        }
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

            {/* LISTA DE MISIONES */}
            <div className="mt-4">
                {filteredMissions.length === 0 && !loading ? (
                    <div className="text-center py-20 opacity-50">
                        <Trophy size={48} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-400 text-sm">No hay misiones activas</p>
                        <p className="text-gray-600 text-xs mt-2">¡Crea una para empezar!</p>
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
                {/* Espacio extra al final para que el FAB no tape nada si la lista es larga */}
                <div className="h-20"></div>
            </div>

            {/* MODAL CREADOR (Bottom Sheet) */}
            {showCreator && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Nueva Misión</h2>
                            <button onClick={() => setShowCreator(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Leer 30 min"
                                    autoFocus
                                    value={newMission.title}
                                    onChange={e => setNewMission({ ...newMission, title: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none mt-2 text-lg font-medium placeholder-gray-600 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frecuencia</label>
                                    <select value={newMission.frequency} onChange={e => setNewMission({ ...newMission, frequency: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none mt-2 appearance-none">
                                        <option value="daily">Diaria</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensual</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</label>
                                    <select value={newMission.type} onChange={e => setNewMission({ ...newMission, type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none mt-2 appearance-none">
                                        <option value="habit">Fija (Hábito)</option>
                                        <option value="temporal">Temporal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repeticiones</label>
                                    <input type="number" min="1" value={newMission.target} onChange={e => setNewMission({ ...newMission, target: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none mt-2" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dificultad</label>
                                    <select value={newMission.difficulty} onChange={e => setNewMission({ ...newMission, difficulty: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none mt-2 appearance-none">
                                        <option value="easy">Fácil (-5 Vida)</option>
                                        <option value="medium">Media (-3 Vida)</option>
                                        <option value="hard">Difícil (-1 Vida)</option>
                                        <option value="epic">Épica (0 Vida)</option>
                                    </select>
                                </div>
                            </div>

                            <button onClick={handleCreate} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-xl text-white font-bold shadow-lg shadow-blue-900/30 mt-4 active:scale-95 transition-transform hover:from-blue-500 hover:to-indigo-500">
                                Crear Misión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}