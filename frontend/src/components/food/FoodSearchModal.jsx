import { useState, useEffect, useRef } from 'react';
import { Plus, X, Camera, Sparkles, Loader2, Save, ArrowLeft, Trash2, Edit2, RotateCw, PenTool, Flame, Beef, Wheat, Droplet, Leaf } from 'lucide-react';
import api from '../../services/api';

export default function FoodSearchModal({ mealId, onClose, onFoodAdded, onShowToast }) {
    const [view, setView] = useState('list'); // 'list', 'scan', 'preview', 'result', 'create'
    const [savedFoods, setSavedFoods] = useState([]);

    // Datos escáner
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [userContext, setUserContext] = useState('');

    // Datos selección / edición
    const [selectedFood, setSelectedFood] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Datos creación manual
    const [newFoodData, setNewFoodData] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });

    const fileInputRef = useRef(null);

    useEffect(() => { fetchSavedFoods(); }, []);

    const fetchSavedFoods = async () => {
        try {
            const res = await api.get('/food/saved');
            setSavedFoods(res.data);
        } catch (error) { console.error(error); }
    };

    // --- ACCIONES GENERALES ---

    const handleAdd = async () => {
        if (!selectedFood) return;
        try {
            await api.post('/food/add', {
                mealId,
                foodId: (selectedFood._id === 'ai_temp' || selectedFood._id === 'manual_temp') ? null : selectedFood._id,
                rawFood: (selectedFood._id === 'ai_temp' || selectedFood._id === 'manual_temp') ? selectedFood : null,
                quantity
            });
            onFoodAdded();
            onClose();
            onShowToast("Añadido al registro diario");
        } catch (error) { onShowToast("Error al añadir", "error"); }
    };

    const handleSaveToDb = async () => {
        if (!selectedFood) return;
        try {
            const res = await api.post('/food/save', selectedFood);
            onShowToast("Comida guardada");
            setSelectedFood({ ...res.data, icon: '🍽️' });
            fetchSavedFoods();
        } catch (error) { onShowToast("Error al guardar", "error"); }
    };

    const handleDeleteFood = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("¿Borrar de la lista?")) return;
        try {
            await api.delete(`/food/saved/${id}`);
            setSavedFoods(prev => prev.filter(food => food._id !== id));
            onShowToast("Alimento eliminado");
        } catch (error) { onShowToast("Error al eliminar", "error"); }
    };

    // --- LOGICA IA (ESCANEAR) ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPreviewUrl(URL.createObjectURL(file));
        setSelectedFile(file);
        setView('preview');
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setView('scan');
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('context', userContext);

        try {
            const res = await api.post('/food/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSelectedFood({ ...res.data, _id: 'ai_temp', icon: '✨' });
            setView('result');
        } catch (error) {
            onShowToast("Error al escanear", "error");
            setView('list');
        }
    };

    // --- LOGICA MANUAL (CREAR) ---
    const handleCreateManual = () => {
        if (!newFoodData.name || !newFoodData.calories) return alert("Nombre y Calorías obligatorios");

        const manualFood = {
            _id: 'manual_temp',
            name: newFoodData.name,
            calories: Number(newFoodData.calories),
            protein: Number(newFoodData.protein || 0),
            carbs: Number(newFoodData.carbs || 0),
            fat: Number(newFoodData.fat || 0),
            fiber: Number(newFoodData.fiber || 0),
            servingSize: '1 ración',
            icon: '📝'
        };
        setSelectedFood(manualFood);
        setView('result'); // Ir a vista final para confirmar/añadir
    };

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* HEADER */}
            <div className="bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
                {view === 'list' ? (
                    <span className="font-bold text-white text-lg">Añadir Alimento</span>
                ) : (
                    <button onClick={() => { setView('list'); setSelectedFood(null); }} className="flex items-center gap-2 text-gray-400">
                        <ArrowLeft size={20} /> Volver
                    </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full bg-gray-800 text-gray-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col">

                {/* VISTA 1: MENU PRINCIPAL */}
                {view === 'list' && (
                    <>
                        {/* BOTONES DE ACCIÓN RÁPIDA */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div onClick={() => fileInputRef.current.click()} className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform border border-blue-500/30">
                                <Camera size={28} className="text-blue-100" />
                                <span className="text-white font-bold text-sm">Escanear IA</span>
                            </div>
                            <div onClick={() => setView('create')} className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform border border-gray-600">
                                <PenTool size={28} className="text-gray-200" />
                                <span className="text-white font-bold text-sm">Crear Manual</span>
                            </div>
                        </div>

                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Mis Comidas Guardadas</h4>
                        <div className="space-y-2">
                            {savedFoods.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl">
                                    <p className="text-gray-500 text-sm">No tienes comidas guardadas.</p>
                                    <p className="text-xs text-gray-600">Crea una o escanea para empezar.</p>
                                </div>
                            ) : (
                                savedFoods.map(food => (
                                    <div key={food._id} onClick={() => { setSelectedFood(food); setView('result'); }} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center cursor-pointer active:scale-95 transition-transform group hover:bg-gray-800">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{food.icon || '🍽️'}</span>
                                            <div><h4 className="font-bold text-white">{food.name}</h4><p className="text-xs text-gray-500">{food.calories} kcal</p></div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={(e) => handleDeleteFood(food._id, e)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={18} /></button>
                                            <Plus className="text-blue-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* VISTA 2: FORMULARIO MANUAL (AÑADIDA FIBRA) */}
                {view === 'create' && (
                    <div className="animate-in fade-in space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4">Nueva Comida</h3>

                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Nombre</label>
                            <input type="text" placeholder="Ej: Arroz con Pollo" className="w-full bg-gray-800 text-white p-4 rounded-xl border border-gray-700 focus:border-blue-500 outline-none"
                                value={newFoodData.name} onChange={e => setNewFoodData({ ...newFoodData, name: e.target.value })} autoFocus />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase ml-1 flex items-center gap-1"><Flame size={12} /> Calorías</label>
                            <input type="number" placeholder="0" className="w-full bg-gray-800 text-white p-4 rounded-xl border border-gray-700 focus:border-orange-500 outline-none"
                                value={newFoodData.calories} onChange={e => setNewFoodData({ ...newFoodData, calories: e.target.value })} />
                        </div>

                        {/* GRID DE MACROS (4 COLUMNAS AHORA) */}
                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <label className="text-[10px] text-blue-400 font-bold uppercase mb-1 block text-center">Prot</label>
                                <input type="number" placeholder="0" className="w-full bg-gray-800 text-white p-2 rounded-xl border border-gray-700 text-center" value={newFoodData.protein} onChange={e => setNewFoodData({ ...newFoodData, protein: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-yellow-400 font-bold uppercase mb-1 block text-center">Carb</label>
                                <input type="number" placeholder="0" className="w-full bg-gray-800 text-white p-2 rounded-xl border border-gray-700 text-center" value={newFoodData.carbs} onChange={e => setNewFoodData({ ...newFoodData, carbs: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-red-400 font-bold uppercase mb-1 block text-center">Grasa</label>
                                <input type="number" placeholder="0" className="w-full bg-gray-800 text-white p-2 rounded-xl border border-gray-700 text-center" value={newFoodData.fat} onChange={e => setNewFoodData({ ...newFoodData, fat: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-green-500 font-bold uppercase mb-1 block text-center">Fibra</label>
                                <input type="number" placeholder="0" className="w-full bg-gray-800 text-white p-2 rounded-xl border border-gray-700 text-center" value={newFoodData.fiber} onChange={e => setNewFoodData({ ...newFoodData, fiber: e.target.value })} />
                            </div>
                        </div>

                        <button onClick={handleCreateManual} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-4 shadow-lg active:scale-95 transition-transform">CONTINUAR</button>
                    </div>
                )}

                {/* VISTA 3: PREVIEW FOTO */}
                {view === 'preview' && (
                    <div className="flex flex-col h-full animate-in fade-in">
                        <div className="flex-1 bg-gray-800 rounded-2xl overflow-hidden relative mb-4 border border-gray-700">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <input type="text" placeholder="Detalles opcionales (ej: sin salsa)" value={userContext} onChange={(e) => setUserContext(e.target.value)} className="w-full bg-gray-900 border border-gray-800 text-white p-4 rounded-xl mb-4 focus:outline-none focus:border-blue-500" />
                        <button onClick={handleAnalyze} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"><Sparkles size={20} /> ANALIZAR</button>
                    </div>
                )}

                {/* VISTA 4: LOADING */}
                {view === 'scan' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 relative"><Loader2 className="animate-spin text-blue-500" size={48} /><Sparkles className="absolute top-0 right-0 text-yellow-400 animate-ping" /></div>
                        <h3 className="text-xl font-bold text-white">Analizando...</h3>
                    </div>
                )}

                {/* VISTA 5: RESULTADO FINAL (Edición antes de añadir) */}
                {view === 'result' && selectedFood && (
                    <div className="flex flex-col items-center mt-4 space-y-6 animate-in zoom-in-95">
                        <div className="text-6xl animate-bounce">{selectedFood.icon}</div>
                        <div className="text-center w-full px-6">
                            <input type="text" value={selectedFood.name} onChange={(e) => setSelectedFood({ ...selectedFood, name: e.target.value })} className="bg-transparent text-2xl font-bold text-white text-center w-full border-b border-gray-700 focus:border-blue-500 outline-none pb-1" />
                            <p className="text-gray-500 text-sm mt-2">{Math.round(selectedFood.calories * quantity)} Kcal</p>
                        </div>

                        <div className="flex items-center gap-6 bg-gray-800 p-2 rounded-2xl">
                            <button onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))} className="w-12 h-12 bg-gray-700 rounded-xl font-bold text-white text-xl">-</button>
                            <div className="text-center w-24"><span className="text-4xl font-bold text-white">{quantity}</span><p className="text-xs text-gray-400">Ración</p></div>
                            <button onClick={() => setQuantity(q => q + 0.5)} className="w-12 h-12 bg-blue-600 rounded-xl font-bold text-white text-xl">+</button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 w-full">
                            <div className="bg-gray-800 p-2 rounded-xl text-center border border-gray-700"><p className="text-blue-400 text-[10px] font-bold uppercase">Prot</p><p className="text-lg font-bold text-white">{Math.round(selectedFood.protein * quantity)}</p></div>
                            <div className="bg-gray-800 p-2 rounded-xl text-center border border-gray-700"><p className="text-yellow-400 text-[10px] font-bold uppercase">Carb</p><p className="text-lg font-bold text-white">{Math.round(selectedFood.carbs * quantity)}</p></div>
                            <div className="bg-gray-800 p-2 rounded-xl text-center border border-gray-700"><p className="text-red-400 text-[10px] font-bold uppercase">Grasa</p><p className="text-lg font-bold text-white">{Math.round(selectedFood.fat * quantity)}</p></div>
                            <div className="bg-gray-800 p-2 rounded-xl text-center border border-gray-700"><p className="text-green-500 text-[10px] font-bold uppercase">Fibra</p><p className="text-lg font-bold text-white">{Math.round(selectedFood.fiber * quantity)}</p></div>
                        </div>

                        <div className="w-full space-y-3 pt-4">
                            <button onClick={handleAdd} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"><Plus size={24} /> AÑADIR A HOY</button>
                            {(selectedFood._id === 'ai_temp' || selectedFood._id === 'manual_temp') && (
                                <button onClick={handleSaveToDb} className="w-full bg-gray-800 hover:bg-gray-700 py-4 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 border border-gray-700"><Save size={20} /> GUARDAR EN LISTA</button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}