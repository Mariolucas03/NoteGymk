import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scale, X, Save, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export default function WeightWidget({ initialWeight, onUpdate }) {
    const [weight, setWeight] = useState(initialWeight || 0);
    const [history, setHistory] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [loading, setLoading] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // 1. Sincronizar con props si cambian desde fuera (Home)
    useEffect(() => {
        if (initialWeight > 0) setWeight(initialWeight);
    }, [initialWeight]);

    // 2. Cargar historial SOLO al abrir el modal (Optimización)
    useEffect(() => {
        if (isOpen) fetchHistory();
    }, [isOpen]);

    const fetchHistory = async () => {
        try {
            // ✅ AHORA SÍ EXISTE ESTA RUTA EN EL BACKEND
            const res = await api.get('/daily/history');
            setHistory(res.data);
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
            // 1. Guardar en Backend (Log de hoy)
            await api.put('/daily', { type: 'weight', value: val });

            // 2. Actualizar estado local
            setWeight(val);

            // 3. Notificar al padre (Home) para que actualice su estado global
            if (onUpdate) onUpdate(val);

            // 4. Refrescar historial para ver el nuevo punto en la gráfica
            await fetchHistory();

            // Limpiar input (No cerramos modal para que veas el cambio)
            setNewWeight('');
        } catch (error) {
            console.error("Error guardando peso", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Formato DD/MM
    const formatDateLabel = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}`;
    };

    // --- GRÁFICA SVG PERSONALIZADA ---
    const renderLineChart = () => {
        if (!history || history.length < 2) {
            return (
                <div className="h-40 flex flex-col items-center justify-center text-gray-500 text-xs italic border border-gray-800 rounded-xl bg-black/20">
                    <p>Registra tu peso hoy y mañana</p>
                    <p>para ver tu progreso.</p>
                </div>
            );
        }

        // Usamos los últimos 7 registros
        const data = history.slice(-7);

        const width = 300;
        const height = 150;
        const padding = 20;

        const weights = data.map(d => d.weight);
        let minW = Math.min(...weights);
        let maxW = Math.max(...weights);

        // Evitar división por cero si el peso es constante
        if (minW === maxW) {
            minW -= 1;
            maxW += 1;
        } else {
            // Margen visual
            minW -= 0.5;
            maxW += 0.5;
        }

        const range = maxW - minW;

        const points = data.map((d, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.weight - minW) / range) * (height - 2 * padding);
            return { x, y, value: d.weight, date: d.date };
        });

        const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

        return (
            <div className="relative w-full h-48 select-none">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Líneas Guía */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#374151" strokeWidth="1" strokeDasharray="4" />

                    {/* La Línea del Gráfico */}
                    <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        points={pointsString}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Puntos Interactivos */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x} cy={p.y} r="4"
                                fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2"
                                className="transition-all duration-300"
                            />
                            {/* Área de Hover invisible más grande */}
                            <circle
                                cx={p.x} cy={p.y} r="15" fill="transparent"
                                onMouseEnter={() => setHoveredPoint({ ...p, index: i })}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="cursor-pointer"
                            />
                        </g>
                    ))}
                </svg>

                {/* Tooltip (Etiqueta Flotante) */}
                {hoveredPoint && (
                    <div
                        className="absolute bg-gray-800 border border-gray-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full z-50 flex flex-col items-center min-w-[80px]"
                        style={{
                            left: `${(hoveredPoint.index / (data.length - 1)) * 100}%`,
                            top: '10%'
                        }}
                    >
                        <span className="text-blue-400 text-lg">{hoveredPoint.value} kg</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {formatDateLabel(hoveredPoint.date)}
                        </span>
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-700"></div>
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
                        {weight > 0 ? "Actualizado" : "Toca para registrar"}
                    </p>
                </div>

                {/* Decoración Fondo */}
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all" />
            </div>

            {/* MODAL (PORTAL) */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700 shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom duration-300 z-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Control de Peso</h2>
                                <p className="text-blue-400 text-sm">Tu progreso físico</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="mb-8">
                            <div className="relative">
                                <input
                                    type="number" step="0.1"
                                    placeholder={weight > 0 ? weight.toString() : "0.0"}
                                    autoFocus
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-700 rounded-2xl py-4 pl-6 pr-16 text-4xl font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">kg</span>
                            </div>
                            <button type="submit" disabled={loading || !newWeight} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                                Guardar Peso de Hoy
                            </button>
                        </form>

                        <div className="bg-black/30 rounded-2xl p-4 border border-gray-800/50">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Últimos 7 registros</h4>
                                {history.length > 0 && (
                                    <span className={`text-xs font-bold ${history[history.length - 1]?.weight < history[0]?.weight ? 'text-green-400' : 'text-gray-400'}`}>
                                        {history.length > 1 ? `${(history[history.length - 1].weight - history[0].weight).toFixed(1)} kg total` : ''}
                                    </span>
                                )}
                            </div>
                            {renderLineChart()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}