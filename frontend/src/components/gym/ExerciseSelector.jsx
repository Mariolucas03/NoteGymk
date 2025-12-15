import { useState, useEffect } from 'react';
import { Search, X, Dumbbell, Plus, Save, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';

export default function ExerciseSelector({ onSelect, onClose }) {
    const [exercises, setExercises] = useState([]);
    const [selectedExercises, setSelectedExercises] = useState([]); // Array para multiselección
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('Todos');
    const [loading, setLoading] = useState(true);

    // Estados para crear ejercicio
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newExercise, setNewExercise] = useState({ name: '', muscle: 'Pecho' });
    const [toast, setToast] = useState(null);

    const muscles = ['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bíceps', 'Tríceps', 'Abdomen', 'Cardio'];
    const createMuscles = muscles.filter(m => m !== 'Todos');

    // Cargar ejercicios
    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const res = await api.get('/gym/exercises');
                setExercises(res.data);
            } catch (error) {
                console.error("Error cargando ejercicios", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExercises();
    }, []);

    // --- LÓGICA MULTISELECCIÓN ---
    const toggleSelection = (exercise) => {
        const alreadySelected = selectedExercises.find(ex => ex._id === exercise._id);
        if (alreadySelected) {
            setSelectedExercises(prev => prev.filter(ex => ex._id !== exercise._id));
        } else {
            setSelectedExercises(prev => [...prev, exercise]);
        }
    };

    const handleConfirm = () => {
        onSelect(selectedExercises); // Devolvemos el ARRAY completo
        onClose();
    };

    // Crear ejercicio y auto-seleccionar
    const handleCreateExercise = async () => {
        if (!newExercise.name.trim()) return;
        try {
            const res = await api.post('/gym/exercises', newExercise);
            const created = res.data;
            setExercises([...exercises, created]);
            setSelectedExercises(prev => [...prev, created]); // Auto-seleccionar
            setNewExercise({ name: '', muscle: 'Pecho' });
            setShowCreateForm(false);
            setToast({ message: 'Creado y seleccionado', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al crear', type: 'error' });
        }
    };

    // Filtrado
    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscle = selectedMuscle === 'Todos' || ex.muscle === selectedMuscle;
        return matchesSearch && matchesMuscle;
    });

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in duration-200">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="bg-gray-900 w-full sm:max-w-lg h-[90vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 flex flex-col shadow-2xl relative overflow-hidden">

                {/* CABECERA */}
                <div className="p-5 border-b border-gray-800 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-blue-500" /> Seleccionar
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* CREAR NUEVO */}
                <div className="px-5 pt-4 shrink-0">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${showCreateForm ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                    >
                        <span className="font-bold flex items-center gap-2"><Plus size={18} /> Crear Nuevo</span>
                        {showCreateForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {showCreateForm && (
                        <div className="mt-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-3 animate-in slide-in-from-top-2">
                            <input type="text" placeholder="Nombre Ejercicio" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
                            <div className="flex gap-3">
                                <select className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" value={newExercise.muscle} onChange={(e) => setNewExercise({ ...newExercise, muscle: e.target.value })}>
                                    {createMuscles.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <button onClick={handleCreateExercise} disabled={!newExercise.name.trim()} className="px-6 bg-blue-600 text-white font-bold rounded-lg"><Save size={18} /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* FILTROS */}
                <div className="p-5 space-y-3 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input type="text" placeholder="Buscar..." className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 pl-10 text-white focus:border-blue-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {muscles.map(muscle => (
                            <button key={muscle} onClick={() => setSelectedMuscle(muscle)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedMuscle === muscle ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{muscle}</button>
                        ))}
                    </div>
                </div>

                {/* LISTA DE EJERCICIOS */}
                <div className="flex-1 overflow-y-auto p-5 pt-0 pb-28 custom-scrollbar">
                    {loading ? <div className="text-center py-10 text-gray-500">Cargando...</div> :
                        <div className="grid grid-cols-1 gap-2">
                            {filteredExercises.map((ex) => {
                                const isSelected = selectedExercises.find(s => s._id === ex._id);
                                return (
                                    <button
                                        key={ex._id}
                                        onClick={() => toggleSelection(ex)}
                                        className={`flex items-center justify-between p-4 rounded-xl text-left transition-all border ${isSelected
                                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                                : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
                                            }`}
                                    >
                                        <div>
                                            <h3 className={`font-bold transition-colors ${isSelected ? 'text-blue-400' : 'text-white'}`}>{ex.name}</h3>
                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{ex.muscle}</span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-600 text-transparent'}`}>
                                            <CheckCircle2 size={16} fill="currentColor" className={isSelected ? 'block' : 'hidden'} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>}
                </div>

                {/* BOTÓN FLOTANTE INFERIOR */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent z-10">
                    <button
                        onClick={handleConfirm}
                        disabled={selectedExercises.length === 0}
                        className="w-full bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {selectedExercises.length === 0 ? "Selecciona ejercicios" : (
                            <>
                                <CheckCircle2 size={20} />
                                Añadir {selectedExercises.length} Ejercicio{selectedExercises.length !== 1 && 's'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}