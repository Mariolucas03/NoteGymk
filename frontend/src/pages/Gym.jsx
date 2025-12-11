import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPRESCINDIBLE PARA ACTUALIZAR HEADER
import { Plus, Dumbbell, Trash2, ChevronRight } from 'lucide-react';
import api from '../services/api';
import ExerciseSelector from '../components/gym/ExerciseSelector';
import ActiveWorkout from '../components/gym/ActiveWorkout';
import Toast from '../components/common/Toast';

export default function Gym() {
    const { setUser } = useOutletContext(); // <--- Recuperamos la función para actualizar estado global
    const [routines, setRoutines] = useState([]);
    const [showCreator, setShowCreator] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [activeRoutine, setActiveRoutine] = useState(null);

    const [toast, setToast] = useState(null);

    const [routineName, setRoutineName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]);

    useEffect(() => { fetchRoutines(); }, []);

    const fetchRoutines = async () => {
        try {
            const res = await api.get('/gym/routines');
            setRoutines(res.data);
        } catch (error) { console.error(error); }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleAddExercises = (exercisesList) => {
        const formattedExercises = exercisesList.map(ex => ({ ...ex, sets: 3, reps: '10' }));
        setSelectedExercises(prev => [...prev, ...formattedExercises]);
        setShowSelector(false);
    };

    const handleSaveRoutine = async () => {
        if (!routineName) return showToast("Ponle un nombre a la rutina", "error");
        if (selectedExercises.length === 0) return showToast("Añade ejercicios", "error");

        try {
            await api.post('/gym/routines', { name: routineName, exercises: selectedExercises });
            setShowCreator(false);
            setRoutineName('');
            setSelectedExercises([]);
            fetchRoutines();
            showToast("¡Rutina creada con éxito!");
        } catch (error) {
            showToast("Error al crear rutina", "error");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        // Hemos quitado el confirm feo. Borra directo (idealmente pondríamos un "Deshacer" en el toast)
        try {
            await api.delete(`/gym/routines/${id}`);
            fetchRoutines();
            showToast("Rutina eliminada");
        } catch (error) {
            showToast("Error eliminando rutina", "error");
        }
    };

    // --- FUNCIÓN CLAVE PARA ACTUALIZAR XP/MONEDAS ---
    const handleWorkoutFinish = (data) => {
        setActiveRoutine(null);

        if (data && data.user) {
            // 1. Actualizamos el estado global (Header se actualiza solo)
            setUser(data.user);
            // 2. Persistimos en localStorage para que no se pierda al recargar
            localStorage.setItem('user', JSON.stringify(data.user));

            // 3. Mostramos Toast
            showToast(`¡Entreno completado! Ganaste +${data.xp} XP y +${data.coins} Monedas`);
        }
    };

    // VISTA 1: LISTA PRINCIPAL
    if (!showCreator) {
        return (
            <div className="space-y-6 pb-24 pt-4 px-4 animate-in fade-in relative">

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Mis Rutinas</h1>
                        <p className="text-xs text-gray-500">Gestiona tus entrenamientos</p>
                    </div>
                    <button onClick={() => setShowCreator(true)} className="text-blue-500 font-bold text-sm bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-900/40 transition-colors">
                        + Nueva
                    </button>
                </div>

                {routines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                            <Dumbbell size={40} className="text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">No tienes rutinas creadas</p>
                        <button onClick={() => setShowCreator(true)} className="mt-6 bg-blue-600 px-6 py-3 rounded-xl text-white font-bold shadow-lg shadow-blue-900/20">
                            Crear Primera Rutina
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {routines.map(routine => (
                            <div key={routine._id} onClick={() => setActiveRoutine(routine)} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex justify-between items-center group active:scale-[0.98] transition-all cursor-pointer hover:border-blue-500/30">
                                <div>
                                    <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{routine.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 font-mono bg-black/30 px-1.5 py-0.5 rounded">{routine.exercises.length} Ejercicios</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => handleDelete(routine._id, e)} className="text-gray-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                                    <ChevronRight className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeRoutine && (
                    <ActiveWorkout
                        routine={activeRoutine}
                        onClose={() => setActiveRoutine(null)}
                        onFinish={handleWorkoutFinish}
                    />
                )}
            </div>
        );
    }

    // VISTA 2: CREADOR
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-right duration-300">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="px-4 py-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center sticky top-0 z-20">
                <button onClick={() => setShowCreator(false)} className="text-blue-500 font-medium">Cancelar</button>
                <span className="text-white font-bold">Crear Rutina</span>
                <button onClick={handleSaveRoutine} className="bg-blue-600 px-4 py-1.5 rounded-full text-white text-sm font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!routineName || selectedExercises.length === 0}>
                    Guardar
                </button>
            </div>

            <div className="p-6 bg-black">
                <input type="text" placeholder="Título de la Rutina" autoFocus value={routineName} onChange={(e) => setRoutineName(e.target.value)} className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-700 border-b border-gray-800 pb-2 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32">
                {selectedExercises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 opacity-60">
                        <div className="w-20 h-20 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center mb-4"><Dumbbell size={30} className="text-gray-700" /></div>
                        <p className="text-gray-600 text-sm mb-6">Empieza agregando un ejercicio</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedExercises.map((ex, idx) => (
                            <div key={idx} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center animate-in zoom-in-95">
                                <div>
                                    <h4 className="text-white font-bold">{ex.name}</h4>
                                    <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2"><span className="bg-gray-800 px-1.5 rounded text-[10px] uppercase">{ex.muscle}</span><span>{ex.sets} Series</span></p>
                                </div>
                                <button onClick={() => setSelectedExercises(prev => prev.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={() => setShowSelector(true)} className="w-full mt-6 bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600/20 text-blue-400 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Plus size={20} /> Agregar Ejercicio
                </button>
            </div>

            {showSelector && <ExerciseSelector onClose={() => setShowSelector(false)} onAddExercises={handleAddExercises} />}
        </div>
    );
}