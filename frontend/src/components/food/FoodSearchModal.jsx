import { useState, useEffect, useRef } from 'react';
import { Plus, X, Camera, Sparkles, Loader2, Save, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function FoodSearchModal({ mealId, onClose, onFoodAdded, onShowToast }) {
    const [view, setView] = useState('list');
    const [savedFoods, setSavedFoods] = useState([]);

    // Datos escáner
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [userContext, setUserContext] = useState('');

    const [selectedFood, setSelectedFood] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const fileInputRef = useRef(null);

    useEffect(() => { fetchSavedFoods(); }, []);

    const fetchSavedFoods = async () => {
        try {
            const res = await api.get('/food/saved');
            setSavedFoods(res.data);
        } catch (error) { console.error(error); }
    };

    // --- BORRAR COMIDA ---
    const handleDeleteFood = async (id, e) => {
        e.stopPropagation();
        if (!confirm("¿Borrar de la lista?")) return;
        try {
            await api.delete(`/food/saved/${id}`);
            setSavedFoods(prev => prev.filter(food => food._id !== id));
            onShowToast("Alimento eliminado");
        } catch (error) { onShowToast("Error al eliminar", "error"); }
    };

    // --- SELECCIONAR FOTO ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
        setView('preview');
    };

    // --- ANALIZAR ---
    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setView('scan');
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('context', userContext);

        try {
            const res = await api.post('/food/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const aiFood = { ...res.data, _id: 'ai_temp', icon: '✨' };
            setSelectedFood(aiFood);
            setView('result');
        } catch (error) {
            onShowToast(error.response?.data?.message || "Error al escanear", "error");
            setView('list');
        }
    };

    const handleAdd = async () => {
        if (!selectedFood) return;
        try {
            await api.post('/food/add', {
                mealId,
                foodId: selectedFood._id === 'ai_temp' ? null : selectedFood._id,
                rawFood: selectedFood._id === 'ai_temp' ? selectedFood : null,
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
            setSelectedFood({ ...selectedFood, _id: res.data._id, icon: '🍽️' });
            fetchSavedFoods();
        } catch (error) { onShowToast("Error al guardar", "error"); }
    };

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* HEADER */}
            <div className="bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
                {view === 'list' ? (
                    <span className="font-bold text-white text-lg">Añadir Alimento</span>
                ) : (
                    <button onClick={() => { setView('list'); setSelectedFood(null); setUserContext(''); }} className="flex items-center gap-2 text-gray-400">
                        <ArrowLeft size={20} /> Volver
                    </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full bg-gray-800 text-gray-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col">

                {/* VISTA 1: LISTA */}
                {view === 'list' && (
                    <>
                        <div onClick={() => fileInputRef.current.click()} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 flex items-center justify-center gap-4 cursor-pointer shadow-lg active:scale-95 transition-transform">
                            <div className="bg-white/20 p-3 rounded-full"><Camera size={32} className="text-white" /></div>
                            <div><h3 className="text-white font-bold text-lg">Escanear Comida</h3><p className="text-blue-100 text-xs">Identificar con IA</p></div>
                        </div>
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Mis Comidas Guardadas</h4>
                        <div className="space-y-2">
                            {savedFoods.length === 0 ? (
                                <p className="text-center text-gray-600 text-sm py-10">Lista vacía. ¡Escanea algo!</p>
                            ) : (
                                savedFoods.map(food => (
                                    <div
                                        key={food._id}
                                        onClick={() => { setSelectedFood(food); setView('result'); }}
                                        className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center cursor-pointer active:scale-95 transition-transform group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{food.icon}</span>
                                            <div><h4 className="font-bold text-white">{food.name}</h4><p className="text-xs text-gray-500">{food.calories} kcal • {food.servingSize}</p></div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={(e) => handleDeleteFood(food._id, e)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            <Plus className="text-blue-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* VISTA 2: PREVIEW + CONTEXTO */}
                {view === 'preview' && (
                    <div className="flex flex-col h-full animate-in fade-in">
                        <div className="flex-1 bg-gray-800 rounded-2xl overflow-hidden relative mb-4 border border-gray-700">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl mb-4">
                            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Detalles opcionales</label>
                            <input autoFocus type="text" placeholder="Ej: Sin azúcar, 200g..." value={userContext} onChange={(e) => setUserContext(e.target.value)} className="w-full bg-gray-800 text-white border-b border-gray-700 pb-2 focus:outline-none focus:border-blue-500 placeholder-gray-600" />
                        </div>
                        <button onClick={handleAnalyze} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <Sparkles size={20} /> ANALIZAR AHORA
                        </button>
                    </div>
                )}

                {view === 'scan' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 relative"><Loader2 className="animate-spin text-blue-500" size={48} /><Sparkles className="absolute top-0 right-0 text-yellow-400 animate-ping" /></div>
                        <h3 className="text-xl font-bold text-white">Consultando IA...</h3>
                    </div>
                )}

                {view === 'result' && selectedFood && (
                    <div className="flex flex-col items-center mt-4 space-y-6 animate-in zoom-in-95">
                        <div className="text-6xl animate-bounce">{selectedFood.icon}</div>
                        <div className="text-center"><h2 className="text-2xl font-bold text-white">{selectedFood.name}</h2><p className="text-gray-500 text-sm">{selectedFood.calories * quantity} Kcal</p></div>

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
                            {selectedFood._id === 'ai_temp' && (
                                <button onClick={handleSaveToDb} className="w-full bg-gray-800 hover:bg-gray-700 py-4 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 border border-gray-700"><Save size={20} /> GUARDAR EN LISTA</button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}