import { useState, useEffect } from 'react';
import { Plus, Play, Trash2, Dumbbell, LayoutGrid, X, Bike, Timer, Gauge, MapPin } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

// Componentes Hijos
import ExerciseSelector from '../components/gym/ExerciseSelector';
import ActiveWorkout from '../components/gym/ActiveWorkout';

export default function Gym() {
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Estados
    const [activeRoutine, setActiveRoutine] = useState(null);
    const [showCreator, setShowCreator] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [newRoutine, setNewRoutine] = useState({ name: '', exercises: [] });

    // --- NUEVO: ESTADOS PARA DEPORTES ---
    const [showSportModal, setShowSportModal] = useState(false);
    const [sportData, setSportData] = useState({
        name: '',
        time: '',
        intensity: 'Media',
        distance: ''
    });

    // --- CARGAR RUTINAS ---
    useEffect(() => {
        fetchRoutines();
    }, []);

    const fetchRoutines = async () => {
        try {
            const res = await api.get('/gym/routines');
            setRoutines(res.data);
        } catch (error) {
            console.error("Error cargando rutinas", error);
        } finally {
            setLoading(false);
        }
    };

    // --- GESTIÓN DE RUTINAS ---
    const handleAddExerciseToRoutine = (selectedExercisesList) => {
        const newExercisesFormatted = selectedExercisesList.map(ex => ({ ...ex, sets: 3 }));
        setNewRoutine(prev => ({
            ...prev,
            exercises: [...prev.exercises, ...newExercisesFormatted]
        }));
        setShowSelector(false);
    };

    const handleSaveRoutine = async () => {
        if (!newRoutine.name.trim()) return setToast({ message: 'Ponle nombre a la rutina', type: 'error' });
        if (newRoutine.exercises.length === 0) return setToast({ message: 'Añade ejercicios', type: 'error' });

        try {
            const res = await api.post('/gym/routines', newRoutine);
            setRoutines([res.data, ...routines]);
            setShowCreator(false);
            setNewRoutine({ name: '', exercises: [] });
            setToast({ message: '¡Rutina creada!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al guardar rutina', type: 'error' });
        }
    };

    const removeExerciseFromNew = (index) => {
        const updated = [...newRoutine.exercises];
        updated.splice(index, 1);
        setNewRoutine({ ...newRoutine, exercises: updated });
    };

    const handleDeleteRoutine = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("¿Borrar rutina?")) return;
        try {
            await api.delete(`/gym/routines/${id}`);
            setRoutines(routines.filter(r => r._id !== id));
            setToast({ message: 'Eliminada', type: 'info' });
        } catch (error) { setToast({ message: 'Error', type: 'error' }); }
    };

    // --- NUEVO: GESTIÓN DE DEPORTES ---
    const handleSaveSport = async () => {
        if (!sportData.name || !sportData.time) {
            return setToast({ message: 'Nombre y tiempo obligatorios', type: 'error' });
        }

        try {
            await api.post('/gym/sport', sportData);
            setShowSportModal(false);
            setSportData({ name: '', time: '', intensity: 'Media', distance: '' }); // Reset
            setToast({ message: 'Deporte registrado con éxito', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Error al registrar deporte', type: 'error' });
        }
    };

    // --- FINALIZAR ENTRENO ---
    const handleWorkoutFinished = () => {
        setActiveRoutine(null);
        setToast({ message: 'Entrenamiento guardado', type: 'success' });
    };

    if (activeRoutine) {
        return <ActiveWorkout routine={activeRoutine} onClose={() => setActiveRoutine(null)} onFinish={handleWorkoutFinished} />;
    }

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in select-none">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-blue-500" /> Gimnasio
                    </h1>
                    <p className="text-gray-400 text-sm">Gestiona tu actividad física</p>
                </div>
            </div>

            {/* --- SECCIÓN 1: MIS RUTINAS --- */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-300">Mis Rutinas</h2>
                <button onClick={() => setShowCreator(true)} className="bg-blue-600/20 text-blue-400 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                    <Plus size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
                {loading ? <div className="text-center py-4 text-gray-500">Cargando...</div> : routines.length === 0 ? (
                    <div className="text-center py-8 bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl">
                        <p className="text-gray-500 text-sm">No tienes rutinas de pesas.</p>
                    </div>
                ) : (
                    routines.map(routine => (
                        <div key={routine._id} onClick={() => setActiveRoutine(routine)} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex justify-between items-center group cursor-pointer relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{routine.name}</h3>
                                <p className="text-gray-500 text-xs font-bold uppercase">{routine.exercises?.length || 0} Ejercicios</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center"><Play size={20} fill="currentColor" /></button>
                                <button onClick={(e) => handleDeleteRoutine(routine._id, e)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- SECCIÓN 2: DEPORTES (NUEVO) --- */}
            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-300 mb-4">Deportes</h2>

                <button
                    onClick={() => setShowSportModal(true)}
                    className="w-full bg-gray-900 border border-gray-800 hover:border-green-500/50 p-5 rounded-2xl flex items-center justify-between group transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-green-900/20 p-3 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors">
                            <Bike size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">Registrar Deporte</h3>
                            <p className="text-gray-500 text-xs">Running, Natación, Fútbol...</p>
                        </div>
                    </div>
                    <Plus size={24} className="text-gray-600 group-hover:text-white" />
                </button>
            </div>

            <div className="h-20"></div>

            {/* --- MODAL REGISTRAR DEPORTE (NUEVO) --- */}
            {showSportModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bike className="text-green-500" /> Registrar Actividad</h2>
                            <button onClick={() => setShowSportModal(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Deporte / Actividad</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Carrera Matutina, Partido de Padel"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white mt-1 focus:border-green-500 focus:outline-none"
                                    value={sportData.name}
                                    onChange={(e) => setSportData({ ...sportData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Tiempo */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex gap-1"><Timer size={12} /> Tiempo (min)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white mt-1 focus:border-green-500 focus:outline-none"
                                        value={sportData.time}
                                        onChange={(e) => setSportData({ ...sportData, time: e.target.value })}
                                    />
                                </div>
                                {/* Distancia */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex gap-1"><MapPin size={12} /> Distancia (km)</label>
                                    <input
                                        type="number"
                                        placeholder="Opcional"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white mt-1 focus:border-green-500 focus:outline-none"
                                        value={sportData.distance}
                                        onChange={(e) => setSportData({ ...sportData, distance: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Intensidad */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex gap-1"><Gauge size={12} /> Intensidad</label>
                                <div className="flex gap-2 mt-1">
                                    {['Baja', 'Media', 'Alta'].map((int) => (
                                        <button
                                            key={int}
                                            onClick={() => setSportData({ ...sportData, intensity: int })}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${sportData.intensity === int
                                                    ? 'bg-green-600 text-black border-green-600'
                                                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-600'
                                                }`}
                                        >
                                            {int}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSport}
                                className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded-xl mt-4 shadow-lg active:scale-95 transition-transform"
                            >
                                Guardar Actividad
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CREADOR DE RUTINA (EXISTENTE) --- */}
            {showCreator && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in">
                    <div className="bg-gray-900 w-full sm:max-w-lg h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Nueva Rutina</h2>
                            <button onClick={() => setShowCreator(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Rutina</label>
                                <input type="text" placeholder="Ej: Pecho y Tríceps" autoFocus className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none mt-1 text-lg" value={newRoutine.name} onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ejercicios ({newRoutine.exercises.length})</label>
                                    <button onClick={() => setShowSelector(true)} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1"><Plus size={14} /> Añadir</button>
                                </div>
                                {newRoutine.exercises.length === 0 ? (
                                    <div onClick={() => setShowSelector(true)} className="border-2 border-dashed border-gray-800 rounded-xl p-6 text-center text-gray-600 hover:border-blue-500/50 hover:text-blue-500 cursor-pointer transition-colors"><p className="text-sm font-medium">Toca para añadir ejercicios</p></div>
                                ) : (
                                    <div className="space-y-2">
                                        {newRoutine.exercises.map((ex, idx) => (
                                            <div key={idx} className="bg-gray-800/50 p-3 rounded-xl border border-gray-800 flex justify-between items-center animate-in fade-in slide-in-from-right-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded bg-gray-700 text-gray-400 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                    <div><p className="text-white font-medium text-sm">{ex.name}</p><p className="text-gray-500 text-[10px] font-bold uppercase">{ex.muscle}</p></div>
                                                </div>
                                                <button onClick={() => removeExerciseFromNew(idx)} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-800 bg-gray-900/95 backdrop-blur">
                            <button onClick={handleSaveRoutine} className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">Guardar Rutina</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SELECTOR */}
            {showSelector && <ExerciseSelector onClose={() => setShowSelector(false)} onSelect={handleAddExerciseToRoutine} />}
        </div>
    );
}