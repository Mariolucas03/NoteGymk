import { useState, useEffect } from 'react';
import { Clock, Check, ChevronDown, MoreVertical } from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';

export default function ActiveWorkout({ routine, onClose, onFinish }) {
    const [seconds, setSeconds] = useState(0);
    const [exercises, setExercises] = useState(
        routine.exercises.map(ex => ({
            ...ex,
            setsData: Array(ex.sets).fill({ kg: '', reps: '', completed: false })
        }))
    );
    const [finishing, setFinishing] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

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
        if (!currentSet.kg || !currentSet.reps) return setToast({ message: 'Rellena Kg y Reps primero', type: 'error' });

        updatedEx[exIndex].setsData[setIndex] = { ...currentSet, completed: !currentSet.completed };
        setExercises(updatedEx);
    };

    const handleFinish = async () => {
        // ELIMINADO EL CONFIRM MOLESTO
        setFinishing(true);

        try {
            const logData = {
                routineId: routine._id,
                routineName: routine.name,
                duration: seconds,
                exercises: exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.setsData.map(s => ({
                        weight: parseFloat(s.kg) || 0,
                        reps: parseFloat(s.reps) || 0,
                        completed: s.completed
                    }))
                }))
            };

            const res = await api.post('/gym/log', logData);

            // Pasamos TODO lo que devuelve el backend (user, xp, coins)
            onFinish(res.data);

        } catch (error) {
            setToast({ message: 'Error al guardar el entrenamiento', type: 'error' });
            console.error(error);
            setFinishing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in slide-in-from-bottom duration-300">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
                <button onClick={onClose} className="text-gray-400"><ChevronDown /></button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold">{routine.name}</span>
                    <div className="flex items-center gap-1 text-blue-400 font-mono text-sm">
                        <Clock size={14} />{formatTime(seconds)}
                    </div>
                </div>
                <button
                    onClick={handleFinish}
                    disabled={finishing}
                    className="bg-blue-600 px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-lg shadow-blue-900/20"
                >
                    {finishing ? '...' : 'Terminar'}
                </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-6">
                {exercises.map((ex, exIdx) => (
                    <div key={ex._id || exIdx} className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-blue-400 font-bold text-lg">{ex.name}</h3>
                            <button className="text-gray-600"><MoreVertical size={20} /></button>
                        </div>
                        <div className="w-full">
                            <div className="grid grid-cols-10 gap-2 mb-2 text-xs text-gray-500 font-bold text-center uppercase tracking-wider">
                                <div className="col-span-1">#</div>
                                <div className="col-span-3 text-left pl-2">Previo</div>
                                <div className="col-span-2">Kg</div>
                                <div className="col-span-2">Reps</div>
                                <div className="col-span-2"><Check size={14} className="mx-auto" /></div>
                            </div>
                            <div className="space-y-2">
                                {ex.setsData.map((set, setIdx) => (
                                    <div key={setIdx} className={`grid grid-cols-10 gap-2 items-center rounded-lg p-2 transition-colors ${set.completed ? 'bg-green-900/20' : 'bg-gray-900'}`}>
                                        <div className="col-span-1 text-center font-bold text-gray-400 bg-gray-800 rounded py-1">{setIdx + 1}</div>
                                        <div className="col-span-3 text-left pl-2 text-gray-600 text-xs">-</div>
                                        <div className="col-span-2"><input type="number" placeholder="0" value={set.kg} onChange={(e) => handleInputChange(exIdx, setIdx, 'kg', e.target.value)} className={`w-full text-center bg-transparent font-bold focus:outline-none rounded py-1 ${set.completed ? 'text-green-400' : 'text-white bg-gray-800'}`} /></div>
                                        <div className="col-span-2"><input type="number" placeholder="0" value={set.reps} onChange={(e) => handleInputChange(exIdx, setIdx, 'reps', e.target.value)} className={`w-full text-center bg-transparent font-bold focus:outline-none rounded py-1 ${set.completed ? 'text-green-400' : 'text-white bg-gray-800'}`} /></div>
                                        <div className="col-span-2 flex justify-center">
                                            <button onClick={() => toggleSetComplete(exIdx, setIdx)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-800 text-gray-600 hover:bg-gray-700'}`}>
                                                <Check size={18} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}