import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, TrendingDown, Dumbbell, BarChart3, X, ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import api from '../../services/api';

export default function WeeklyWidget() {
    const [stats, setStats] = useState({ currentVolume: 0, percentage: 0 });
    const [loading, setLoading] = useState(true);

    // Estados del Modal
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState(null);
    const [graphData, setGraphData] = useState([]);
    const [loadingGraph, setLoadingGraph] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const muscles = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bíceps', 'Tríceps', 'Abdomen'];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/gym/weekly');
                setStats(res.data);
            } catch (error) {
                console.error("Error widget semanal", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        if (!selectedMuscle) return;
        const fetchGraph = async () => {
            setLoadingGraph(true);
            setHoveredPoint(null);
            try {
                const res = await api.get(`/gym/muscle-progress?muscle=${selectedMuscle}`);
                setGraphData(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingGraph(false);
            }
        };
        fetchGraph();
    }, [selectedMuscle]);

    // --- CAMBIO AQUÍ: Formato de número completo (30.800) ---
    const formatVolume = (num) => {
        // Usa el formato de local (ej: español pone puntos de miles)
        return num.toLocaleString('es-ES');
    };

    const isPositive = stats.percentage >= 0;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    // --- GRÁFICA SVG ---
    const renderChart = () => {
        if (loadingGraph) return <div className="h-48 flex items-center justify-center text-blue-400 animate-pulse"><Activity /></div>;
        if (graphData.length < 2) return <div className="h-48 flex flex-col items-center justify-center text-gray-500 text-xs text-center p-4"><BarChart3 size={32} className="mb-2 opacity-50" /><p>Necesitas al menos 2 sesiones de {selectedMuscle} para ver la tendencia.</p></div>;

        const width = 300;
        const height = 150;
        const padding = 15;

        const values = graphData.map(d => d.volume);
        const min = Math.min(...values) * 0.8;
        const max = Math.max(...values) * 1.1;
        const range = max - min || 1;

        const points = graphData.map((d, i) => {
            const x = padding + (i / (graphData.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.volume - min) / range) * (height - 2 * padding);
            return { x, y, val: d.volume, date: d.date, idx: i };
        });

        const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaPath = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

        return (
            <div className="relative w-full h-56 select-none bg-black/20 rounded-xl border border-gray-800 p-2 touch-none">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#374151" strokeWidth="1" strokeDasharray="4" />
                    <path d={areaPath} fill="url(#chartGradient)" stroke="none" />
                    <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#1e1b4b" stroke="#fff" strokeWidth="2" />
                            <circle
                                cx={p.x} cy={p.y} r="20" fill="transparent"
                                onTouchStart={() => setHoveredPoint(p)}
                                onMouseEnter={() => setHoveredPoint(p)}
                                className="cursor-pointer"
                            />
                        </g>
                    ))}
                </svg>
                {hoveredPoint && (
                    <div
                        className="absolute bg-gray-900 border border-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-50 flex flex-col items-center min-w-[80px]"
                        style={{
                            top: '5%',
                            left: hoveredPoint.idx === 0 ? '10%' : hoveredPoint.idx === points.length - 1 ? 'auto' : `${(hoveredPoint.x / width) * 100}%`,
                            right: hoveredPoint.idx === points.length - 1 ? '5%' : 'auto',
                            transform: hoveredPoint.idx === 0 || hoveredPoint.idx === points.length - 1 ? 'none' : 'translateX(-50%)'
                        }}
                    >
                        <span className="text-purple-300 text-sm">{formatVolume(hoveredPoint.val)} Kg</span>
                        <span className="text-[10px] text-gray-400 font-mono">{formatDate(hoveredPoint.date)}</span>
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-b border-r border-purple-500 transform rotate-45"></div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* WIDGET HOME (ANCHO COMPLETO) */}
            <div
                onClick={() => setIsOpen(true)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 min-h-[160px] flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer pointer-events-auto"
            >
                {/* Icono Fondo */}
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <BarChart3 size={64} />
                </div>

                <div className="flex flex-col h-40 justify-between z-10 relative">
                    {/* Título Arriba */}
                    <div className="flex justify-between items-start">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                            <Dumbbell size={12} /> Volumen Semanal
                        </h3>
                    </div>

                    {/* Contenido Abajo (Fila Horizontal) */}
                    <div className="flex items-end justify-between mt-2">
                        {loading ? (
                            <span className="text-xs text-gray-600 animate-pulse">Calculando...</span>
                        ) : (
                            <>
                                {/* Izquierda: El número grande */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Movido</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white tracking-tighter">
                                            {formatVolume(stats.currentVolume)}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500 uppercase">Kg</span>
                                    </div>
                                </div>

                                {/* Derecha: El porcentaje */}
                                <div className="flex flex-col items-end">
                                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold ${isPositive ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        <span>{isPositive ? '+' : ''}{stats.percentage}%</span>
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-1 text-right">vs. semana pasada</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700 shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom duration-300 z-10 max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                {selectedMuscle ? (
                                    <button onClick={() => setSelectedMuscle(null)} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold">
                                        <ChevronLeft size={16} /> Volver
                                    </button>
                                ) : (
                                    <h2 className="text-xl font-bold text-white">Progreso por Músculo</h2>
                                )}
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar">
                            {!selectedMuscle ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {muscles.map(muscle => (
                                        <button
                                            key={muscle}
                                            onClick={() => setSelectedMuscle(muscle)}
                                            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl flex justify-between items-center group transition-all active:scale-95"
                                        >
                                            <span className="font-bold text-gray-200">{muscle}</span>
                                            <ChevronRight size={16} className="text-gray-500 group-hover:text-purple-400" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <h2 className="text-3xl font-black text-white uppercase italic">{selectedMuscle}</h2>
                                        <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Historial Volumen</span>
                                    </div>

                                    {renderChart()}

                                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mt-4">
                                        <p className="text-xs text-blue-200 leading-relaxed">
                                            <strong className="block mb-1 text-blue-400">📈 Sobre el Volumen:</strong>
                                            Esta gráfica suma (Series x Reps x Peso). Si la línea sube, tu capacidad de trabajo está aumentando.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}