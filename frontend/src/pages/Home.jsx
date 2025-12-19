import { useState, useEffect } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import {
    Settings, X, ToggleLeft, ToggleRight,
    Dumbbell, Utensils, Trophy, Activity, CheckCircle, Zap, Coins,
    Clock, BarChart3, Gift, Calendar, Layers, MapPin, Gauge,
    // Iconos de Comida
    Sunrise, Sun, Sunset, Moon, Coffee,
    // Iconos Recompensas
    Star, Gamepad2
} from 'lucide-react';
import api from '../services/api';
import { getRewardForDay } from '../utils/rewardsGenerator';

// --- DND KIT ---
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableWidget from '../components/common/SortableWidget';

// --- WIDGETS ---
import DailyRewardModal from '../components/widgets/DailyRewardModal';
import MoodWidget from '../components/widgets/MoodWidget';
import WeightWidget from '../components/widgets/WeightWidget';
import FoodWidget from '../components/widgets/FoodWidget';
import StreakWidget from '../components/widgets/StreakWidget';
import GainsWidget from '../components/widgets/GainsWidget';
import TrainingWidget from '../components/widgets/TrainingWidget';
import SleepWidget from '../components/widgets/SleepWidget';
import StepsWidget from '../components/widgets/StepsWidget';
import MissionsWidget from '../components/widgets/MissionsWidget';
import SportWidget from '../components/widgets/SportWidget';
import WeeklyWidget from '../components/widgets/WeeklyWidget';

// --- SUB-COMPONENTES PARA MODALES CON PESTAÑAS ---

