import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Search, Maximize2 } from 'lucide-react';
import api from '../../services/api';

export default function ProfileStats({ mini = false, onClick }) {
    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Carga ligera inicial
        const fetchExercises = async () => {
            try {
                const res = await api.get('/gym/exercises?muscle=Todos');
                setExercises(res.data);
                if (res.data.length > 0) setSelectedExercise(res.data[0].name);
            } catch (error) { console.error("Error cargando ejercicios", error); }
        };
        fetchExercises();
    }, []);

    useEffect(() => {
        // Solo cargar datos pesados si NO es mini o si se necesita
        if (!selectedExercise || mini) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/gym/exercise-history?exerciseName=${selectedExercise}`);
                setChartData(res.data);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [selectedExercise, mini]);

    // --- MODO MINI (WIDGET) ---
    if (mini) {
        return (
            <div onClick={onClick} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 relative overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={48} />
                </div>

                <div className="flex justify-between items-start z-10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                        <TrendingUp size={12} /> Fuerza
                    </h3>
                    <Maximize2 size={12} className="text-gray-600 group-hover:text-purple-400" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center z-10">
                    <span className="text-3xl font-black text-white">1RM</span>
                    <span className="text-[10px] text-gray-500">Historial de récords</span>
                </div>

                <p className="text-[10px] text-gray-500 z-10 text-center">Toca para ver gráficas</p>
            </div>
        );
    }

    // --- MODO COMPLETO ---
    return (
        <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-purple-500" size={24} />
                        Progreso de Fuerza
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">Evolución de tu 1RM estimado</p>
                </div>

                {/* SELECTOR DE EJERCICIO */}
                <div className="relative w-full sm:w-64">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Search size={14} /></div>
                    <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} className="w-full bg-gray-800 text-white text-sm rounded-xl py-2 pl-9 pr-4 border border-gray-700 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
                        {exercises.map(ex => <option key={ex._id} value={ex.name}>{ex.name}</option>)}
                    </select>
                </div>
            </div>

            {/* GRÁFICA */}
            <div className="h-64 w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-600 animate-pulse"><Activity size={24} className="mr-2" /> Cargando...</div>
                ) : chartData.length < 2 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-800 rounded-xl">
                        <p>Faltan datos para {selectedExercise}</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 10 }} tickMargin={10} />
                            <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} unit="kg" />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }} labelStyle={{ color: '#9ca3af', marginBottom: '5px' }} />
                            <Area type="monotone" dataKey="pr" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPr)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ESTADÍSTICAS RÁPIDAS */}
            {chartData.length >= 2 && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-800">
                    <div className="text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Inicio</p><p className="text-lg font-bold text-gray-400">{chartData[0].pr} kg</p></div>
                    <div className="text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Actual</p><p className="text-xl font-black text-white">{chartData[chartData.length - 1].pr} kg</p></div>
                    <div className="text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Mejora</p><p className={`text-lg font-bold ${chartData[chartData.length - 1].pr >= chartData[0].pr ? 'text-green-400' : 'text-red-400'}`}>{chartData[chartData.length - 1].pr - chartData[0].pr > 0 ? '+' : ''}{chartData[chartData.length - 1].pr - chartData[0].pr} kg</p></div>
                </div>
            )}
        </div>
    );
}