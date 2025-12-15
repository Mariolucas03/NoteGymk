import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
    ChevronLeft, ChevronRight, X,
    Calendar as CalendarIcon, History, Trophy, Activity, Dumbbell, MapPin, Gauge, Timer, Utensils
} from 'lucide-react';
import api from '../services/api';

// --- WIDGETS ---
import MoodWidget from '../components/widgets/MoodWidget';
import WeightWidget from '../components/widgets/WeightWidget';
import FoodWidget from '../components/widgets/FoodWidget';
import SleepWidget from '../components/widgets/SleepWidget';
import StepsWidget from '../components/widgets/StepsWidget';
import SportWidget from '../components/widgets/SportWidget';
import TrainingWidget from '../components/widgets/TrainingWidget';
import GainsWidget from '../components/widgets/GainsWidget';
import StreakWidget from '../components/widgets/StreakWidget';
import MissionsWidget from '../components/widgets/MissionsWidget';

export default function Profile() {
    const { user } = useOutletContext();
    const [date, setDate] = useState(new Date());
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- ESTADOS PARA MODALES (TARJETAS FLOTANTES) ---
    const [selectedMissions, setSelectedMissions] = useState(null);
    const [selectedSport, setSelectedSport] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);

    const [widgetOrder, setWidgetOrder] = useState([]);
    const [visibleWidgets, setVisibleWidgets] = useState({});

    useEffect(() => {
        const savedOrder = localStorage.getItem('home_widgets_order');
        const savedConfig = localStorage.getItem('home_widgets_config');

        if (savedOrder) {
            setWidgetOrder(JSON.parse(savedOrder));
        } else {
            setWidgetOrder(['missions', 'sport', 'food', 'sleep', 'steps', 'mood', 'weight', 'training', 'streak', 'gains']);
        }

        if (savedConfig) {
            setVisibleWidgets(JSON.parse(savedConfig));
        } else {
            setVisibleWidgets({ missions: true, sport: true, food: true, sleep: true, steps: true, mood: true, weight: true, training: true, streak: true, gains: true });
        }
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                const dateString = localDate.toISOString().split('T')[0];

                const res = await api.get(`/daily/specific?date=${dateString}`);
                setHistoryData(res.data);
            } catch (error) {
                console.error("Error cargando historial:", error);
                setHistoryData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [date]);

    // Helpers
    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const isToday = new Date().toDateString() === date.toDateString();

    const renderProfileWidget = (key) => {
        if (!historyData) return null;
        const coreData = historyData.daily || historyData;

        switch (key) {
            case 'missions':
                const stats = historyData.missionStats || coreData.missionStats || { completed: 0, total: 3, listCompleted: [] };
                return (
                    <div
                        onClick={() => setSelectedMissions(stats)}
                        className="cursor-pointer transition-transform active:scale-[0.99] h-full"
                    >
                        <MissionsWidget stats={stats} />
                    </div>
                );

            case 'sport':
                const sport = historyData.sportWorkout || coreData.sportWorkout;
                if (!sport) return null;
                return (
                    <div
                        onClick={() => setSelectedSport(sport)}
                        className="cursor-pointer transition-transform active:scale-[0.99] h-full"
                    >
                        <SportWidget workout={sport} />
                    </div>
                );

            case 'training':
                const gym = historyData.gymWorkout || coreData.gymWorkout;
                if (!gym) return null;
                return (
                    <div
                        onClick={() => setSelectedTraining(gym)}
                        className="cursor-pointer transition-transform active:scale-[0.99] h-full"
                    >
                        <TrainingWidget workout={gym} />
                    </div>
                );

            case 'food':
                const nutrition = historyData.nutrition || coreData.nutrition;
                const currentKcal = nutrition?.totalKcal || coreData.totalKcal || 0;
                const limitKcal = user?.calorieGoal || 2100;

                // Preparamos los datos por si se quiere abrir el modal (opcional, pero consistente)
                const foodData = nutrition || { totalKcal: currentKcal, breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };

                return (
                    <div
                        onClick={() => setSelectedFood(foodData)}
                        className="cursor-pointer transition-transform active:scale-[0.99] h-full"
                    >
                        <FoodWidget currentKcal={currentKcal} limitKcal={limitKcal} />
                    </div>
                );

            case 'sleep': return <div className="pointer-events-none opacity-90 h-full"><SleepWidget hours={coreData.sleepHours} /></div>;
            case 'steps': return <div className="pointer-events-none opacity-90 h-full"><StepsWidget steps={coreData.steps} /></div>;
            case 'mood': return <div className="pointer-events-none opacity-90 h-full"><MoodWidget mood={coreData.mood} /></div>;
            case 'weight': return <div className="pointer-events-none opacity-90 h-full flex flex-col"><WeightWidget initialWeight={coreData.weight} /></div>;
            case 'streak': return <div className="pointer-events-none opacity-90 h-full"><StreakWidget streak={historyData.streakCurrent || 1} /></div>;
            case 'gains':
                const gains = historyData.gains || coreData.gains || {};
                return <div className="pointer-events-none h-full"><GainsWidget dailyCoins={gains.coins || 0} dailyXP={gains.xp || 0} dailyLives={0} /></div>;

            default: return null;
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in select-none">
            {/* CABECERA */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><History className="text-blue-500" /> Tu Historial</h1>
                    <p className="text-gray-400 text-sm">Consulta tu progreso pasado</p>
                </div>
                <div className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-800 flex gap-4 text-xs font-bold">
                    <div className="text-center"><span className="block text-gray-500">Nivel</span><span className="text-white text-lg">{user?.level || 1}</span></div>
                </div>
            </div>

            {/* CALENDARIO */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl">
                <div className="calendar-container">
                    <Calendar
                        onChange={setDate} value={date}
                        className="bg-transparent border-none w-full text-white font-sans"
                        tileClassName={({ date: d, view }) => {
                            if (view === 'month' && d.toDateString() === new Date().toDateString()) return 'bg-blue-900/30 text-blue-400 rounded-full font-bold';
                        }}
                        prevLabel={<ChevronLeft size={20} className="text-gray-400" />}
                        nextLabel={<ChevronRight size={20} className="text-gray-400" />}
                    />
                </div>
            </div>

            {/* TÍTULO FECHA */}
            <div className="flex items-center gap-2 my-4">
                <CalendarIcon size={18} className="text-blue-500" />
                <h2 className="text-lg font-bold text-white capitalize">{isToday ? "Hoy (Vista Lectura)" : formattedDate}</h2>
                {loading && <span className="text-xs text-gray-500 animate-pulse ml-2">Cargando...</span>}
            </div>

            {/* GRID DINÁMICO */}
            {historyData ? (
                <div className="grid grid-cols-2 gap-4 auto-rows-fr grid-flow-dense">
                    {widgetOrder.map((key) => {
                        if (!visibleWidgets[key]) return null;

                        // Misiones y Rutina ocupan todo el ancho. Los demás 50%.
                        const isFullWidth = key === 'training' || key === 'missions';

                        const widgetContent = renderProfileWidget(key);
                        if (!widgetContent) return null;

                        return (
                            <div key={key} className={isFullWidth ? 'col-span-2' : 'col-span-1'}>
                                {widgetContent}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                    <History size={32} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-gray-500 font-medium">No hay registros para esta fecha.</p>
                </div>
            )}

            {/* ================= MODALES (DISEÑO GRANDE ESTILO HOME) ================= */}

            {/* 1. MODAL MISIONES */}
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
                                    <div key={idx} className="bg-black/40 p-4 rounded-xl border border-gray-800/50 flex justify-between items-center">
                                        <span className="text-white text-sm font-bold">{m.title}</span>
                                        {m.coinReward > 0 && (
                                            <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/20 font-bold">
                                                +{m.coinReward} 💰
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-950 rounded-xl border border-gray-800">
                                    <p>No se completaron misiones este día.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. MODAL DEPORTE */}
            {selectedSport && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedSport(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X size={20} /></button>

                        <div className="flex items-center gap-2 text-green-500 font-bold text-sm tracking-wider uppercase mb-1"><Activity size={18} /> DEPORTE</div>
                        <h2 className="text-3xl font-black text-white capitalize mb-4">{selectedSport.routineName}</h2>
                        <div className="inline-block bg-green-900/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 tracking-wide mb-6">COMPLETADO</div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex flex-col justify-center text-center">
                                <span className="text-blue-500 text-[10px] font-bold uppercase block mb-1">DISTANCIA</span>
                                <span className="text-white font-bold text-xl">{selectedSport.distance || 0} km</span>
                            </div>
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex flex-col justify-center text-center">
                                <span className="text-red-500 text-[10px] font-bold uppercase block mb-1">INTENSIDAD</span>
                                <span className="text-white font-bold text-xl capitalize">{selectedSport.intensity || '-'}</span>
                            </div>
                            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 col-span-2 flex items-center justify-between">
                                <div>
                                    <span className="text-green-500 text-[10px] font-bold uppercase block mb-1">TIEMPO TOTAL</span>
                                    <span className="text-white font-bold text-2xl">{selectedSport.duration} <span className="text-sm text-gray-500">min</span></span>
                                </div>
                                <Timer size={32} className="text-green-900/50" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. MODAL RUTINA (GYM) */}
            {selectedTraining && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedTraining(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X size={20} /></button>

                        <div className="flex items-center gap-2 text-blue-500 font-bold text-sm tracking-wider uppercase mb-1"><Dumbbell size={18} /> GIMNASIO</div>
                        <h2 className="text-3xl font-black text-white capitalize mb-4">Detalle Rutina</h2>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {selectedTraining.exercises.map((ex, idx) => (
                                <div key={idx} className="bg-black/40 p-3 rounded-xl border border-gray-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-bold text-sm truncate">{ex.name}</span>
                                        <span className="text-gray-500 text-[9px] font-bold uppercase bg-gray-800 px-2 py-0.5 rounded">{ex.sets.length} Series</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {ex.sets.map((set, sIdx) => (
                                            <div key={sIdx} className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-center min-w-[45px]">
                                                <div className="text-blue-400 font-bold text-xs">{set.weight}<span className="text-[8px] text-gray-500">kg</span></div>
                                                <div className="text-gray-500 text-[8px]">{set.reps} reps</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. MODAL COMIDA (Opcional, igual que Home) */}
            {selectedFood && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedFood(null)} className="absolute top-4 right-4 bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X size={20} /></button>
                        <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase mb-1"><Utensils size={18} /> NUTRICIÓN</div>
                        <h2 className="text-3xl font-black text-white mb-1">{selectedFood.totalKcal} <span className="text-lg text-gray-500 font-bold">kcal</span></h2>
                        <div className="space-y-3 mt-4">
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Desayuno</span><span className="text-white font-bold">{selectedFood.breakfast || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Comida</span><span className="text-white font-bold">{selectedFood.lunch || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Cena</span><span className="text-white font-bold">{selectedFood.dinner || 0} kcal</span></div>
                            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between"><span className="text-gray-400 text-xs font-bold uppercase">Snacks</span><span className="text-white font-bold">{selectedFood.snacks || 0} kcal</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}