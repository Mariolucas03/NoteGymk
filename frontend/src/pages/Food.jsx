import { useState, useEffect } from 'react';
import { Plus, Flame, Droplet, Wheat, LayoutGrid, Leaf, Settings, X, Save } from 'lucide-react';
import api from '../services/api';
import FoodSearchModal from '../components/food/FoodSearchModal';
import Toast from '../components/common/Toast';

export default function Food() {
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [activeMealId, setActiveMealId] = useState(null);
    const [toast, setToast] = useState(null);

    // Estado para el Modal de Entrada (Sustituye a los Prompts)
    const [inputModal, setInputModal] = useState({
        show: false,
        type: null, // 'calories' o 'category'
        value: ''
    });

    // --- GESTIÓN DE METAS (GOALS) ---
    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem('user_goals');
        return saved ? JSON.parse(saved) : { calories: 2100, protein: 158, carbs: 210, fat: 70, fiber: 29 };
    });

    useEffect(() => { fetchLog(); }, []);

    const fetchLog = async () => {
        try {
            const res = await api.get('/food/log');
            setLog(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    // --- ABRIR MODAL CALORÍAS ---
    const openLimitModal = () => {
        setInputModal({ show: true, type: 'calories', value: goals.calories });
    };

    // --- ABRIR MODAL CATEGORÍA ---
    const openCategoryModal = () => {
        setInputModal({ show: true, type: 'category', value: '' });
    };

    // --- GUARDAR EL INPUT DEL MODAL ---
    const handleSaveInput = async () => {
        const { type, value } = inputModal;

        if (!value) return;

        // CASO A: GUARDAR LÍMITE
        if (type === 'calories') {
            const kcal = parseInt(value);
            if (isNaN(kcal) || kcal < 500) return showToast("Introduce un número válido", "error");

            // Recálculo automático de macros (Fitness: 30% P, 40% C, 30% G)
            const newGoals = {
                calories: kcal,
                protein: Math.round((kcal * 0.30) / 4),
                carbs: Math.round((kcal * 0.40) / 4),
                fat: Math.round((kcal * 0.30) / 9),
                fiber: Math.round((kcal / 1000) * 14)
            };

            setGoals(newGoals);
            localStorage.setItem('user_goals', JSON.stringify(newGoals));
            showToast(`Límite actualizado: ${kcal} Kcal`);
        }

        // CASO B: CREAR CATEGORÍA
        if (type === 'category') {
            try {
                await api.post('/food/category', { name: value });
                fetchLog();
                showToast("Categoría creada");
            } catch (error) { showToast("Error al crear", "error"); }
        }

        // CERRAR
        setInputModal({ show: false, type: null, value: '' });
    };

    const handleOpenSearch = (mealId) => {
        setActiveMealId(mealId);
        setShowSearch(true);
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

    const calPercent = Math.min((log?.totalCalories / goals.calories) * 100, 100);
    const calColor = log?.totalCalories > goals.calories ? '#ef4444' : '#3b82f6';

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in relative">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* --- NUEVO TÍTULO Y BOTÓN --- */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Registra tus comidas</h1>
                    <p className="text-xs text-gray-500">Controla tus macros diarios</p>
                </div>
                <button
                    onClick={openLimitModal} // Abre modal en vez de prompt
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-xs font-bold transition-colors border border-gray-700"
                >
                    <Settings size={14} /> Establecer límite
                </button>
            </div>

            {/* HEADER GRÁFICOS */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    {/* Círculo Kcal */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="transform -rotate-90 w-full h-full">
                            <circle cx="50%" cy="50%" r="56" stroke="#1f2937" strokeWidth="12" fill="transparent" />
                            <circle cx="50%" cy="50%" r="56" stroke={calColor} strokeWidth="12" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * calPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-bold text-white">{log?.totalCalories || 0}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">de {goals.calories}</span>
                        </div>
                    </div>

                    {/* Barras Macros */}
                    <div className="flex-1 pl-6 space-y-3">
                        {/* Proteína */}
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-blue-400 flex items-center gap-1"><Flame size={10} /> Prot</span><span className="text-gray-500">{log?.totalProtein}/{goals.protein}</span></div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((log?.totalProtein / goals.protein) * 100, 100)}%` }}></div></div>
                        </div>
                        {/* Carbs */}
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-yellow-400 flex items-center gap-1"><Wheat size={10} /> Carbs</span><span className="text-gray-500">{log?.totalCarbs}/{goals.carbs}</span></div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min((log?.totalCarbs / goals.carbs) * 100, 100)}%` }}></div></div>
                        </div>
                        {/* Grasas */}
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-red-400 flex items-center gap-1"><Droplet size={10} /> Grasa</span><span className="text-gray-500">{log?.totalFat}/{goals.fat}</span></div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((log?.totalFat / goals.fat) * 100, 100)}%` }}></div></div>
                        </div>
                        {/* Fibra */}
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-green-500 flex items-center gap-1"><Leaf size={10} /> Fibra</span><span className="text-gray-500">{log?.totalFiber}/{goals.fiber}</span></div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((log?.totalFiber / goals.fiber) * 100, 100)}%` }}></div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTA DE COMIDAS */}
            <div className="space-y-4">
                {log?.meals.map((meal) => {
                    const mealKcal = meal.foods.reduce((acc, i) => acc + i.calories, 0);
                    return (
                        <div key={meal._id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800">
                                <div>
                                    <h3 className="text-white font-bold text-lg">{meal.name}</h3>
                                    <p className="text-xs text-gray-500">{meal.foods.length} alimentos • {mealKcal} kcal</p>
                                </div>
                                <button onClick={() => handleOpenSearch(meal._id)} className="bg-blue-600/20 text-blue-400 p-2 rounded-lg hover:bg-blue-600/40 transition-colors">
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="p-2 space-y-1">
                                {meal.foods.length === 0 ? (
                                    <p className="text-center text-xs text-gray-600 py-3 italic">Vacío</p>
                                ) : (
                                    meal.foods.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-800/50 rounded-xl transition-colors">
                                            <div>
                                                <p className="text-sm font-medium text-white">{item.name}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    {item.quantity} ración • <span className="text-blue-400">P:{item.protein}</span> <span className="text-yellow-500">C:{item.carbs}</span> <span className="text-red-400">F:{item.fat}</span>
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-gray-300">{item.calories}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={openCategoryModal} // Abre modal en vez de prompt
                className="w-full mt-6 py-4 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-white hover:border-gray-500 transition-all active:scale-95"
            >
                <LayoutGrid size={20} /> AÑADIR COMIDA
            </button>

            {/* --- MODAL DE ENTRADA UNIVERSAL (Para Límite y Nueva Categoría) --- */}
            {inputModal.show && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {inputModal.type === 'calories' ? 'Objetivo Diario' : 'Nueva Categoría'}
                            </h3>
                            <button onClick={() => setInputModal({ ...inputModal, show: false })} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Input */}
                        <div className="mb-6">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-2">
                                {inputModal.type === 'calories' ? 'Calorías (Kcal)' : 'Nombre de la comida'}
                            </p>
                            <input
                                autoFocus
                                type={inputModal.type === 'calories' ? 'number' : 'text'}
                                placeholder={inputModal.type === 'calories' ? 'Ej: 2500' : 'Ej: Recena'}
                                value={inputModal.value}
                                onChange={(e) => setInputModal({ ...inputModal, value: e.target.value })}
                                className="w-full bg-gray-800 text-white text-xl font-bold p-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                            {inputModal.type === 'calories' && (
                                <p className="text-[10px] text-gray-500 mt-2">
                                    *Los macros (Proteína, Carb, Grasa) se calcularán automáticamente.
                                </p>
                            )}
                        </div>

                        {/* Botones */}
                        <button
                            onClick={handleSaveInput}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL BÚSQUEDA --- */}
            {showSearch && (
                <FoodSearchModal
                    mealId={activeMealId}
                    onClose={() => setShowSearch(false)}
                    onFoodAdded={fetchLog}
                    onShowToast={showToast}
                />
            )}
        </div>
    );
}