import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scale, X, Save, TrendingUp } from 'lucide-react';
import api from '../../services/api'; // Asegúrate que la ruta sea correcta

export default function WeightWidget({ initialWeight, onUpdate }) {
    const [weight, setWeight] = useState(initialWeight || 0);
    const [history, setHistory] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [loading, setLoading] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // 1. Sincronizar con props si cambian desde fuera
    useEffect(() => {
        if (initialWeight > 0) setWeight(initialWeight);
    }, [initialWeight]);

    // 2. Cargar historial al montar o al abrir el modal
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/daily/history');
            const validHistory = Array.isArray(res.data)
                ? res.data.filter(log => log.weight > 0)
                : [];

            // Ordenamos por fecha (antiguo -> nuevo)
            validHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
            setHistory(validHistory);
        } catch (error) {
            console.error("Error historial peso", error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!newWeight) return;
        setLoading(true);
        try {
            const val = parseFloat(newWeight);
            // 1. Guardar en Backend
            await api.put('/daily', { type: 'weight', value: val }); // Usamos la misma ruta que los otros widgets si es posible, o tu ruta específica

            // 2. Actualizar estado local
            setWeight(val);

            // 3. Notificar al padre (Home) para que actualice su estado global
            if (onUpdate) onUpdate(val);

            // 4. Refrescar historial y cerrar
            await fetchHistory();
            setIsOpen(false);
            setNewWeight('');
        } catch (error) {
            console.error("Error guardando peso", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA GRÁFICO (Tu código intacto) ---
    const renderLineChart = () => {
        if (history.length < 2) {
            return (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                    {history.length === 1 ? "Necesitas al menos 2 registros" : "Sin datos suficientes"}
                </div>
            );
        }

        const data = history.slice(-7);
        const width = 100;
        const height = 100;
        const padding = 10;

        const weights = data.map(d => d.weight);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        const range = maxW - minW || 1;

        const points = data.map((d, index) => {
            const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = height - padding - ((d.weight - minW) / range) * (height - 2 * padding);
            return { x, y, value: d.weight, date: d.date };
        });

        const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

        return (
            <div className="relative w-full h-40">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points={pointsString}
                        vectorEffect="non-scaling-stroke"
                    />
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x} cy={p.y} r="3"
                                fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5"
                                className="transition-all duration-300 hover:r-5 cursor-pointer"
                                onMouseEnter={() => setHoveredPoint({ ...p, index: i })}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                            <circle cx={p.x} cy={p.y} r="8" fill="transparent"
                                onMouseEnter={() => setHoveredPoint({ ...p, index: i })}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="cursor-pointer"
                            />
                        </g>
                    ))}
                </svg>
                {hoveredPoint && (
                    <div
                        className="absolute bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                        style={{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y}%`, marginTop: '-10px' }}
                    >
                        {hoveredPoint.value} kg
                        <br />
                        <span className="text-[8px] font-normal opacity-80">
                            {new Date(hoveredPoint.date).getDate()}/{new Date(hoveredPoint.date).getMonth() + 1}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* WIDGET PRINCIPAL */}
            <div
                onClick={() => setIsOpen(true)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-full flex flex-col justify-between relative shadow-lg group hover:border-blue-500/50 transition-all cursor-pointer"
            >
                <div className="flex justify-between items-start z-10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                        <Scale size={12} /> Peso
                    </h3>
                    <TrendingUp size={14} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="flex flex-col items-center justify-center flex-1 z-10 mt-2">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {weight > 0 ? weight : '--'}
                        </span>
                        <span className="text-sm font-bold text-gray-500 uppercase">kg</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                        {history.length > 0 ? "Actualizado" : "Toca para registrar"}
                    </p>
                </div>

                {/* Decoración Fondo */}
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all" />
            </div>

            {/* MODAL (PORTAL) */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700 shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom duration-300 z-10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Registro de Peso</h2>
                                <p className="text-blue-400 text-sm">Controla tu progreso</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="mb-6">
                            <div className="relative">
                                <input
                                    type="number" step="0.1"
                                    placeholder={weight > 0 ? weight.toString() : "0.0"}
                                    autoFocus
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-700 rounded-2xl py-4 pl-6 pr-16 text-4xl font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">kg</span>
                            </div>
                            <button type="submit" disabled={loading || !newWeight} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                                Guardar Registro
                            </button>
                        </form>

                        <div className="bg-black/30 rounded-2xl p-4 border border-gray-800/50">
                            <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-wider">Progreso Reciente</h4>
                            {renderLineChart()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}