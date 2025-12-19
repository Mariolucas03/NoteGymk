import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    User, Trophy, Coins, Activity, Dumbbell, Utensils,
    X, CheckCircle, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Zap,
    LogOut, Gamepad2, Star, MapPin, Gauge,
    // Iconos Comida
    Sunrise, Sun, Sunset, Moon, Coffee
} from 'lucide-react';
import api from '../services/api';

// --- WIDGETS ---
import MoodWidget from '../components/widgets/MoodWidget';
import WeightWidget from '../components/widgets/WeightWidget';
import FoodWidget from '../components/widgets/FoodWidget';
import StreakWidget from '../components/widgets/StreakWidget';
import TrainingWidget from '../components/widgets/TrainingWidget';
import SleepWidget from '../components/widgets/SleepWidget';
import StepsWidget from '../components/widgets/StepsWidget';
import MissionsWidget from '../components/widgets/MissionsWidget';
import SportWidget from '../components/widgets/SportWidget';
import GainsWidget from '../components/widgets/GainsWidget';
import WeeklyWidget from '../components/widgets/WeeklyWidget';
import RPGBody from '../components/profile/RPGBody';

// --- NUEVO COMPONENTE DE ESTADÍSTICAS ---
import ProfileStats from '../components/profile/ProfileStats';

// ==========================================
// SUB-COMPONENTES MODALES
// ==========================================

function SportDetailsModal({ workouts, onClose }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!workouts || workouts.length === 0) return null;
    const current = workouts[activeTab];

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-green-500" /> Historial Deportes
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

