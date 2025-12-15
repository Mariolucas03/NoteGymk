import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    User, Trophy, Coins, Activity, Dumbbell, Utensils,
    X, CheckCircle, Clock, BarChart3, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Zap
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

export default function Profile() {
    const { user } = useOutletContext();

    // --- ESTADO FECHA ---
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());

    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- ESTADO ORDEN Y VISIBILIDAD (Sincronizado con Home) ---
    const [widgetOrder, setWidgetOrder] = useState([]);
    const [visibleWidgets, setVisibleWidgets] = useState({});

    // Modales Detalle
    const [selectedSport, setSelectedSport] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedMissions, setSelectedMissions] = useState(null);

    // 1. CARGAR CONFIGURACIÓN
    useEffect(() => {
        const savedOrder = localStorage.getItem('home_widgets_order');
        const savedConfig = localStorage.getItem('home_widgets_config');

        setWidgetOrder(savedOrder ? JSON.parse(savedOrder) : [
            'missions', 'sport', 'food', 'sleep', 'steps',
            'mood', 'weight', 'training', 'streak', 'gains'
        ]);

        setVisibleWidgets(savedConfig ? JSON.parse(savedConfig) : {
            missions: true, sport: true, food: true, sleep: true, steps: true,
            mood: true, weight: true, training: true, streak: true, gains: true
        });
    }, []);

    // 2. CARGAR DATOS
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
                return (
                    // ✅ Misiones: Ahora pasa los datos correctamente al modal
                    <div onClick={() => setSelectedMissions(dailyData.missionStats)} className="cursor-pointer h-full">
                        <MissionsWidget
                            completed={dailyData.missionStats?.completed || 0}
                            total={dailyData.missionStats?.total || 3}
                            list={dailyData.missionStats?.listCompleted}
                        />
                    </div>
                );
            case 'sport':
                if (!dailyData.sportWorkout) return null;
                return <div onClick={() => setSelectedSport(dailyData.sportWorkout)} className="cursor-pointer h-full"><SportWidget workout={dailyData.sportWorkout} /></div>;
            case 'training':
                if (!dailyData.gymWorkout) return null;
                return <div onClick={() => setSelectedTraining(dailyData.gymWorkout)} className="cursor-pointer h-full"><TrainingWidget workout={dailyData.gymWorkout} /></div>;
            case 'food':
                return <div onClick={() => setSelectedFood(dailyData.nutrition)} className="cursor-pointer h-full"><FoodWidget currentKcal={dailyData.totalKcal || 0} limitKcal={user?.macros?.calories || 2100} /></div>;

            case 'sleep': return <div className="pointer-events-none opacity-90"><SleepWidget hours={dailyData.sleepHours} onUpdate={handleReadOnlyClick} /></div>;
            case 'steps': return <div className="pointer-events-none opacity-90"><StepsWidget steps={dailyData.steps} onUpdate={handleReadOnlyClick} /></div>;

            case 'mood':
                // ✅ Mood: Se asegura de pasar el prop y quitar pointer-events-none si quieres ver el hover (aunque sin onUpdate no guardará)
                // Dejamos pointer-events-none para que sea "solo lectura" estricto, pero se verá iluminado si mood tiene valor.
                return <div className="pointer-events-none"><MoodWidget mood={dailyData.mood} onUpdate={handleReadOnlyClick} /></div>;

            case 'weight': return <div className="pointer-events-none opacity-90 h-full flex flex-col"><WeightWidget initialWeight={dailyData.weight} onUpdate={handleReadOnlyClick} /></div>;
            case 'streak': return <div className="pointer-events-none"><StreakWidget streak={dailyData.streakCurrent || 0} /></div>;

            case 'gains':
                // ✅ Ganancias: Quitados filtros de gris/opacidad. Se ve igual que en Home.
                // Muestra lo ganado ESE DÍA.
                return (
                    <div className="pointer-events-none">
                        <GainsWidget
                            totalCoins={dailyData.gains?.coins || 0}
                            currentXP={dailyData.gains?.xp || 0}
                            level={user?.level}
                            lives={user?.lives}
                            // Pasamos un nextLevelXP dummy para que la barra se vea llena o vacía según la XP diaria
                            nextLevelXP={1000}
                        />
                    </div>
                );
            default: return null;
        }
    };

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

            {renderCalendar()}

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
                        const isFullWidth = key === 'training' || key === 'missions';
                        const widgetContent = renderWidgetByKey(key);
                        if (!widgetContent) return null;
                        return <div key={key} className={isFullWidth ? 'col-span-2' : 'col-span-1'}>{widgetContent}</div>;
                    })}
                </div>
            )}

            {/* --- MODALES DETALLE (SOLO LECTURA) --- */}

            {/* ✅ MODAL MISIONES ARREGLADO */}
            {selectedMissions && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        <button onClick={() => setSelectedMissions(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm tracking-wider uppercase mb-1"><Trophy size={18} /> HISTORIAL</div>
                        <h2 className="text-2xl font-black text-white mb-4">Misiones</h2>
                        <div className="space-y-3">
                            {selectedMissions.listCompleted && selectedMissions.listCompleted.length > 0 ? (
                                selectedMissions.listCompleted.map((m, idx) => (
                                    <div key={idx} className="bg-black/40 p-4 rounded-xl border border-gray-800/50 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-white text-sm font-bold block">{m.title}</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                        {/* Mostramos recompensas históricas */}
                                        <div className="flex gap-3 mt-1 pt-2 border-t border-gray-800">
                                            {m.xpReward > 0 && <span className="flex items-center gap-1 text-xs text-blue-400 font-bold"><Zap size={12} /> +{m.xpReward} XP</span>}
                                            {m.coinReward > 0 && <span className="flex items-center gap-1 text-xs text-yellow-400 font-bold"><Coins size={12} /> +{m.coinReward}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-gray-950 rounded-xl border border-gray-800 text-gray-500 text-sm">
                                    <p>No hay detalles de misiones guardados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedSport && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        <button onClick={() => setSelectedSport(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-sm tracking-wider uppercase mb-1"><Activity size={18} /> HISTORIAL</div>
                        <h2 className="text-3xl font-black text-white capitalize mb-4">{selectedSport.routineName}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><span className="text-blue-500 text-[10px] font-bold uppercase block mb-1">DISTANCIA</span><span className="text-white font-bold text-xl">{selectedSport.distance || 0} km</span></div>
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><span className="text-red-500 text-[10px] font-bold uppercase block mb-1">INTENSIDAD</span><span className="text-white font-bold text-xl capitalize">{selectedSport.intensity || '-'}</span></div>
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 col-span-2 flex justify-between items-center"><span className="text-green-500 text-[10px] font-bold uppercase">TIEMPO</span><span className="text-white font-bold text-2xl">{selectedSport.duration} min</span></div>
                        </div>
                    </div>
                </div>
            )}

            {selectedFood && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        <button onClick={() => setSelectedFood(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase mb-1"><Utensils size={18} /> HISTORIAL</div>
                        <h2 className="text-3xl font-black text-white mb-4">{selectedFood.totalKcal} <span className="text-lg text-gray-500 font-bold">kcal</span></h2>
                        <div className="space-y-3">
                            {['breakfast', 'snacks', 'lunch', 'merienda', 'dinner'].map(meal => (
                                <div key={meal} className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between capitalize">
                                    <span className="text-gray-400 text-xs font-bold uppercase">{meal === 'lunch' ? 'Comida' : meal}</span>
                                    <span className="text-white font-bold">{selectedFood[meal] || 0} kcal</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedTraining && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-start mb-4 shrink-0">
                            <div>
                                <div className="flex items-center gap-2 text-blue-500 font-bold text-sm tracking-wider uppercase mb-1"><Dumbbell size={18} /> HISTORIAL</div>
                                <h2 className="text-2xl font-black text-white capitalize leading-tight">{selectedTraining.name || selectedTraining.routineName}</h2>
                                <div className="flex gap-3 mt-2 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded"><Clock size={12} /> {Math.floor((selectedTraining.duration || 0) / 60)} min</span>
                                    <span className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded"><BarChart3 size={12} /> {selectedTraining.exercises?.reduce((t, e) => t + e.sets.reduce((s, st) => s + (st.weight * st.reps), 0), 0).toLocaleString()} kg Vol.</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTraining(null)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {selectedTraining.exercises?.map((ex, idx) => (
                                <div key={idx} className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50">
                                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2"><span className="text-white font-bold text-sm truncate">{ex.name}</span><span className="text-gray-500 text-[9px] font-bold uppercase bg-gray-900 px-2 py-0.5 rounded border border-gray-800">{ex.sets.length} Series</span></div>
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
                    </div>
                </div>
            )}
        </div>
    );
}