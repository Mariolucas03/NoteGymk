import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings, X, Save, Bot, Send, ChevronRight, LayoutGrid, Flame, Wheat, Droplet, Leaf, Plus } from 'lucide-react';
import api from '../services/api';
import FoodSearchModal from '../components/food/FoodSearchModal';
import Toast from '../components/common/Toast';

export default function Food() {
    const { user, setUser } = useOutletContext();

    // Estados Principales
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal de Añadir Comida
    const [activeMealId, setActiveMealId] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    // Modal de Configuración (IA / Manual)
    const [configModal, setConfigModal] = useState({ show: false, mode: 'manual' });

    // Objetivos (Macros)
    const [goals, setGoals] = useState(() => {
        if (user && user.macros) return user.macros;
        return { calories: 2100, protein: 158, carbs: 210, fat: 70, fiber: 30 };
    });

    useEffect(() => {
        if (user && user.macros) setGoals(user.macros);
    }, [user]);

    // Chat IA y Manual
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Input Manual
    const [manualCalories, setManualCalories] = useState(goals.calories);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Carga inicial
    useEffect(() => { fetchLog(); }, []);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

    const fetchLog = async () => {
        try {
            const res = await api.get('/food/log');
            setLog(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    // --- ACCIONES DE OBJETIVOS ---

    const updateGoals = async (newGoals) => {
        try {
            const res = await api.put('/users/macros', newGoals);
            setGoals(res.data.macros);
            setUser(res.data);
            return true;
        }
        catch (error) {
            console.error(error);
            showToast("Error guardando objetivos", "error");
            return false;
        }
    };

    // --- GUARDADO MANUAL REPARADO ---
    // Ahora calcula los macros automáticamente al guardar solo calorías
    const handleSaveManual = async () => {
        const kcal = parseInt(manualCalories);
        if (isNaN(kcal) || kcal < 500) return showToast("Introduce calorías válidas", "error");

        // Auto-cálculo aproximado: 30% Prot, 40% Carb, 30% Fat
        const p = Math.round((kcal * 0.3) / 4);
        const c = Math.round((kcal * 0.4) / 4);
        const f = Math.round((kcal * 0.3) / 9);
        const fib = Math.round(kcal / 1000 * 14); // Estándar de 14g fibra/1000kcal

        const newMacros = {
            calories: kcal,
            protein: p,
            carbs: c,
            fat: f,
            fiber: fib
        };

        const success = await updateGoals(newMacros);
        if (success) {
            setConfigModal({ show: false, mode: 'manual' });
            showToast("Objetivos actualizados");
        }
    };

    // --- CHAT IA ---
    const handleSendChat = async () => {
        if (!chatInput.trim()) return;

        const userMsg = { role: 'user', content: chatInput };
        const newHistory = [...chatHistory, userMsg];
        setChatHistory(newHistory);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await api.post('/food/chat-macros', { history: newHistory });

            if (res.data.type === 'final') {
                const { calories, protein, carbs, fat, fiber, message } = res.data.data;
                await updateGoals({
                    calories: Number(calories),
                    protein: Number(protein),
                    carbs: Number(carbs),
                    fat: Number(fat),
                    fiber: Number(fiber)
                });

                setConfigModal({ show: false, mode: 'manual' });
                showToast(message || "Calculado por IA", "success");
                setChatHistory([]);
            } else {
                setChatHistory([...newHistory, { role: 'assistant', content: res.data.message }]);
            }
        } catch (error) {
            showToast("Error de conexión IA", "error");
        } finally {
            setChatLoading(false);
        }
    };

    // --- INICIO DE CHAT CON INSTRUCCIONES FIJAS ---
    const startChat = () => {
        // Mensaje Anclado Claro
        setChatHistory([{
            role: 'assistant',
            content: `📝 DATOS NECESARIOS (Escríbelos todos juntos):
• Edad
• Género (Hombre/Mujer)
• Peso (kg)
• Altura (cm)
• Actividad (Sedentario / Ligero / Moderado / Intenso)
• Objetivo (Perder / Mantener / Ganar)

Ejemplo: "Hombre, 25 años, 80kg, 180cm, sedentario, perder peso"`
        }]);
        setConfigModal({ show: true, mode: 'ai' });
    };

    // --- OTRAS ACCIONES ---
    const handleOpenAdd = (mealId) => {
        setActiveMealId(mealId);
        setShowSearch(true);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        try {
            await api.post('/food/category', { name: newCategoryName });
            fetchLog();
            setConfigModal({ show: false, mode: 'manual' });
            setNewCategoryName('');
            showToast("Categoría añadida");
        } catch (error) { showToast("Error", "error"); }
    };

    if (loading) return <div className="text-center py-20 text-gray-500 animate-pulse">Cargando diario...</div>;

    const calPercent = Math.min((log?.totalCalories / goals.calories) * 100, 100);
    const calColor = log?.totalCalories > goals.calories ? '#ef4444' : '#3b82f6';

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in relative select-none">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase">Diario</h1>
                    <p className="text-xs text-gray-500">Meta: {goals.calories} kcal</p>
                </div>
                <button onClick={() => setConfigModal({ show: true, mode: 'manual' })} className="bg-gray-800 p-2 rounded-xl text-gray-400 hover:text-white border border-gray-700">
                    <Settings size={20} />
                </button>
            </div>

            {/* SUMMARY CHART */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="transform -rotate-90 w-full h-full">
                            <circle cx="50%" cy="50%" r="48" stroke="#1f2937" strokeWidth="8" fill="transparent" />
                            <circle cx="50%" cy="50%" r="48" stroke={calColor} strokeWidth="8" fill="transparent" strokeDasharray={301} strokeDashoffset={301 - (301 * calPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-black text-white">{log?.totalCalories || 0}</span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase">de {goals.calories}</span>
                        </div>
                    </div>

                    <div className="flex-1 pl-6 space-y-2">
                        {[
                            { label: 'Prot', current: log?.totalProtein, total: goals.protein, color: 'bg-blue-500', text: 'text-blue-400', icon: <Flame size={10} /> },
                            { label: 'Carbs', current: log?.totalCarbs, total: goals.carbs, color: 'bg-yellow-500', text: 'text-yellow-400', icon: <Wheat size={10} /> },
                            { label: 'Grasa', current: log?.totalFat, total: goals.fat, color: 'bg-red-500', text: 'text-red-400', icon: <Droplet size={10} /> },
                            { label: 'Fibra', current: log?.totalFiber, total: goals.fiber, color: 'bg-green-500', text: 'text-green-500', icon: <Leaf size={10} /> },
                        ].map((m, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[10px] font-bold mb-0.5">
                                    <span className={`${m.text} flex items-center gap-1 uppercase`}>{m.icon} {m.label}</span>
                                    <span className="text-gray-500">{m.current}/{m.total}</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min((m.current / m.total) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MEAL LIST */}
            <div className="space-y-4">
                {log?.meals.map((meal) => {
                    const mealKcal = meal.foods.reduce((acc, i) => acc + i.calories, 0);
                    return (
                        <div key={meal._id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800">
                                <div>
                                    <h3 className="text-white font-bold text-lg capitalize">{meal.name}</h3>
                                    <p className="text-xs text-gray-500">{meal.foods.length} alimentos • {mealKcal} kcal</p>
                                </div>
                                <button onClick={() => handleOpenAdd(meal._id)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 active:scale-95">
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="p-2">
                                {meal.foods.length === 0 ? (
                                    <p className="text-center text-xs text-gray-600 py-4 italic">Vacío</p>
                                ) : (
                                    meal.foods.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-800/50 rounded-xl transition-colors border-b border-gray-800/50 last:border-0">
                                            <div>
                                                <p className="text-sm font-bold text-gray-200">{item.name}</p>
                                                <p className="text-[10px] text-gray-500 flex gap-2">
                                                    <span>{item.quantity} ración</span>
                                                    <span className="text-blue-400 font-bold">P: {item.protein}g</span>
                                                </p>
                                            </div>
                                            <span className="text-sm font-black text-white">{item.calories}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button onClick={() => setConfigModal({ show: true, mode: 'category' })} className="w-full mt-6 py-4 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-white hover:border-gray-600 hover:bg-gray-900 transition-all active:scale-95 uppercase text-xs tracking-widest">
                <LayoutGrid size={18} /> Nueva Categoría
            </button>

            {/* MODAL SEARCH */}
            {showSearch && (
                <FoodSearchModal
                    mealId={activeMealId}
                    onClose={() => setShowSearch(false)}
                    onFoodAdded={fetchLog}
                    onShowToast={showToast}
                />
            )}

            {/* MODAL CONFIGURACIÓN */}
            {configModal.show && (
                <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">

                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">
                                {configModal.mode === 'ai' ? 'Nutricionista IA' : configModal.mode === 'category' ? 'Nueva Categoría' : 'Ajustes'}
                            </h3>
                            <button onClick={() => setConfigModal({ ...configModal, show: false })} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">

                            {/* MANUAL */}
                            {configModal.mode === 'manual' && (
                                <div className="space-y-4">
                                    <div onClick={startChat} className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 flex items-center gap-3 cursor-pointer hover:bg-blue-900/30 transition-colors">
                                        <div className="bg-blue-600 p-2 rounded-full text-white"><Bot size={24} /></div>
                                        <div>
                                            <h4 className="font-bold text-blue-200 text-sm">Usar IA</h4>
                                            <p className="text-xs text-blue-300/70">Calcula tus macros auto.</p>
                                        </div>
                                        <ChevronRight className="ml-auto text-blue-400" size={16} />
                                    </div>

                                    <div className="border-t border-gray-800 pt-4">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Objetivo Calorías (Manual)</p>
                                        <input
                                            type="number"
                                            value={manualCalories}
                                            onChange={e => setManualCalories(e.target.value)}
                                            className="w-full bg-gray-950 text-white text-xl font-bold p-4 rounded-xl border border-gray-800 focus:border-blue-500 outline-none"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2 italic">* Recalcula macros automáticamente (30/40/30)</p>
                                        <button onClick={handleSaveManual} className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl border border-gray-700 flex justify-center gap-2 transition-colors">
                                            <Save size={18} /> Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CATEGORÍA */}
                            {configModal.mode === 'category' && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Nombre</p>
                                    <input autoFocus type="text" placeholder="Ej: Merienda" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full bg-gray-950 text-white text-xl font-bold p-4 rounded-xl border border-gray-800 focus:border-blue-500 outline-none" />
                                    <button onClick={handleCreateCategory} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">Crear</button>
                                </div>
                            )}

                            {/* CHAT IA */}
                            {configModal.mode === 'ai' && (
                                <div className="flex flex-col h-[400px]">
                                    <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-black/20 rounded-xl mb-3 border border-gray-800">
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && <div className="text-xs text-gray-500 animate-pulse ml-2">Calculando...</div>}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Escribe tus datos..."
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                            className="flex-1 bg-gray-950 text-white p-3 rounded-xl border border-gray-800 focus:border-blue-500 outline-none text-sm"
                                        />
                                        <button onClick={handleSendChat} disabled={chatLoading} className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-blue-500 transition-colors">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}