function GymDetailsModal({ workouts, onClose }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!workouts || workouts.length === 0) return null;
    const current = workouts[activeTab];

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-blue-500" /> Historial Gym
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

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Profile() {
    const { user, setUser } = useOutletContext();
    const navigate = useNavigate();

    // --- ESTADO FECHA ---
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());

    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- ESTADOS PARA LOS MODALES DE WIDGETS MINI ---
    const [openMuscleMap, setOpenMuscleMap] = useState(false);
    const [openStrength, setOpenStrength] = useState(false);

    // --- ESTADO ORDEN Y VISIBILIDAD ---
    const [widgetOrder, setWidgetOrder] = useState([]);
    const [visibleWidgets, setVisibleWidgets] = useState({});

    // Modales Detalle
    const [selectedSportList, setSelectedSportList] = useState(null);
    const [selectedTrainingList, setSelectedTrainingList] = useState(null);

    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedMissions, setSelectedMissions] = useState(null);

    // --- LOGICA DE CERRAR SESIÓN ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (setUser) setUser(null);
        navigate('/login');
    };

    // 1. CARGAR CONFIGURACIÓN
    useEffect(() => {
        const savedOrder = localStorage.getItem('home_widgets_order');
        const savedConfig = localStorage.getItem('home_widgets_config');

        setWidgetOrder(savedOrder ? JSON.parse(savedOrder) : [
            'missions', 'sport', 'food', 'sleep', 'steps',
            'mood', 'weight', 'training', 'streak', 'gains',
            'weekly' // <--- AÑADIDO POR DEFECTO
        ]);

        setVisibleWidgets(savedConfig ? JSON.parse(savedConfig) : {
            missions: true, sport: true, food: true, sleep: true, steps: true,
            mood: true, weight: true, training: true, streak: true, gains: true,
            weekly: true // <--- ACTIVADO POR DEFECTO
        });
    }, []);

    // 2. CARGAR DATOS HISTÓRICOS
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/daily/specific?date=${selectedDate}`);
                setDailyData(res.data);
            } catch (error) {
                console.error("Error cargando historial:", error);
                setDailyData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [selectedDate]);

    // --- CALENDARIO VISUAL ---
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };
    const handlePrevMonth = () => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
    const handleDayClick = (day) => {
        const year = calendarViewDate.getFullYear();
        const month = String(calendarViewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const fullDate = `${year}-${month}-${dayStr}`;
        if (new Date(fullDate) > new Date()) return;
        setSelectedDate(fullDate);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarViewDate);
        const firstDay = getFirstDayOfMonth(calendarViewDate);
        const days = [];
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);

        for (let i = 1; i <= daysInMonth; i++) {
            const currentYear = calendarViewDate.getFullYear();
            const currentMonth = String(calendarViewDate.getMonth() + 1).padStart(2, '0');
            const dateStr = `${currentYear}-${currentMonth}-${String(i).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isFuture = new Date(dateStr) > new Date();

            days.push(
                <button
                    key={i} onClick={() => handleDayClick(i)} disabled={isFuture}
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110' : isFuture ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    {i}
                    {isToday && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></div>}
                </button>
            );
        }

        return (
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-3xl mb-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400"><ChevronLeft size={20} /></button>
                    <span className="text-white font-bold capitalize">{monthNames[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}</span>
                    <button onClick={handleNextMonth} className={`p-1 rounded-lg ${new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1) > new Date() ? 'text-gray-800 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800'}`} disabled={new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1) > new Date()}><ChevronRight size={20} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (<span key={d} className="text-[10px] font-bold text-gray-600">{d}</span>))}</div>
                <div className="grid grid-cols-7 gap-1 place-items-center">{days}</div>
                <div className="mt-4 pt-3 border-t border-gray-800 text-center"><span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Viendo datos del: {selectedDate}</span></div>
            </div>
        );
    };

    const handleReadOnlyClick = () => { };

    // --- RENDERIZADO WIDGETS ---
    const renderWidgetByKey = (key) => {
        if (loading) return null;
        if (!dailyData && !loading) return null;

        switch (key) {
            case 'missions':
                const stats = dailyData.missionStats || { completed: 0, total: 0, listCompleted: [] };
                return (
                    <div onClick={() => setSelectedMissions(stats)} className="cursor-pointer h-full">
                        <MissionsWidget completed={stats.completed} total={stats.total} />
                    </div>
                );

            case 'sport':
                if (!dailyData.sportWorkouts || dailyData.sportWorkouts.length === 0) return null;
                return <div onClick={() => setSelectedSportList(dailyData.sportWorkouts)} className="cursor-pointer h-full"><SportWidget workouts={dailyData.sportWorkouts} /></div>;

            case 'training':
                if (!dailyData.gymWorkouts || dailyData.gymWorkouts.length === 0) return null;
                return <div onClick={() => setSelectedTrainingList(dailyData.gymWorkouts)} className="cursor-pointer h-full"><TrainingWidget workouts={dailyData.gymWorkouts} /></div>;

            case 'food':
                const currentKcal = dailyData.totalKcal || dailyData.nutrition?.totalKcal || 0;
                const limitKcal = user?.macros?.calories || 2100;
                return <div onClick={() => setSelectedFood(dailyData.nutrition)} className="cursor-pointer h-full"><FoodWidget currentKcal={currentKcal} limitKcal={limitKcal} /></div>;

            case 'sleep': return <div className="pointer-events-none opacity-90"><SleepWidget hours={dailyData.sleepHours} onUpdate={handleReadOnlyClick} /></div>;
            case 'steps': return <div className="pointer-events-none opacity-90"><StepsWidget steps={dailyData.steps} onUpdate={handleReadOnlyClick} /></div>;
            case 'mood': return <div className="pointer-events-none"><MoodWidget mood={dailyData.mood} onUpdate={handleReadOnlyClick} /></div>;
            case 'weight': return <div className="pointer-events-none opacity-90 h-full flex flex-col"><WeightWidget initialWeight={dailyData.weight} onUpdate={handleReadOnlyClick} /></div>;
            case 'streak': return <div className="pointer-events-none"><StreakWidget streak={dailyData.streakCurrent || 0} /></div>;

            // 🔥 WIDGET GAINS: AHORA MUESTRA TOTALES GLOBALES DEL USUARIO (IGUAL QUE HOME) 🔥
            case 'gains':
                return (
                    <div className="pointer-events-none h-full">
                        <GainsWidget
                            totalCoins={user?.coins || 0}            // TOTAL GLOBAL
                            gameCoins={user?.stats?.gameCoins || 0}  // TOTAL GLOBAL
                            currentXP={user?.currentXP || 0}         // TOTAL GLOBAL
                            level={user?.level}
                            lives={user?.lives}
                            nextLevelXP={user?.nextLevelXP || 100}
                        />
                    </div>
                );

            case 'weekly': return null; // Opcional: Ocultar o mostrar según prefieras

            default: return null;
        }
    };

    if (loading || !user) return <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-500 animate-pulse"><Activity size={48} className="text-blue-500 animate-spin" /><p>Cargando...</p></div>;

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in">
            {/* HEADER */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 bg-blue-500 blur-3xl rounded-full w-40 h-40 -mr-10 -mt-10"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-xl">
                        <User size={40} className="text-gray-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-wide">{user?.username || 'Usuario'}</h1>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mt-1">
                            <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">Nivel {user?.level}</span>
                            <span className="flex items-center gap-1 text-yellow-500"><Coins size={14} /> {user?.coins}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 relative z-10">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                        <span>XP Actual</span>
                        <span>{user?.currentXP} / {user?.nextLevelXP} XP</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${Math.min((user?.currentXP / user?.nextLevelXP) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>

            {/* AVATAR RPG + GRÁFICAS (AHORA EN GRID) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* 1. Widget Mapa Muscular */}
                <RPGBody mini={true} onClick={() => setOpenMuscleMap(true)} />

                {/* 2. Widget Fuerza */}
                <ProfileStats mini={true} onClick={() => setOpenStrength(true)} />
            </div>

            {/* CALENDARIO */}
            {renderCalendar()}

            {/* WIDGETS DEL DÍA SELECCIONADO */}
            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse flex flex-col items-center">
                    <Activity size={32} className="mb-2" />
                    <p>Viajando al {selectedDate}...</p>
                </div>
            ) : !dailyData ? (
                <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <CalendarIcon size={48} className="opacity-20" />
                    <p>No hay registros en este día.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                    {widgetOrder.map((key) => {
                        if (!visibleWidgets[key]) return null;
                        const isFullWidth = key === 'training' || key === 'missions' || key === 'weekly';
                        const widgetContent = renderWidgetByKey(key);
                        if (!widgetContent) return null;
                        return <div key={key} className={isFullWidth ? 'col-span-2' : 'col-span-1'}>{widgetContent}</div>;
                    })}
                </div>
            )}

            {/* --- SECCIÓN DE AJUSTES Y LOGOUT --- */}
            <div className="mt-10 border-t border-gray-800 pt-6 px-2">
                <h3 className="text-gray-500 font-bold text-xs uppercase ml-1 mb-3">Configuración de Cuenta</h3>
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-950/20 border border-red-900/30 hover:bg-red-900/40 text-red-500 p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-95"
                >
                    <div className="flex items-center gap-3">
                        <LogOut size={20} />
                        <span className="font-bold">Cerrar Sesión</span>
                    </div>
                </button>
                <p className="text-center text-gray-700 text-[10px] mt-4 font-mono">
                    ID: {user?._id}
                </p>
            </div>

            {/* --- ZONA DE DEBUG --- */}
            <div className="mt-8 mb-4 border-t border-gray-800 pt-4">
                <p className="text-[10px] text-gray-600 text-center mb-2 uppercase font-bold">Zona de Pruebas</p>
                <button
                    onClick={async () => {
                        if (!window.confirm("¿Generar un entreno falso hace 8 días?")) return;
                        try {
                            await api.post('/gym/seed-history');
                            alert("✅ ¡Listo! Se ha creado un entreno la semana pasada.");
                        } catch (e) {
                            alert("Error: " + e.message);
                        }
                    }}
                    className="w-full py-2 bg-purple-900/20 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-900/40 transition-colors"
                >
                    <Zap size={14} /> INYECTAR DATOS PASADOS
                </button>
            </div>

            {/* --- MODALES DETALLE (SOLO LECTURA) --- */}

            {/* MODAL MAPA MUSCULAR COMPLETO */}
            {openMuscleMap && (
                <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-4xl h-[90vh] overflow-y-auto relative bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl p-2 sm:p-6 flex flex-col">
                        <button onClick={() => setOpenMuscleMap(false)} className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-white hover:bg-gray-700 z-50"><X /></button>
                        <RPGBody />
                    </div>
                </div>
            )}

            {/* MODAL FUERZA COMPLETO */}
            {openStrength && (
                <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-2xl bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl p-2 sm:p-6 relative">
                        <button onClick={() => setOpenStrength(false)} className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-white hover:bg-gray-700 z-50"><X /></button>
                        <ProfileStats />
                    </div>
                </div>
            )}

            {/* MODAL HISTORIAL DE MISIONES */}
            {selectedMissions && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
                        <button onClick={() => setSelectedMissions(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm tracking-wider uppercase mb-1"><Trophy size={18} /> HISTORIAL</div>
                        <h2 className="text-2xl font-black text-white mb-4">Misiones</h2>

                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {selectedMissions.listCompleted && selectedMissions.listCompleted.length > 0 ? (
                                selectedMissions.listCompleted.map((m, idx) => (
                                    <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-gray-800/50 flex flex-col gap-2 relative overflow-hidden group">

                                        {/* Título y Tipo */}
                                        <div className="flex justify-between items-start relative z-10">
                                            <span className="text-white text-sm font-bold block line-clamp-2">{m.title}</span>
                                        </div>

                                        {/* Etiquetas */}
                                        <div className="flex gap-2 relative z-10 flex-wrap">
                                            <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 uppercase font-bold">
                                                {m.frequency === 'daily' ? 'Diaria' : m.frequency || 'Misión'}
                                            </span>
                                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${m.difficulty === 'hard' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                                                    m.difficulty === 'epic' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                                                        'text-green-400 border-green-500/30 bg-green-500/10'
                                                }`}>
                                                {m.difficulty || 'Normal'}
                                            </span>
                                            {m.type === 'temporal' && (
                                                <span className="text-[9px] bg-blue-900/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded uppercase font-bold">
                                                    Única
                                                </span>
                                            )}
                                        </div>

                                        {/* Recompensas (AQUÍ ES DONDE DEBEN SALIR) */}
                                        <div className="flex gap-3 mt-1 pt-2 border-t border-gray-800 relative z-10">

                                            {/* XP */}
                                            {(m.xpReward > 0) && (
                                                <div className="flex items-center gap-1">
                                                    <Star size={10} className="text-blue-400 fill-blue-400/20" />
                                                    <span className="text-[10px] font-bold text-blue-200">+{m.xpReward} XP</span>
                                                </div>
                                            )}

                                            {/* Monedas */}
                                            {(m.coinReward > 0) && (
                                                <div className="flex items-center gap-1">
                                                    <Coins size={10} className="text-yellow-400 fill-yellow-400/20" />
                                                    <span className="text-[10px] font-bold text-yellow-200">+{m.coinReward}</span>
                                                </div>
                                            )}

                                            {/* Fichas (GameCoins) */}
                                            {(m.gameCoinReward > 0) && (
                                                <div className="flex items-center gap-1">
                                                    <Gamepad2 size={10} className="text-purple-400 fill-purple-400/20" />
                                                    <span className="text-[10px] font-bold text-purple-200">+{m.gameCoinReward}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Decoración fondo */}
                                        <CheckCircle size={80} className="text-green-900/10 absolute -right-4 -bottom-4 z-0" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-gray-950 rounded-xl border border-gray-800 text-gray-500 text-sm">
                                    <p>No hay misiones completadas este día.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedFood && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col">
                        <button onClick={() => setSelectedFood(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase mb-1"><Utensils size={18} /> HISTORIAL</div>
                        <h2 className="text-3xl font-black text-white mb-4">{selectedFood.totalKcal} <span className="text-lg text-gray-500 font-bold">kcal</span></h2>
                        <div className="space-y-3">
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
                    </div>
                </div>
            )}

            {/* NUEVOS MODALES CON PESTAÑAS (PARA HISTORIAL) */}
            {selectedSportList && <SportDetailsModal workouts={selectedSportList} onClose={() => setSelectedSportList(null)} />}
            {selectedTrainingList && <GymDetailsModal workouts={selectedTrainingList} onClose={() => setSelectedTrainingList(null)} />}

        </div>
    );
}