// 1. MODAL DETALLE DEPORTE
function SportDetailsModal({ workouts, onClose }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!workouts || workouts.length === 0) return null;
    const current = workouts[activeTab];

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-green-500" /> Deportes de Hoy
                    </h2>
                    <button onClick={onClose} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                {workouts.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto mb-4 pb-2 border-b border-gray-800">
                        {workouts.map((w, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === idx ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {w.routineName || `Actividad ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300 key={activeTab}">
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase mb-1">{current.routineName}</h3>
                        <div className="flex justify-center gap-2">
                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 font-mono">
                                {new Date(current.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1 rounded font-bold capitalize">
                                {current.intensity}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center">
                            <span className="text-blue-500 text-[10px] font-bold uppercase block mb-1 flex justify-center gap-1"><MapPin size={10} /> DISTANCIA</span>
                            <span className="text-white font-bold text-xl">{current.distance || 0} km</span>
                        </div>
                        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center">
                            <span className="text-orange-500 text-[10px] font-bold uppercase block mb-1 flex justify-center gap-1"><Clock size={10} /> TIEMPO</span>
                            <span className="text-white font-bold text-xl">{current.duration} min</span>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                        <span className="text-gray-500 text-xs">Calorías Quemadas (Aprox)</span>
                        <p className="text-2xl font-black text-white">{Math.round(current.duration * (current.intensity === 'Alta' ? 10 : current.intensity === 'Media' ? 7 : 4))} kcal</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 2. MODAL DETALLE GYM
function GymDetailsModal({ workouts, onClose }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!workouts || workouts.length === 0) return null;
    const current = workouts[activeTab];

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-blue-500" /> Rutinas de Hoy
                    </h2>
                    <button onClick={onClose} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                {workouts.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto mb-4 pb-2 border-b border-gray-800 shrink-0 custom-scrollbar">
                        {workouts.map((w, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === idx ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {w.name || `Rutina ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4 fade-in duration-300 key={activeTab}">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <div>
                            <h3 className="font-bold text-white text-xl">{current.name}</h3>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {Math.floor(current.duration / 60)} min</span>
                        </div>
                        <span className="bg-blue-900/30 text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-500/30">
                            {current.exercises?.length || 0} Ejercicios
                        </span>
                    </div>

                    <div className="space-y-3">
                        {current.exercises?.map((ex, i) => (
                            <div key={i} className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-200 font-bold text-sm">{ex.name}</span>
                                    <span className="text-gray-500 text-xs font-mono">{ex.sets.length} Sets</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ex.sets.map((s, j) => (
                                        <div key={j} className="bg-gray-900 px-2 py-1 rounded text-xs text-gray-400 border border-gray-800">
                                            <span className="text-white font-bold">{s.weight}kg</span> x {s.reps}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Volumen Total</p>
                        <p className="text-xl font-black text-white">
                            {current.exercises?.reduce((t, e) => t + e.sets.reduce((s, st) => s + (st.weight * st.reps), 0), 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">kg</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function Home() {
    const { user, setUser } = useOutletContext();
    const location = useLocation();

    // --- ESTADOS ---
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardData, setRewardData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // --- ESTADOS MODALES DE DETALLE ---
    const [selectedSportList, setSelectedSportList] = useState(null);
    const [selectedTrainingList, setSelectedTrainingList] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedMissions, setSelectedMissions] = useState(null);

    // --- CONFIGURACIÓN DE WIDGETS ---
    const [visibleWidgets, setVisibleWidgets] = useState(() => {
        try {
            const saved = localStorage.getItem('home_widgets_config');
            return saved ? JSON.parse(saved) : {
                missions: true, sport: true, food: true, sleep: true, steps: true,
                mood: true, weight: true, training: true, streak: true, gains: true,
                weekly: true
            };
        } catch (e) { return {}; }
    });

    const [widgetOrder, setWidgetOrder] = useState(() => {
        try {
            const saved = localStorage.getItem('home_widgets_order');
            return saved ? JSON.parse(saved) : [
                'missions', 'sport', 'food', 'sleep', 'steps',
                'mood', 'weight', 'training', 'streak', 'gains',
                'weekly'
            ];
        } catch (e) { return []; }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Helpers
    const getTodayString = () => new Date().toISOString().split('T')[0];
    const hasClaimedInDB = () => {
        if (!user?.dailyRewards?.lastClaimDate) return false;
        const last = new Date(user.dailyRewards.lastClaimDate).toISOString().split('T')[0];
        return last === getTodayString();
    };

    // --- LÓGICA DE RECOMPENSA ---
    useEffect(() => {
        if (!user) return;
        const checkReward = () => {
            const todayStr = getTodayString();
            const localLock = localStorage.getItem(`reward_lock_${todayStr}`);
            if (localLock === 'true') return;
            if (hasClaimedInDB()) {
                localStorage.setItem(`reward_lock_${todayStr}`, 'true');
                return;
            }
            const claimedDaysSafe = user.dailyRewards?.claimedDays || [];
            const currentStreak = (claimedDaysSafe.length % 7) + 1;

            setRewardData({
                currentDay: currentStreak,
                claimedDays: claimedDaysSafe,
                rewardOfDay: getRewardForDay(currentStreak),
                message: "¡RECOMPENSA DIARIA!",
                subMessage: "¡Reclama ahora!",
                buttonText: "RECLAMAR",
                isViewOnly: false
            });
            localStorage.setItem(`reward_lock_${todayStr}`, 'true');
            setShowRewardModal(true);
        };
        const timer = setTimeout(() => { checkReward(); }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleClaimReward = async () => {
        try {
            setShowRewardModal(false);
            const res = await api.post('/users/claim-daily');
            const updatedUser = { ...user, ...res.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error("Error reclamando:", error);
            setShowRewardModal(false);
            localStorage.removeItem(`reward_lock_${getTodayString()}`);
        }
    };

    const handleManualClick = () => {
        const claimedDaysSafe = user?.dailyRewards?.claimedDays || [];
        const currentStreak = (claimedDaysSafe.length % 7) + 1;
        const alreadyClaimed = hasClaimedInDB();
        setRewardData({
            currentDay: currentStreak,
            claimedDays: claimedDaysSafe,
            rewardOfDay: getRewardForDay(currentStreak),
            message: "Calendario de Premios",
            subMessage: alreadyClaimed ? "¡Ya has reclamado hoy!" : "¡Tienes recompensa pendiente!",
            buttonText: "CERRAR",
            isViewOnly: true
        });
        setShowRewardModal(true);
    };

    // --- CARGA DATOS ---
    useEffect(() => {
        const fetchDailyData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/daily');
                setDailyData(res.data || {});
                const userRes = await api.get('/users');
                if (userRes.data) {
                    setUser(userRes.data);
                    localStorage.setItem('user', JSON.stringify(userRes.data));
                }
            } catch (error) { setDailyData({}); }
            finally { setLoading(false); }
        };
        fetchDailyData();
    }, [location.key]);

    const handleUpdateWidget = async (type, value) => {
        try {
            const res = await api.put('/daily', { type, value });
            setDailyData(prev => ({ ...prev, [type]: res.data[type] }));
        } catch (error) { console.error(error); }
    };

    const toggleWidget = (key) => {
        const newState = { ...visibleWidgets, [key]: !visibleWidgets[key] };
        setVisibleWidgets(newState);
        localStorage.setItem('home_widgets_config', JSON.stringify(newState));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('home_widgets_order', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    const renderWidget = (key) => {
        if (!dailyData) return null;
        switch (key) {
            case 'missions':
                const stats = dailyData.missionStats || { completed: 0, total: 0, listCompleted: [] };
                return <div onClick={() => setSelectedMissions(stats)} className="cursor-pointer h-full"><MissionsWidget completed={stats.completed} total={stats.total} /></div>;

            case 'sport':
                return <div onClick={() => setSelectedSportList(dailyData.sportWorkouts || [])} className="cursor-pointer h-full"><SportWidget workouts={dailyData.sportWorkouts} /></div>;

            case 'training':
                return <div onClick={() => setSelectedTrainingList(dailyData.gymWorkouts || [])} className="cursor-pointer h-full"><TrainingWidget workouts={dailyData.gymWorkouts} /></div>;

            case 'food':
                const currentKcal = dailyData.totalKcal || dailyData.nutrition?.totalKcal || 0;
                const limitKcal = user?.macros?.calories || 2100;
                const foodData = dailyData.nutrition || { totalKcal: currentKcal };
                if (currentKcal === 0) return <Link to="/food" className="block h-full"><FoodWidget currentKcal={0} limitKcal={limitKcal} /></Link>;
                return <div onClick={() => setSelectedFood(foodData)} className="cursor-pointer h-full"><FoodWidget currentKcal={currentKcal} limitKcal={limitKcal} /></div>;

            case 'sleep': return <SleepWidget hours={dailyData.sleepHours} onUpdate={(val) => handleUpdateWidget('sleepHours', val)} />;
            case 'steps': return <StepsWidget steps={dailyData.steps} onUpdate={(val) => handleUpdateWidget('steps', val)} />;
            case 'mood': return <MoodWidget mood={dailyData.mood} onUpdate={(val) => handleUpdateWidget('mood', val)} />;
            case 'weight': return <div className="h-full flex flex-col"><WeightWidget initialWeight={dailyData.weight} onUpdate={(val) => handleUpdateWidget('weight', val)} /></div>;
            case 'streak': return <StreakWidget streak={user?.streak?.current || 1} />;
            case 'gains': return <Link to="/shop" className="block h-full"><GainsWidget totalCoins={user?.coins || 0} gameCoins={user?.stats?.gameCoins || 0} currentXP={user?.currentXP || 0} nextLevelXP={user?.nextLevelXP || 100} level={user?.level || 1} lives={user?.lives || 0} /></Link>;
            case 'weekly': return <div className="pointer-events-none h-full"><WeeklyWidget /></div>;

            default: return null;
        }
    };

    const widgetNames = {
        missions: 'Misiones', sport: 'Resumen Deporte', food: 'Nutrición', sleep: 'Sueño',
        steps: 'Pasos', mood: 'Estado de Ánimo', weight: 'Peso Corporal',
        training: 'Detalle Rutina', streak: 'Racha', gains: 'Ganancias', weekly: 'Progreso Semanal'
    };

    if (loading || !user) return <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-500 animate-pulse"><Activity size={48} className="text-blue-500 animate-spin" /><p>Cargando...</p></div>;

    const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-6 pb-6 animate-in fade-in select-none">
            {showRewardModal && (
                <DailyRewardModal data={rewardData} onClose={rewardData?.isViewOnly ? () => setShowRewardModal(false) : handleClaimReward} />
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Hola, <span className="text-blue-500 capitalize">{user?.username || 'Campeón'}</span></h1>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12} /> {todayStr}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleManualClick} className={`p-2 rounded-xl border ${hasClaimedInDB() ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'}`}><Gift size={20} /></button>
                    <button onClick={() => setShowSettings(true)} className="bg-gray-900 border border-gray-800 p-2 rounded-xl text-gray-400"><Settings size={20} /></button>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-4 auto-rows-fr grid-flow-dense">
                        {widgetOrder.map((key) => {
                            if (!visibleWidgets[key]) return null;
                            const isFullWidth = key === 'training' || key === 'missions' || key === 'weekly';
                            return <SortableWidget key={key} id={key} className={isFullWidth ? 'col-span-2' : 'col-span-1'}>{renderWidget(key)}</SortableWidget>;
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            {/* --- MODALES --- */}

            {/* SETTINGS */}
            {showSettings && (<div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center"><div className="bg-gray-900 p-6 rounded-3xl w-full max-w-sm"><div className="flex justify-between mb-4"><h2 className="text-white font-bold">Widgets</h2><button onClick={() => setShowSettings(false)}><X className="text-gray-400" /></button></div><div className="space-y-2 max-h-[60vh] overflow-y-auto">{Object.keys(widgetNames).map(key => <div key={key} onClick={() => toggleWidget(key)} className={`p-3 rounded border flex justify-between items-center ${visibleWidgets[key] ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700'}`}><span className="text-white">{widgetNames[key]}</span>{visibleWidgets[key] ? <ToggleRight className="text-blue-500" /> : <ToggleLeft className="text-gray-500" />}</div>)}</div></div></div>)}

            {/* 🔥 MODAL MISIONES DETALLADO (ESTILO PERFIL) 🔥 */}
            // ... imports (Asegúrate de importar HeartCrack o Heart si los usas)
            // Reemplazar la parte del modal de misiones con esto:

            {/* 🔥 MODAL MISIONES DETALLADO (ESTILO PERFIL) 🔥 */}
            {selectedMissions && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
                        <button onClick={() => setSelectedMissions(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm tracking-wider uppercase mb-1"><Trophy size={18} /> HISTORIAL</div>
                        <h2 className="text-2xl font-black text-white mb-4">Misiones</h2>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {selectedMissions.listCompleted && selectedMissions.listCompleted.length > 0 ? (
                                selectedMissions.listCompleted.map((m, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden group ${m.failed
                                            ? 'bg-red-950/30 border-red-500/30' // Estilo Fallida
                                            : 'bg-gray-950 border-gray-800/50' // Estilo Completada
                                        }`}>

                                        {/* Cabecera */}
                                        <div className="flex justify-between items-start relative z-10">
                                            <span className={`text-sm font-bold block line-clamp-2 ${m.failed ? 'text-red-200 line-through' : 'text-white'}`}>
                                                {m.title}
                                            </span>
                                            {m.failed ? (
                                                <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">FAIL</span>
                                            ) : (
                                                <CheckCircle size={16} className="text-green-500" />
                                            )}
                                        </div>

                                        {/* Etiquetas */}
                                        <div className="flex gap-2 relative z-10 flex-wrap">
                                            <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 uppercase font-bold">
                                                {m.frequency === 'daily' ? 'Diaria' : m.frequency || 'Misión'}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border text-gray-400 border-gray-700">
                                                {m.difficulty || 'Normal'}
                                            </span>
                                        </div>

                                        {/* Footer: Recompensas o Castigo */}
                                        <div className={`flex gap-3 mt-1 pt-2 border-t relative z-10 ${m.failed ? 'border-red-500/20' : 'border-gray-800'}`}>

                                            {m.failed ? (
                                                /* MODO FALLIDA: Muestra Vida Perdida */
                                                <div className="flex items-center gap-1 w-full justify-center">
                                                    <HeartCrack size={12} className="text-red-500 fill-red-500" />
                                                    <span className="text-xs font-bold text-red-400">
                                                        {m.hpLoss ? `-${m.hpLoss} HP` : 'Sin castigo'}
                                                    </span>
                                                </div>
                                            ) : (
                                                /* MODO COMPLETADA: Muestra Premios */
                                                <>
                                                    {(m.xpReward > 0) && (
                                                        <div className="flex items-center gap-1"><Star size={10} className="text-blue-400" /><span className="text-[10px] font-bold text-blue-200">+{m.xpReward} XP</span></div>
                                                    )}
                                                    {(m.coinReward > 0) && (
                                                        <div className="flex items-center gap-1"><Coins size={10} className="text-yellow-400" /><span className="text-[10px] font-bold text-yellow-200">+{m.coinReward}</span></div>
                                                    )}
                                                    {(m.gameCoinReward > 0) && (
                                                        <div className="flex items-center gap-1"><Gamepad2 size={10} className="text-purple-400" /><span className="text-[10px] font-bold text-purple-200">+{m.gameCoinReward}</span></div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-gray-950 rounded-xl border border-gray-800 text-gray-500 text-sm">
                                    <p>No hay registro de misiones.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* COMIDA (MODAL DETALLADO) */}
            {selectedFood && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Utensils className="text-blue-500" /> Nutrición
                            </h2>
                            <button onClick={() => setSelectedFood(null)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="text-center mb-8 relative">
                            <div className="inline-block relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                                <p className="text-5xl font-black text-white relative z-10">{selectedFood.totalKcal}</p>
                            </div>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Kcal Totales</p>
                        </div>
                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Desayuno', key: 'breakfast', icon: <Sunrise size={18} className="text-yellow-400" /> },
                                { label: 'Comida', key: 'lunch', icon: <Sun size={18} className="text-orange-500" /> },
                                { label: 'Merienda', key: 'merienda', icon: <Coffee size={18} className="text-amber-700" /> },
                                { label: 'Cena', key: 'dinner', icon: <Moon size={18} className="text-indigo-400" /> },
                                { label: 'Snacks', key: 'snacks', icon: <Zap size={18} className="text-purple-400" /> },
                            ].map((meal) => {
                                const kcal = selectedFood[meal.key] || 0;
                                const percent = selectedFood.totalKcal > 0 ? (kcal / selectedFood.totalKcal) * 100 : 0;
                                return (
                                    <div key={meal.key} className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-900 p-2 rounded-lg">{meal.icon}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-200">{meal.label}</span>
                                                <div className="w-16 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-mono text-white font-bold">{kcal} <span className="text-xs text-gray-500">kcal</span></span>
                                    </div>
                                );
                            })}
                        </div>
                        <Link to="/food" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-center shadow-lg active:scale-95 transition-all">
                            Gestionar Comidas
                        </Link>
                    </div>
                </div>
            )}

            {/* NUEVOS MODALES CON PESTAÑAS */}
            {selectedSportList && <SportDetailsModal workouts={selectedSportList} onClose={() => setSelectedSportList(null)} />}
            {selectedTrainingList && <GymDetailsModal workouts={selectedTrainingList} onClose={() => setSelectedTrainingList(null)} />}

        </div>
    );
}