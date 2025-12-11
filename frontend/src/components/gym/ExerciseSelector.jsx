import { useState, useEffect } from 'react';
import { Search, CheckCircle, Circle, Plus } from 'lucide-react';
import api from '../../services/api'; // <--- NOTA LOS DOS PUNTOS ../../

export default function ExerciseSelector({ onAddExercises, onClose }) {
    const [exercises, setExercises] = useState([]);
    const [selected, setSelected] = useState([]);
    const [filter, setFilter] = useState('Todos');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        try {
            await api.post('/gym/exercises/seed');
            const res = await api.get('/gym/exercises');
            setExercises(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (exercise) => {
        const isSelected = selected.find(s => s._id === exercise._id);
        if (isSelected) {
            setSelected(prev => prev.filter(s => s._id !== exercise._id));
        } else {
            setSelected(prev => [...prev, exercise]);
        }
    };

    const handleConfirm = () => {
        onAddExercises(selected);
    };

    const muscles = ['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bíceps', 'Tríceps', 'Abs'];

    const filteredExercises = exercises.filter(ex => {
        const matchesMuscle = filter === 'Todos' || ex.muscle === filter;
        const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
        return matchesMuscle && matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[60] bg-gray-950 flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* HEADER */}
            <div className="px-4 py-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-3">
                    <button onClick={onClose} className="text-gray-400 font-medium">Cancelar</button>
                    <span className="text-white font-bold">Agregar Ejercicios</span>
                    <span className="w-16"></span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar ejercicio"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-800 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 placeholder-gray-500"
                    />
                </div>
            </div>

            {/* FILTROS */}
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-gray-800 scrollbar-hide bg-gray-950">
                {muscles.map(m => (
                    <button
                        key={m}
                        onClick={() => setFilter(m)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors
                    ${filter === m ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
                `}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* LISTA */}
            <div className="flex-1 overflow-y-auto p-2 pb-24">
                {loading ? (
                    <div className="text-center text-gray-500 mt-10">Cargando catálogo...</div>
                ) : (
                    <div className="space-y-1">
                        {filteredExercises.map(ex => {
                            const isSelected = selected.find(s => s._id === ex._id);
                            return (
                                <div
                                    key={ex._id}
                                    onClick={() => toggleSelection(ex)}
                                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-all
                                ${isSelected ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800'}
                            `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition-colors
                                    ${isSelected ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}
                                `}>
                                            {ex.muscle.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-white'}`}>{ex.name}</h4>
                                            <p className="text-gray-500 text-xs">{ex.muscle}</p>
                                        </div>
                                    </div>

                                    {isSelected ? (
                                        <CheckCircle size={24} className="text-blue-500 fill-blue-500/20" />
                                    ) : (
                                        <Circle size={24} className="text-gray-700" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* BARRA INFERIOR */}
            {selected.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-950 border-t border-gray-800 animate-in slide-in-from-bottom">
                    <button
                        onClick={handleConfirm}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Añadir {selected.length} Ejercicios
                    </button>
                </div>
            )}

        </div>
    );
}