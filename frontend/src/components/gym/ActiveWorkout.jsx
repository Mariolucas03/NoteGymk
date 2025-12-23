import { useState, useEffect } from 'react';
import { Clock, Check, ChevronDown, MoreVertical, Trophy, Loader2, Flame, Battery, Zap } from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';

export default function ActiveWorkout({ routine, onClose, onFinish }) {
    const [seconds, setSeconds] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const [toast, setToast] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // 🔥 NUEVO ESTADO: INTENSIDAD
    const [intensity, setIntensity] = useState('Media');

    // Estado inicial
    const [exercises, setExercises] = useState(() => {
        if (!routine || !routine.exercises) return [];
        return routine.exercises.map(ex => ({
            ...ex,
            setsData: Array(ex.sets || 3).fill({ kg: '', reps: '', completed: false }),
            pr: null
        }));
    });

    // 1. CRONÓMETRO
    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. CARGAR HISTORIAL
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const exerciseNames = routine.exercises.map(e => e.name);
                const res = await api.post('/gym/history-stats', { exercises: exerciseNames });
                const historyData = res.data;

                setExercises(prevExercises => prevExercises.map(ex => {
                    const stats = historyData[ex.name];
                    if (!stats) return ex;

                    const filledSets = ex.setsData.map((set, index) => {
                        if (stats.lastSets && stats.lastSets[index]) {
                            return {
                                ...set,
                                kg: stats.lastSets[index].weight,
                                reps: stats.lastSets[index].reps
                            };
                        }
                        return set;
                    });

                    return { ...ex, setsData: filledSets, pr: stats.bestSet };
                }));

            } catch (error) {
                console.error("Error cargando historial", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (routine) fetchHistory();
    }, [routine]);

    const formatTime = (totalSeconds) => {
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleInputChange = (exIndex, setIndex, field, value) => {
        const updatedEx = [...exercises];
        const newSets = [...updatedEx[exIndex].setsData];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        updatedEx[exIndex].setsData = newSets;
        setExercises(updatedEx);
    };

    const toggleSetComplete = (exIndex, setIndex) => {
        const updatedEx = [...exercises];
        const currentSet = updatedEx[exIndex].setsData[setIndex];

        if (!currentSet.kg || !currentSet.reps) {
            return setToast({ message: 'Rellena Kg y Reps primero', type: 'error' });
        }

        updatedEx[exIndex].setsData[setIndex] = { ...currentSet, completed: !currentSet.completed };
        setExercises(updatedEx);
    };

    const handleFinish = async () => {
        setFinishing(true);
        try {
            const logData = {
                routineId: routine._id,
                routineName: routine.name,
                duration: seconds,
                intensity: intensity, // 🔥 ENVIAMOS LA INTENSIDAD SELECCIONADA
                exercises: exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.setsData.map(s => ({
                        weight: parseFloat(s.kg) || 0,
                        reps: parseFloat(s.reps) || 0,
                        completed: s.completed
                    })).filter(s => s.weight > 0 || s.reps > 0)
                }))
            };

            const res = await api.post('/gym/log', logData);
            onFinish(res.data);
        } catch (error) {
            setToast({ message: 'Error al guardar', type: 'error' });
            setFinishing(false);
        }
    };

    if (!routine) return null;

    // Opciones de Intensidad
    const intensityOptions = [
        { id: 'Baja', label: 'Fuerza', desc: 'Descansos largos', icon: <Battery size={18} />, color: 'bg-blue-600 border-blue-400' },
        { id: 'Media', label: 'Hipers', desc: 'Ritmo normal', icon: <Zap size={18} />, color: 'bg-yellow-600 border-yellow-400' },
        { id: 'Alta', label: 'Metabólico', desc: 'Sin descanso', icon: <Flame size={18} />, color: 'bg-red-600 border-red-400' },
    ];

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in slide-in-from-bottom duration-300 select-none">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
                <button onClick={onClose} className="text-gray-400 p-2 hover:bg-gray-800 rounded-full">
                    <ChevronDown />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-lg">{routine.name}</span>
                    <div className="flex items-center gap-1 text-blue-400 font-mono text-sm bg-blue-900/20 px-2 py-0.5 rounded-md border border-blue-500/20">
                        <Clock size={14} />{formatTime(seconds)}
                    </div>
                </div>
                <div className="w-8"></div> {/* Espaciador para centrar */}
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {exercises.map((ex, exIdx) => (
                    <div key={ex._id || exIdx} className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex flex-col">
                                <h3 className="text-blue-400 font-bold text-lg tracking-tight leading-none">{ex.name}</h3>
                                {ex.pr && ex.pr.value1RM > 0 && (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
                                        <Trophy size={10} className="fill-yellow-500" />
                                        PR: <span className="text-white ml-0.5">{ex.pr.weight}kg x {ex.pr.reps}</span>
                                    </div>
                                )}
                            </div>
                            <button className="text-gray-600 hover:text-gray-400"><MoreVertical size={20} /></button>
                        </div>

                        <div className="w-full bg-gray-900/50 rounded-xl p-2 border border-gray-800">
                            <div className="grid grid-cols-7 gap-2 mb-2 text-[10px] text-gray-500 font-bold text-center uppercase tracking-wider">
                                <div className="col-span-1">#</div>
                                <div className="col-span-3">Kg</div>
                                <div className="col-span-2">Reps</div>
                                <div className="col-span-1"><Check size={14} className="mx-auto" /></div>
                            </div>
                            <div className="space-y-1">
                                {ex.setsData.map((set, setIdx) => (
                                    <div key={setIdx} className={`grid grid-cols-7 gap-2 items-center rounded-lg p-2 transition-all duration-200 ${set.completed ? 'bg-green-900/20 border border-green-500/30' : 'bg-gray-900 border border-transparent'}`}>
                                        <div className="col-span-1 text-center font-bold text-gray-400 bg-gray-800 rounded py-2 text-xs">{setIdx + 1}</div>
                                        <div className="col-span-3 relative">
                                            <input type="number" placeholder={loadingHistory ? "..." : "0"} value={set.kg} onChange={(e) => handleInputChange(exIdx, setIdx, 'kg', e.target.value)} className={`w-full text-center bg-gray-800 font-bold focus:outline-none rounded py-2 text-white focus:bg-gray-700 transition-colors ${set.completed ? 'text-green-400' : ''}`} />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" placeholder={loadingHistory ? "..." : "0"} value={set.reps} onChange={(e) => handleInputChange(exIdx, setIdx, 'reps', e.target.value)} className={`w-full text-center bg-gray-800 font-bold focus:outline-none rounded py-2 text-white focus:bg-gray-700 transition-colors ${set.completed ? 'text-green-400' : ''}`} />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <button onClick={() => toggleSetComplete(exIdx, setIdx)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${set.completed ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-gray-600 hover:text-gray-400'}`}>
                                                <Check size={18} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {loadingHistory && <div className="flex justify-center py-4 text-xs text-gray-600 animate-pulse gap-2"><Loader2 size={14} className="animate-spin" /> Cargando historial...</div>}

                <div className="h-32"></div> {/* Espacio extra al final */}
            </div>

            {/* FOOTER FLOTANTE CON SELECTOR DE INTENSIDAD */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-30 flex flex-col gap-3">

                {/* Selector de Intensidad */}
                <div className="grid grid-cols-3 gap-2">
                    {intensityOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setIntensity(opt.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${intensity === opt.id
                                    ? `${opt.color} text-white shadow-lg scale-105`
                                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'
                                }`}
                        >
                            <div className="mb-1">{opt.icon}</div>
                            <span className="text-[10px] font-black uppercase">{opt.label}</span>
                            <span className="text-[8px] font-medium opacity-80 leading-none">{opt.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Botón Finalizar */}
                <button
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-xl text-white font-black text-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {finishing ? <Loader2 className="animate-spin" /> : <Check />}
                    {finishing ? 'CALCULANDO CON IA...' : 'TERMINAR RUTINA'}
                </button>
            </div>
        </div>
    );
}