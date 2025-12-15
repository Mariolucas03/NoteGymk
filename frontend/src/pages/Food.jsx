import { useState, useEffect, useRef } from 'react';
import { Plus, Flame, Droplet, Wheat, LayoutGrid, Leaf, Settings, X, Save, Bot, User, Send, ChevronRight } from 'lucide-react';
import api from '../services/api';
import FoodSearchModal from '../components/food/FoodSearchModal';
import Toast from '../components/common/Toast';

export default function Food() {
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [activeMealId, setActiveMealId] = useState(null);
    const [toast, setToast] = useState(null);

    // Estado Modal Configuración (Manual o IA)
    const [configModal, setConfigModal] = useState({ show: false, mode: 'manual' });

    // Estado Chat IA
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Estado Objetivos (Goals)
    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem('user_goals');
        return saved ? JSON.parse(saved) : { calories: 2100, protein: 158, carbs: 210, fat: 70, fiber: 29 };
    });

    // Input Manual
    const [manualCalories, setManualCalories] = useState(goals.calories);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => { fetchLog(); }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const fetchLog = async () => {
        try {
            const res = await api.get('/food/log');
            setLog(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    // --- LOGICA CHAT IA ---
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
                // IA terminó el cálculo
                const { calories, protein, carbs, fat, fiber, message } = res.data.data;

                const newGoals = { calories, protein, carbs, fat, fiber };
                setGoals(newGoals);
                localStorage.setItem('user_goals', JSON.stringify(newGoals));

                setConfigModal({ show: false, mode: 'manual' });
                showToast(message || "Objetivos actualizados por IA", "success");
                setChatHistory([]);
            } else {
                // IA hace otra pregunta
                setChatHistory([...newHistory, { role: 'assistant', content: res.data.message }]);
            }
        } catch (error) {
            showToast("Error conectando con el nutricionista", "error");
        } finally {
            setChatLoading(false);
        }
    };

    const handleSaveManual = () => {
        const kcal = parseInt(manualCalories);
        if (isNaN(kcal) || kcal < 500) return showToast("Mínimo 500 kcal", "error");

        const newGoals = {
            calories: kcal,
            protein: Math.round((kcal * 0.30) / 4),
            carbs: Math.round((kcal * 0.40) / 4),
            fat: Math.round((kcal * 0.30) / 9),
            fiber: Math.round((kcal / 1000) * 14)
        };

        setGoals(newGoals);
        localStorage.setItem('user_goals', JSON.stringify(newGoals));
        setConfigModal({ show: false, mode: 'manual' });
        showToast(`Límite actualizado: ${kcal} Kcal`);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        try {
            await api.post('/food/category', { name: newCategoryName });
            fetchLog();
            setConfigModal({ show: false, mode: 'manual' });
            setNewCategoryName('');
            showToast("Categoría creada");
        } catch (error) { showToast("Error creando categoría", "error"); }
    };

    const startChat = () => {
        if (chatHistory.length === 0) {
            setChatHistory([{ role: 'assistant', content: '¡Hola! Soy tu nutricionista IA. Para calcular tus macros exactos, necesito saber: Edad, Género, Peso, Altura, Nivel de actividad y tu Objetivo.' }]);
        }
        setConfigModal({ show: true, mode: 'ai' });
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

    const calPercent = Math.min((log?.totalCalories / goals.calories) * 100, 100);
    const calColor = log?.totalCalories > goals.calories ? '#ef4444' : '#3b82f6';

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in relative">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Diario de Comidas</h1>
                    <p className="text-xs text-gray-500">Objetivo: {goals.calories} kcal</p>
                </div>
                <button
                    onClick={() => setConfigModal({ show: true, mode: 'manual' })}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-xl border border-gray-700 transition-colors"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* GRÁFICOS */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
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
                    <div className="flex-1 pl-6 space-y-3">
                        <div><div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-blue-400 flex items-center gap-1"><Flame size={10} /> Prot</span><span className="text-gray-500">{log?.totalProtein}/{goals.protein}</span></div><div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((log?.totalProtein / goals.protein) * 100, 100)}%` }}></div></div></div>
                        <div><div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-yellow-400 flex items-center gap-1"><Wheat size={10} /> Carbs</span><span className="text-gray-500">{log?.totalCarbs}/{goals.carbs}</span></div><div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min((log?.totalCarbs / goals.carbs) * 100, 100)}%` }}></div></div></div>
                        <div><div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-red-400 flex items-center gap-1"><Droplet size={10} /> Grasa</span><span className="text-gray-500">{log?.totalFat}/{goals.fat}</span></div><div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((log?.totalFat / goals.fat) * 100, 100)}%` }}></div></div></div>
                        <div><div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-green-500 flex items-center gap-1"><Leaf size={10} /> Fibra</span><span className="text-gray-500">{log?.totalFiber}/{goals.fiber}</span></div><div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((log?.totalFiber / goals.fiber) * 100, 100)}%` }}></div></div></div>
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
                                <div><h3 className="text-white font-bold text-lg">{meal.name}</h3><p className="text-xs text-gray-500">{meal.foods.length} items • {mealKcal} kcal</p></div>
                                <button onClick={() => { setActiveMealId(meal._id); setShowSearch(true); }} className="bg-blue-600/20 text-blue-400 p-2 rounded-lg hover:bg-blue-600/40"><Plus size={18} strokeWidth={3} /></button>
                            </div>
                            <div className="p-2 space-y-1">
                                {meal.foods.length === 0 ? <p className="text-center text-xs text-gray-600 py-3 italic">Vacío</p> : meal.foods.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-800/50 rounded-xl">
                                        <div><p className="text-sm font-medium text-white">{item.name}</p><p className="text-[10px] text-gray-500">{item.quantity} ración • <span className="text-blue-400">P:{item.protein}</span></p></div>
                                        <span className="text-sm font-bold text-gray-300">{item.calories}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button onClick={() => setConfigModal({ show: true, mode: 'category' })} className="w-full mt-6 py-4 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-white hover:border-gray-500 transition-all active:scale-95">
                <LayoutGrid size={20} /> AÑADIR COMIDA
            </button>

            {/* --- MODAL CONFIGURACIÓN UNIFICADO --- */}
            {configModal.show && (
                <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">

                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">
                                {configModal.mode === 'ai' ? 'Asistente Nutricionista' : configModal.mode === 'category' ? 'Nueva Categoría' : 'Ajustar Objetivo'}
                            </h3>
                            <button onClick={() => setConfigModal({ ...configModal, show: false })} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">

                            {configModal.mode === 'manual' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 flex items-center gap-3 cursor-pointer hover:bg-blue-900/30 transition-colors" onClick={startChat}>
                                        <div className="bg-blue-600 p-2 rounded-full text-white"><Bot size={24} /></div>
                                        <div>
                                            <h4 className="font-bold text-blue-200 text-sm">Preguntar a la IA</h4>
                                            <p className="text-xs text-blue-300/70">Calcula tus macros exactos chateando.</p>
                                        </div>
                                        <ChevronRight className="ml-auto text-blue-400" size={16} />
                                    </div>

                                    <div className="border-t border-gray-800 pt-4">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">O introduce manualmente</p>
                                        <input type="number" value={manualCalories} onChange={e => setManualCalories(e.target.value)} className="w-full bg-gray-800 text-white text-xl font-bold p-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none" />
                                        <button onClick={handleSaveManual} className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl border border-gray-700"><Save size={18} className="inline mr-2" /> Guardar Límite</button>
                                    </div>
                                </div>
                            )}

                            {configModal.mode === 'category' && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Nombre de la comida</p>
                                    <input autoFocus type="text" placeholder="Ej: Recena" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full bg-gray-800 text-white text-xl font-bold p-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none" />
                                    <button onClick={handleCreateCategory} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg">Crear</button>
                                </div>
                            )}

                            {configModal.mode === 'ai' && (
                                <div className="flex flex-col h-[400px]">
                                    <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-950/50 rounded-xl mb-3 border border-gray-800">
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && <div className="text-xs text-gray-500 animate-pulse ml-2">Escribiendo...</div>}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Ej: Tengo 25 años..."
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                            className="flex-1 bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                                        />
                                        <button onClick={handleSendChat} disabled={chatLoading} className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50"><Send size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showSearch && <FoodSearchModal mealId={activeMealId} onClose={() => setShowSearch(false)} onFoodAdded={fetchLog} onShowToast={showToast} />}
        </div>
    );
}