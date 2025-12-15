import { useState, useEffect } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import {
    Settings, X, Eye, EyeOff, ToggleLeft, ToggleRight,
    Dumbbell, Utensils, Trophy, Activity, CheckCircle, Zap, Coins, Clock, BarChart3, Gift
} from 'lucide-react';
import api from '../services/api';
import { getRewardForDay } from '../utils/rewardsGenerator'; // Asegúrate de tener este archivo creado

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

export default function Home() {
    const { user, setUser } = useOutletContext();
    const location = useLocation();

    // Estados para Recompensa Diaria
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardData, setRewardData] = useState(null);

    const [dailyData, setDailyData] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // --- ESTADOS MODALES ---
    const [selectedSport, setSelectedSport] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedMissions, setSelectedMissions] = useState(null);

    // VISIBILIDAD
    const [visibleWidgets, setVisibleWidgets] = useState(() => {
        const saved = localStorage.getItem('home_widgets_config');
        return saved ? JSON.parse(saved) : {
            missions: true, sport: true, food: true, sleep: true, steps: true,
            mood: true, weight: true, training: true, streak: true, gains: true
        };
    });

    // ORDEN
    const [widgetOrder, setWidgetOrder] = useState(() => {
        const saved = localStorage.getItem('home_widgets_order');
        return saved ? JSON.parse(saved) : [
            'missions', 'sport', 'food', 'sleep', 'steps',
            'mood', 'weight', 'training', 'streak', 'gains'
        ];
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- HELPER: Calcular Día Actual del Usuario ---
    const getUserCurrentDay = () => {
        if (!user || !user.createdAt) return 1;
        const start = new Date(user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    };

    // --- HELPER: Verificar si ya reclamó hoy ---
    const hasClaimedToday = () => {
        if (!user || !user.dailyRewards || !user.dailyRewards.lastClaimDate) return false;
        const last = new Date(user.dailyRewards.lastClaimDate);
        const today = new Date();
        return (
            last.getDate() === today.getDate() &&
            last.getMonth() === today.getMonth() &&
            last.getFullYear() === today.getFullYear()
        );
    };

    // 1. LÓGICA DE RECOMPENSA DIARIA (AUTOMÁTICA AL ENTRAR)
    useEffect(() => {
        if (!user) return;

        const autoClaim = async () => {
            if (!hasClaimedToday()) {
                try {
                    const currentDay = getUserCurrentDay();
                    const reward = getRewardForDay(currentDay);

                    const res = await api.post('/users/claim-daily');

                    setRewardData({
                        currentDay: currentDay,
                        claimedDays: res.data.dailyRewards?.claimedDays || [],
                        rewardOfDay: reward,
                        message: "¡Día " + currentDay + " Completado!",
                        subMessage: "Recompensa diaria reclamada.",
                        buttonText: "¡GENIAL!"
                    });
                    setShowRewardModal(true);
                    setUser(prev => ({ ...prev, ...res.data }));
                } catch (error) {
                    console.log("Error auto-claim:", error);
                }
            }
        };
        autoClaim();
    }, [user?._id]);

    // 2. BOTÓN MANUAL (REGALO)
    const handleManualClick = () => {
        const currentDay = getUserCurrentDay();
        const claimedDays = user.dailyRewards?.claimedDays || [];
        const reward = getRewardForDay(currentDay);

        if (hasClaimedToday()) {
            // MODO SOLO VER (Informativo)
            setRewardData({
                currentDay: currentDay,
                claimedDays: claimedDays,
                rewardOfDay: reward,
                message: "Calendario de Premios",
                subMessage: "Vuelve mañana para el siguiente día.",
                buttonText: "CERRAR",
                isViewOnly: true
            });
            setShowRewardModal(true);
        } else {
            // MODO RECLAMAR (Fallback manual)
            const claim = async () => {
                try {
                    const res = await api.post('/users/claim-daily');
                    setRewardData({
                        currentDay: currentDay,
                        claimedDays: res.data.dailyRewards?.claimedDays || [],
                        rewardOfDay: reward,
                        message: "¡Día " + currentDay + " Reclamado!",
                        subMessage: "Has recogido tu premio manual.",
                        buttonText: "¡VAMOS!"
                    });
                    setShowRewardModal(true);
                    setUser(prev => ({ ...prev, ...res.data }));
                } catch (error) {
                    setRewardData({
                        currentDay: currentDay,
                        claimedDays: claimedDays,
                        rewardOfDay: reward,
                        message: "Ya Procesado",
                        subMessage: "Tu recompensa ya está en tu cuenta.",
                        buttonText: "ENTENDIDO",
                        isViewOnly: true
                    });
                    setShowRewardModal(true);
                }
            };
            claim();
        }
    };

    // 3. CARGA DE DATOS DIARIOS (WIDGETS)
    useEffect(() => {
        const fetchDailyData = async () => {
            try {
                const res = await api.get('/daily');
                setDailyData(res.data);

                if (res.data.user) {
                    setUser(prev => ({ ...prev, ...res.data.user }));
                }
            } catch (error) { console.error("Error cargando daily log", error); }
        };
        fetchDailyData();
    }, [setUser, location.key]);

    // 4. MEDIANOCHE
    useEffect(() => {
        const checkMidnight = () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() <= 5) {
                window.location.reload();
            }
        };
        const interval = setInterval(checkMidnight, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleUserUpdate = (u) => {
        setUser(prev => ({ ...prev, ...u }));
    };

    const toggleWidget = (key) => {
        const newState = { ...visibleWidgets, [key]: !visibleWidgets[key] };
        setVisibleWidgets(newState);
        localStorage.setItem('home_widgets_config', JSON.stringify(newState));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('home_widgets_order', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    const handleUpdateWidget = async (type, value) => {
        try {
            const res = await api.put('/daily', { type, value });
            setDailyData(prev => ({ ...prev, [type]: res.data[type] }));

            if (res.data.user) {
                setUser(prev => ({ ...prev, ...res.data.user }));
            }
        } catch (error) { console.error(error); }
    };

    // --- RENDERIZADOR ---
    const renderWidget = (key) => {
        if (!dailyData) return null;

        switch (key) {
            case 'missions':
                const stats = dailyData.missionStats || { completed: 0, total: 0, listCompleted: [] };
                const dailyGoal = stats.total || 0;
                let dailyCompletedCount = stats.listCompleted
                    ? stats.listCompleted.filter(m => !m.type || m.type === 'daily').length
                    : 0;

                if (dailyCompletedCount === 0 && stats.completed > 0) {
                    dailyCompletedCount = stats.completed;
                }

                const showWidget = dailyGoal > 0 || dailyCompletedCount > 0;

                if (!showWidget) {
                    return (
                        <Link to="/missions" className="block h-full">
                            <MissionsWidget completed={0} total={0} />
                        </Link>
                    );
                }

                return (
                    <div
                        onClick={() => setSelectedMissions(stats)}
                        className="cursor-pointer transition-all active:scale-[0.99] h-full"
                    >
                        <MissionsWidget
                            completed={dailyCompletedCount}
                            total={dailyGoal}
                            list={stats.listCompleted}
                        />
                    </div>
                );

            case 'sport':
                if (!dailyData.sportWorkout) return <Link to="/gym" className="block h-full"><SportWidget workout={null} /></Link>;
                return <div onClick={() => setSelectedSport(dailyData.sportWorkout)} className="cursor-pointer transition-all active:scale-[0.98] h-full"><SportWidget workout={dailyData.sportWorkout} /></div>;

            case 'training':
                const gymData = dailyData.gymWorkout;
                // Solo mostramos completado si hay ejercicios registrados
                const hasWorkout = gymData && gymData.exercises && gymData.exercises.length > 0;

                if (!hasWorkout) {
                    return <Link to="/gym" className="block h-full"><TrainingWidget workout={null} /></Link>;
                }

                return (
                    <div onClick={() => setSelectedTraining(gymData)} className="cursor-pointer transition-all active:scale-[0.99] h-full">
                        <TrainingWidget workout={gymData} />
                    </div>
                );

            case 'food':
                const currentKcal = dailyData.totalKcal || dailyData.nutrition?.totalKcal || 0;
                const limitKcal = user?.macros?.calories || user?.calorieGoal || 2100;
                const foodData = dailyData.nutrition || { totalKcal: currentKcal, breakfast: 0, lunch: 0, dinner: 0, snacks: 0, merienda: 0 };

                if (currentKcal === 0) {
                    return <Link to="/food" className="block h-full cursor-pointer hover:opacity-90 active:scale-95 transition-all"><FoodWidget currentKcal={0} limitKcal={limitKcal} /></Link>;
                }
                return <div onClick={() => setSelectedFood(foodData)} className="cursor-pointer transition-all active:scale-[0.99] h-full"><FoodWidget currentKcal={currentKcal} limitKcal={limitKcal} /></div>;

            case 'sleep': return <SleepWidget hours={dailyData.sleepHours} onUpdate={(val) => handleUpdateWidget('sleepHours', val)} />;
            case 'steps': return <StepsWidget steps={dailyData.steps} onUpdate={(val) => handleUpdateWidget('steps', val)} />;
            case 'mood': return <MoodWidget mood={dailyData.mood} onUpdate={(val) => handleUpdateWidget('mood', val)} />;
            case 'weight': return <div className="h-full flex flex-col"><WeightWidget initialWeight={dailyData.weight} onUpdate={(val) => handleUpdateWidget('weight', val)} /></div>;

            case 'streak':
                const currentStreak = user?.streak?.current || 1;
                return <StreakWidget streak={currentStreak} />;

            case 'gains':
                return (
                    <Link to="/shop" className="block h-full cursor-pointer hover:opacity-95 transition-all active:scale-95">
                        <GainsWidget
                            totalCoins={user?.coins || 0}
                            currentXP={user?.currentXP || 0}
                            nextLevelXP={user?.nextLevelXP || 100}
                            level={user?.level || 1}
                            lives={user?.lives || 0}
                        />
                    </Link>
                );

            default: return null;
        }
    };

    const widgetNames = {
        missions: 'Misiones', sport: 'Resumen Deporte', food: 'Nutrición', sleep: 'Sueño',
        steps: 'Pasos', mood: 'Estado de Ánimo', weight: 'Peso Corporal',
        training: 'Detalle Rutina', streak: 'Racha', gains: 'Ganancias'
    };

    return (
        <div className="space-y-6 pb-6 animate-in fade-in select-none">

            {showRewardModal && (
                <DailyRewardModal
                    data={rewardData}
                    onClose={() => setShowRewardModal(false)}
                />
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">
                        Hola, <span className="text-blue-500 capitalize">{user?.username || user?.name || 'Campeón'}</span>
                    </h1>
                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* BOTÓN REGALO */}
                    <button
                        onClick={handleManualClick}
                        className={`p-2 rounded-xl transition-all active:scale-95 border ${hasClaimedToday() ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400 hover:text-white hover:bg-yellow-600'}`}
                    >
                        <Gift size={20} />
                    </button>

                    {/* BOTÓN SETTINGS */}
                    <button onClick={() => setShowSettings(true)} className="bg-gray-900 border border-gray-800 p-2 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-4 auto-rows-fr grid-flow-dense">
                        {widgetOrder.map((key) => {
                            if (!visibleWidgets[key]) return null;
                            const isFullWidth = key === 'training' || key === 'missions';
                            return <SortableWidget key={key} id={key} className={isFullWidth ? 'col-span-2' : 'col-span-1'}>{renderWidget(key)}</SortableWidget>;
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            {/* MODAL SETTINGS */}
            {showSettings && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 p-6 shadow-2xl h-[70vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-gray-400" /> Configurar Widgets</h2><button onClick={() => setShowSettings(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button></div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {Object.keys(widgetNames).map((key) => (
                                <div key={key} onClick={() => toggleWidget(key)} className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer ${visibleWidgets[key] ? 'bg-blue-900/20 border-blue-500/30' : 'bg-gray-800/30 border-gray-800 opacity-60'}`}>
                                    <div className="flex items-center gap-3">{visibleWidgets[key] ? <Eye size={18} className="text-blue-400" /> : <EyeOff size={18} className="text-gray-500" />}<span className={`font-bold ${visibleWidgets[key] ? 'text-white' : 'text-gray-500'}`}>{widgetNames[key]}</span></div>
                                    <div className={visibleWidgets[key] ? 'text-blue-500' : 'text-gray-600'}>{visibleWidgets[key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MISIONES */}
            {selectedMissions && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedMissions(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X size={20} /></button>

                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm tracking-wider uppercase mb-1">
                            <Trophy size={18} /> MISIONES
                        </div>
                        <h2 className="text-3xl font-black text-white capitalize mb-4">Completadas</h2>

                        <div className="space-y-3">
                            {selectedMissions.listCompleted && selectedMissions.listCompleted.length > 0 ? (
                                selectedMissions.listCompleted.map((m, idx) => (
                                    <div key={idx} className="bg-black/40 p-4 rounded-xl border border-gray-800/50 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-white text-sm font-bold block">{m.title}</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${m.frequency === 'daily' ? 'bg-blue-900/30 text-blue-300 border-blue-500/30' :
                                                    m.frequency === 'weekly' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' :
                                                        'bg-gray-800 text-gray-400 border-gray-700'
                                                }`}>
                                                {m.frequency === 'daily' ? 'Diaria' : m.frequency === 'weekly' ? 'Semanal' : m.frequency || 'Misión'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${m.type === 'habit' ? 'bg-green-900/30 text-green-300 border-green-500/30' :
                                                    'bg-orange-900/30 text-orange-300 border-orange-500/30'
                                                }`}>
                                                {m.type === 'habit' ? 'Hábito' : 'Tarea'}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 mt-1 pt-2 border-t border-gray-800">
                                            {m.xpReward > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-blue-400 font-bold">
                                                    <Zap size={12} /> +{m.xpReward} XP
                                                </span>
                                            )}
                                            {m.coinReward > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                                                    <Coins size={12} /> +{m.coinReward}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-950 rounded-xl border border-gray-800">
                                    <p>No hay misiones completadas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SPORT */}
            {selectedSport && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedSport(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-sm tracking-wider uppercase mb-1"><Activity size={18} /> DEPORTE</div>
                        <h2 className="text-3xl font-black text-white capitalize mb-4">{selectedSport.routineName}</h2>
                        <div className="inline-block bg-green-900/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 tracking-wide mb-6">COMPLETADO</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><span className="text-blue-500 text-[10px] font-bold uppercase block mb-1">DISTANCIA</span><span className="text-white font-bold text-xl">{selectedSport.distance || 0} km</span></div>
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><span className="text-red-500 text-[10px] font-bold uppercase block mb-1">INTENSIDAD</span><span className="text-white font-bold text-xl capitalize">{selectedSport.intensity || '-'}</span></div>
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 col-span-2 flex justify-between items-center"><span className="text-green-500 text-[10px] font-bold uppercase">TIEMPO TOTAL</span><span className="text-white font-bold text-2xl">{selectedSport.duration} min</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FOOD */}
            {selectedFood && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedFood(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase mb-1"><Utensils size={18} /> NUTRICIÓN</div>
                        <h2 className="text-3xl font-black text-white mb-1">{selectedFood.totalKcal} <span className="text-lg text-gray-500 font-bold">kcal</span></h2>
                        <div className="space-y-3 mt-4">
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Desayuno</span><span className="text-white font-bold">{selectedFood.breakfast || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Snacks</span><span className="text-white font-bold">{selectedFood.snacks || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Comida</span><span className="text-white font-bold">{selectedFood.lunch || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Merienda</span><span className="text-white font-bold">{selectedFood.merienda || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Cena</span><span className="text-white font-bold">{selectedFood.dinner || 0} kcal</span></div>
                        </div>
                        <div className="mt-6"><Link to="/food" className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-center transition-all">Editar Registro</Link></div>
                    </div>
                </div>
            )}

            {/* MODAL RUTINA (GYM) */}
            {selectedTraining && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[85vh]">

                        <div className="flex justify-between items-start mb-4 shrink-0">
                            <div>
                                <div className="flex items-center gap-2 text-blue-500 font-bold text-sm tracking-wider uppercase mb-1">
                                    <Dumbbell size={18} /> GIMNASIO
                                </div>
                                <h2 className="text-2xl font-black text-white capitalize leading-tight">
                                    {selectedTraining.name || selectedTraining.routineName}
                                </h2>
                                <div className="flex gap-3 mt-2 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded">
                                        <Clock size={12} /> {Math.floor((selectedTraining.duration || 0) / 60)} min
                                    </span>
                                    <span className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded">
                                        <BarChart3 size={12} />
                                        {selectedTraining.exercises?.reduce((total, ex) =>
                                            total + ex.sets.reduce((sTotal, s) => sTotal + (s.weight * s.reps), 0), 0
                                        ).toLocaleString()} kg Vol.
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTraining(null)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {selectedTraining.exercises.map((ex, idx) => (
                                <div key={idx} className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50">
                                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                                        <span className="text-white font-bold text-sm truncate">{ex.name}</span>
                                        <span className="text-gray-500 text-[9px] font-bold uppercase bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                                            {ex.sets.length} Series
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ex.sets.map((set, sIdx) => (
                                            <div key={sIdx} className="bg-gray-900 border border-gray-800 rounded px-1 py-1 text-center flex flex-col justify-center">
                                                <div className="text-blue-400 font-bold text-xs">{set.weight}<span className="text-[8px] text-gray-600">kg</span></div>
                                                <div className="text-gray-500 text-[9px]">{set.reps} reps</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-800 text-center">
                            <Link to="/gym" className="text-xs text-blue-500 font-bold hover:underline">VER HISTORIAL COMPLETO</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}