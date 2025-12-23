import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Trash2, Plus, Zap, Repeat, X, Trophy, ChevronLeft, ChevronRight,
    Check, Coins, Star, CalendarClock, Target, Gamepad2, Clock, HeartCrack, Calendar, EyeOff
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

    const progressPercent = mission.target > 1 ? Math.min((mission.progress / mission.target) * 100, 100) : 0;
    const potentialDamage = { easy: 5, medium: 3, hard: 1, epic: 0 }[mission.difficulty] || 0;
    const daysMap = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };
    const showSpecificDays = mission.frequency === 'daily' && mission.specificDays && mission.specificDays.length > 0;

    return (
        <div className="relative w-full h-auto mb-3 select-none isolate overflow-hidden rounded-2xl">
            <div className={`absolute inset-0 flex items-center ${bgClass} -z-10 text-white font-bold px-6 justify-between`}>
                {dragX > 0 && <span className="flex gap-2"><Check /> Completar (+1)</span>}
                {dragX < 0 && <span className="flex gap-2 ml-auto">Eliminar <Trash2 /></span>}
            </div>

            <div style={cardStyle} onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)} onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)} onTouchEnd={handleEnd} onMouseDown={(e) => handleStart(e.clientX)} onMouseMove={(e) => handleMove(e.clientX)} onMouseUp={handleEnd} onMouseLeave={() => { if (isDragging) handleEnd() }} className={`relative bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-md h-full flex flex-col justify-between ${mission.completed ? 'opacity-50 grayscale border-transparent' : 'hover:border-gray-700'}`}>
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
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getDifficultyColor(mission.difficulty)}`}>{mission.difficulty}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold bg-gray-800 px-2 py-1 rounded">
                            {mission.frequency === 'daily' ? 'Diaria' : mission.frequency}
                        </span>
                        {showSpecificDays && (
                            <div className="flex gap-0.5 ml-1">
                                {mission.specificDays.sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)).map(d => (
                                    <span key={d} className="text-[8px] bg-gray-800 text-gray-400 w-4 h-4 flex items-center justify-center rounded-full font-bold border border-gray-700">{daysMap[d]}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-blue-600/10 px-2 py-1 rounded-lg border border-blue-500/20"><Star size={12} className="text-blue-400 fill-blue-400" /><span className="text-xs font-bold text-blue-200">+{mission.xpReward}</span></div>
                        <div className="flex items-center gap-1.5 bg-yellow-600/10 px-2 py-1 rounded-lg border border-yellow-500/20"><Coins size={12} className="text-yellow-400" /><span className="text-xs font-bold text-yellow-200">+{mission.coinReward}</span></div>
                        {potentialDamage > 0 && !mission.completed && (
                            <div className="flex items-center gap-1.5 bg-red-950/40 px-2 py-1 rounded-lg border border-red-500/30 ml-auto sm:ml-0">
                                <HeartCrack size={12} className="text-red-500" />
                                <span className="text-xs font-bold text-red-400">-{potentialDamage} HP</span>
                            </div>
                        )}
                    </div>
                </div>
                {mission.target > 1 && (
                    <div className="mt-4 pointer-events-none">
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wide">
                            <span className="flex items-center gap-1"><Target size={10} /> Progreso</span>
                            <span className={mission.completed ? 'text-green-500' : 'text-white'}>{mission.progress} / {mission.target}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
                            <div className="absolute inset-0 w-full h-full opacity-10 bg-white/5"></div>
                            <div className={`h-full transition-all duration-500 ease-out ${mission.completed ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                )}
                {!mission.completed && <div className="absolute right-4 bottom-4 text-gray-700 opacity-20 pointer-events-none"><div className="flex"><ChevronLeft size={16} /><ChevronRight size={16} /></div></div>}
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

    const [selectedDays, setSelectedDays] = useState([]);

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

    const daysOptions = [
        { label: 'L', value: 1 }, { label: 'M', value: 2 }, { label: 'X', value: 3 },
        { label: 'J', value: 4 }, { label: 'V', value: 5 }, { label: 'S', value: 6 }, { label: 'D', value: 0 },
    ];

    const toggleDay = (dayValue) => {
        setSelectedDays(prev => prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]);
    };

    // 🔥🔥 FILTRADO CORREGIDO: SOLO MUESTRA SI TOCA HOY 🔥🔥
    const getFilteredMissions = () => {
        const today = new Date().getDay(); // 0=Domingo, 1=Lunes, ...
        return missions.filter(m => {
            // 1. Filtro de Frecuencia
            if (m.frequency !== activeTab) return false;

            // 2. Si es DIARIA y tiene días específicos
            if (activeTab === 'daily' && m.specificDays && m.specificDays.length > 0) {
                // Si el día de HOY está incluido en los días de la misión -> SE MUESTRA
                // Si no -> SE OCULTA
                return m.specificDays.includes(today);
            }

            // Si no tiene días específicos o es otra frecuencia, mostrar
            return true;
        });
    };

    const filteredMissions = getFilteredMissions();

    const handleCreate = async () => {
        if (!newMission.title) return showToast("Escribe un título", "error");

        const payload = { ...newMission };
        if (newMission.frequency === 'daily' && selectedDays.length > 0) {
            payload.specificDays = selectedDays;
        }

        try {
            await api.post('/missions', payload);
            setShowCreator(false);
            setNewMission({ ...newMission, title: '', target: 1 });
            setSelectedDays([]);
            fetchMissions();

            // Comprobar si la misión creada se verá hoy o no
            const today = new Date().getDay();
            if (selectedDays.length > 0 && !selectedDays.includes(today)) {
                showToast("Creada (No visible hoy)", "info");
            } else {
                showToast("¡Misión creada!");
            }
        } catch (error) { showToast("Error creando misión", "error"); }
    };

    const getRewardValues = (freq, diff) => {
        const baseXP = 10; const baseCoins = 5;
        const diffMult = { easy: 1, medium: 2, hard: 3, epic: 5 };
        const freqMult = { daily: 1, weekly: 5, monthly: 15, yearly: 100 };
        const m1 = diffMult[diff] || 1; const m2 = freqMult[freq] || 1;
        const calculatedCoins = baseCoins * m1 * m2;
        return { xp: baseXP * m1 * m2, coins: calculatedCoins, gameCoins: calculatedCoins * 10 };
    };

    const getPotentialDamage = (diff) => { const rules = { easy: 5, medium: 3, hard: 1, epic: 0 }; return rules[diff] || 0; };
    // Función auxiliar para calcular fechas de caducidad
    // Función auxiliar para calcular fechas de caducidad
    const getPreviewExpirationText = (freq) => {
        const now = new Date();

        // Helper para formato: "Domingo 28 de Diciembre"
        const formatDate = (date) => {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            // Obtenemos string base: "domingo, 28 de diciembre"
            const raw = date.toLocaleDateString('es-ES', options);

            // Quitamos la coma y ponemos Mayúsculas en Día y Mes
            return raw
                .replace(',', '')
                .split(' ')
                .map(word => (word === 'de' ? word : word.charAt(0).toUpperCase() + word.slice(1)))
                .join(' ');
        };

        // CAMBIO AQUÍ: Ahora muestra la fecha de hoy en lugar de "Esta noche"
        if (freq === 'daily') {
            return formatDate(now);
        }

        if (freq === 'weekly') {
            // Calcular el próximo Domingo
            const day = now.getDay(); // 0 = Domingo
            const diff = day === 0 ? 0 : 7 - day;
            const nextSunday = new Date(now);
            nextSunday.setDate(now.getDate() + diff);
            return formatDate(nextSunday);
        }

        if (freq === 'monthly') {
            // Último día del mes actual
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return formatDate(lastDay);
        }

        if (freq === 'yearly') {
            // 31 de Diciembre del año actual
            const lastDay = new Date(now.getFullYear(), 11, 31);
            return formatDate(lastDay);
        }

        return "";
    };

    const handleComplete = async (mission) => {
        try {
            const res = await api.put(`/missions/${mission._id}/complete`);
            if (res.data.progressOnly) { setMissions(prev => prev.map(m => m._id === mission._id ? res.data.mission : m)); showToast("Progreso +1", "info"); return; }
            if (res.data.alreadyCompleted) { showToast("Ya completada", "info"); return; }
            if (res.data.user) { setUser(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user)); }
            setMissions(prev => prev.map(m => m._id === mission._id ? res.data.mission : m));
            const { xp, coins } = res.data.rewards || {};
            if (xp) showToast(`+${xp} XP | +${coins} 💰`, "success");
        } catch (e) { showToast("Error", "error"); }
    };

    const handleDelete = async (id) => { try { await api.delete(`/missions/${id}`); setMissions(prev => prev.filter(m => m._id !== id)); showToast("Eliminada", "info"); } catch (e) { } };
    const getDifficultyColor = (diff) => { switch (diff) { case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30'; case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'; case 'hard': return 'text-orange-400 bg-orange-500/10 border-orange-500/30'; case 'epic': return 'text-purple-400 bg-purple-500/10 border-purple-500/30'; default: return 'text-gray-400'; } };

    const previewRewards = getRewardValues(newMission.frequency, newMission.difficulty);
    const potentialDamage = getPotentialDamage(newMission.difficulty);
    const expirationText = getPreviewExpirationText(newMission.frequency);

    // Calcular si hoy está seleccionado para mostrar aviso
    const todayNum = new Date().getDay();
    const willBeVisibleToday = selectedDays.length === 0 || selectedDays.includes(todayNum);

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in select-none">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className="sticky top-0 bg-black/95 z-10 pb-4 pt-2 -mx-4 px-4 border-b border-gray-800 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400 fill-yellow-400" /> Misiones</h1>
                    <button onClick={() => setShowCreator(true)} className="bg-blue-600 p-2 rounded-xl text-white shadow-lg hover:bg-blue-500 transition-colors"><Plus size={20} /></button>
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
                    <div className="text-center py-20 opacity-50"><Trophy size={48} className="mx-auto text-gray-600 mb-2" /><p className="text-gray-400 text-sm">No hay misiones para hoy</p></div>
                ) : (
                    filteredMissions.map(m => (
                        <MissionCard key={m._id} mission={m} onComplete={handleComplete} onDelete={handleDelete} getDifficultyColor={getDifficultyColor} />
                    ))
                )}
                <div className="mt-8 mb-4 flex items-center justify-center gap-2 text-gray-500 opacity-60">
                    <CalendarClock size={14} />
                    <span className="text-xs font-mono font-medium tracking-wider">CADUCA: {expirationText}</span>
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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título</label>
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

                            {/* 🔥 SELECCIÓN DE DÍAS 🔥 */}
                            {newMission.frequency === 'daily' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar size={12} /> Días Específicos (Opcional)
                                    </label>
                                    <div className="flex justify-between mt-2 bg-gray-950 p-2 rounded-xl border border-gray-800">
                                        {daysOptions.map((day) => {
                                            const isSelected = selectedDays.includes(day.value);
                                            return (
                                                <button
                                                    key={day.value}
                                                    onClick={() => toggleDay(day.value)}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                                                        : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'
                                                        }`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* AVISO INTELIGENTE: Si la creas hoy pero no marcas hoy, te avisa */}
                                    {!willBeVisibleToday && (
                                        <p className="text-[10px] text-orange-400 mt-2 flex items-center justify-center gap-1 bg-orange-900/20 py-1 rounded border border-orange-500/20">
                                            <EyeOff size={10} /> No verás esta misión hasta que toque su día.
                                        </p>
                                    )}

                                    {willBeVisibleToday && (
                                        <p className="text-[10px] text-gray-500 mt-1 text-center">
                                            {selectedDays.length === 0 ? "Se repetirá todos los días" : "Aparecerá los días marcados"}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repeticiones</label><input type="number" min="1" value={newMission.target} onChange={e => setNewMission({ ...newMission, target: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mt-2" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dificultad</label><select value={newMission.difficulty} onChange={e => setNewMission({ ...newMission, difficulty: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mt-2"><option value="easy">Fácil (x1)</option><option value="medium">Media (x2)</option><option value="hard">Difícil (x3)</option><option value="epic">Épica (x5)</option></select></div>
                            </div>

                            <div className="space-y-2 mt-2">
                                <div className="bg-black/30 p-3 rounded-xl border border-gray-700 flex justify-between items-center px-4">
                                    <div className="text-xs text-gray-400 font-bold uppercase">Recompensas:</div>
                                    <div className="flex gap-3">
                                        <span className="flex items-center gap-1 text-blue-400 font-bold text-xs"><Star size={12} /> +{previewRewards.xp}</span>
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold text-xs"><Coins size={12} /> +{previewRewards.coins}</span>
                                    </div>
                                </div>
                                {potentialDamage > 0 && (
                                    <div className="bg-red-950/20 p-3 rounded-xl border border-red-900/30 flex justify-between items-center px-4">
                                        <div className="text-xs text-red-400/80 font-bold uppercase">Castigo por Fallar:</div>
                                        <div className="flex gap-3"><span className="flex items-center gap-1 text-red-500 font-bold text-xs"><HeartCrack size={12} /> -{potentialDamage} HP</span></div>
                                    </div>
                                )}
                            </div>

                            <button onClick={handleCreate} className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform mt-4">Crear Misión</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}