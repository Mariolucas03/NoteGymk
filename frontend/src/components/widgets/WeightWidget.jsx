import { useState, useEffect } from 'react';
import { Scale, X, Save, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export default function WeightWidget({ initialWeight }) {
    const [weight, setWeight] = useState(initialWeight || 0);
    const [history, setHistory] = useState([]); // Array de objetos { date, weight }
    const [isOpen, setIsOpen] = useState(false); // Controla si el modal está abierto
    const [newWeight, setNewWeight] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Cargar historial
    useEffect(() => {
        if (initialWeight) setWeight(initialWeight);
        fetchHistory();
    }, [initialWeight]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/daily/history');
            // Guardamos el objeto completo para tener fecha y peso
            // Filtramos pesos > 0
            setHistory(res.data.filter(log => log.weight > 0));
        } catch (error) {
            console.error("Error historial peso", error);
        }
    };

    // 2. Guardar nuevo peso
    const handleSave = async (e) => {
        e.preventDefault();
        if (!newWeight) return;

        setLoading(true);
        try {
            await api.put('/daily/update', { type: 'weight', value: parseFloat(newWeight) });
            setWeight(parseFloat(newWeight));
            await fetchHistory(); // Recargamos historial para actualizar la gráfica grande
            setIsOpen(false); // Cerramos modal
            setNewWeight('');
        } catch (error) {
            console.error("Error guardando peso", error);
        } finally {
            setLoading(false);
        }
    };

    // Función auxiliar para calcular altura de barras
    const getBarHeight = (val, allWeights) => {
        if (allWeights.length === 0) return 50;
        const max = Math.max(...allWeights) + 2;
        const min = Math.min(...allWeights) - 2;
        if (max === min) return 50;
        return ((val - min) / (max - min)) * 80 + 10; // Entre 10% y 90%
    };

    // Extraemos solo los valores numéricos para cálculos
    const weightValues = history.map(h => h.weight);

    return (
        <>
            {/* --- 1. TARJETA PEQUEÑA (WIDGET HOME) --- */}
            <div
                onClick={() => setIsOpen(true)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-blue-500/50 transition-all group"
            >
                <div className="flex justify-between items-start z-10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                        <Scale size={12} /> Peso
                    </h3>
                    <TrendingUp size={14} className="text-gray-600 group-hover:text-blue-500" />
                </div>

                <div className="z-10 mt-1">
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {weight > 0 ? weight : '--'} <span className="text-sm text-gray-500 font-medium">kg</span>
                    </p>

                    {/* Mini Gráfica (Sparkline) */}
                    <div className="h-10 mt-3 flex items-end gap-1 opacity-60">
                        {weightValues.length > 0 ? weightValues.slice(-7).map((val, idx) => (
                            <div key={idx} className="flex-1 bg-blue-900/30 rounded-t-sm relative">
                                <div
                                    style={{ height: `${getBarHeight(val, weightValues)}%` }}
                                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm"
                                ></div>
                            </div>
                        )) : <p className="text-[10px] text-gray-600">Registra tu peso</p>}
                    </div>
                </div>

                {/* Efecto decorativo */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all" />
            </div>

            {/* --- 2. MODAL EXPANDIDO (VENTANA GRANDE) --- */}
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:px-4">
                    {/* Overlay Oscuro */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />

                    {/* Caja del Modal */}
                    <div className="relative bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700 shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom duration-300">

                        {/* Cabecera Modal */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Registro de Peso</h2>
                                <p className="text-blue-400 text-sm">Controla tu progreso</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Input Grande */}
                        <form onSubmit={handleSave} className="mb-8">
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    autoFocus
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-700 rounded-2xl py-4 pl-6 pr-16 text-4xl font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-700"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">kg</span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !newWeight}
                                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                                Guardar Registro
                            </button>
                        </form>

                        {/* Gráfica Grande y Detallada */}
                        <div className="bg-black/30 rounded-2xl p-4 border border-gray-800/50">
                            <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-wider">Últimos 7 registros</h4>

                            <div className="h-32 flex items-end gap-3">
                                {history.length > 0 ? history.map((log, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                        {/* Valor flotante al hacer hover */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -mt-8 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity">
                                            {log.weight}
                                        </div>

                                        {/* Barra */}
                                        <div className="w-full bg-blue-900/20 rounded-t-md relative h-full flex items-end overflow-hidden">
                                            <div
                                                style={{ height: `${getBarHeight(log.weight, weightValues)}%` }}
                                                className="w-full bg-blue-500 rounded-t-md hover:bg-blue-400 transition-all cursor-pointer"
                                            />
                                        </div>

                                        {/* Fecha (Día) */}
                                        <span className="text-[10px] text-gray-600 font-mono">
                                            {new Date(log.date).getDate()}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                                        Sin datos suficientes
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}