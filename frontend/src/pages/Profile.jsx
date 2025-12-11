import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Moon, Scale, Smile, Utensils, Flame, Wheat, Droplet, Leaf, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
    // Estado del Calendario
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Datos del día seleccionado
    const [dayData, setDayData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- LÓGICA CALENDARIO ---
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Ajuste Lunes = 0

    const handlePrevMonth = () => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const formatDateStr = (date) => date.toISOString().split('T')[0];

    // Sincronizar mes visible con la fecha seleccionada
    useEffect(() => {
        setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        fetchDayData();
    }, [selectedDate]);

    // --- FETCH DATOS ---
    const fetchDayData = async () => {
        setLoading(true);
        try {
            const dateStr = formatDateStr(selectedDate);
            const res = await api.get(`/daily/specific?date=${dateStr}`);
            setDayData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERIZADO WIDGETS ---
    const renderWidget = (title, icon, content, colorClass) => (
        <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between min-h-[120px] ${content ? '' : 'opacity-50'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase">{title}</span>
                <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-20 text-white`}>
                    {icon}
                </div>
            </div>
            {content ? (
                <div>{content}</div>
            ) : (
                <p className="text-gray-600 text-xs italic">Sin registros</p>
            )}
        </div>
    );

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in">

            {/* 1. CALENDARIO */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-8 shadow-xl">
                {/* Header Calendario */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><ChevronLeft /></button>
                    <h2 className="text-xl font-bold text-white capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><ChevronRight /></button>
                </div>

                {/* Días Semana */}
                <div className="grid grid-cols-7 text-center mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <span key={d} className="text-xs font-bold text-gray-500">{d}</span>
                    ))}
                </div>

                {/* Grid Días */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isSelected = formatDateStr(date) === formatDateStr(selectedDate);
                        const isToday = formatDateStr(date) === formatDateStr(new Date());

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(date)}
                                className={`
                              h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all mx-auto
                              ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-110' : 'text-gray-300 hover:bg-gray-800'}
                              ${isToday && !isSelected ? 'border border-blue-500 text-blue-400' : ''}
                          `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. RESUMEN DEL DÍA (WIDGETS) */}
            <div className="mb-4">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" />
                    Historial: {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Cargando datos...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">

                        {/* ENTRENAMIENTO */}
                        {dayData?.workout ? (
                            <div className="col-span-2 bg-gradient-to-br from-green-900/40 to-gray-900 border border-green-500/30 rounded-2xl p-5 flex items-center gap-4">
                                <div className="bg-green-500/20 p-3 rounded-full text-green-400"><Dumbbell size={24} /></div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">{dayData.workout.routineName}</h4>
                                    <p className="text-green-400 text-xs font-bold">Completado</p>
                                </div>
                            </div>
                        ) : (
                            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 opacity-50">
                                <div className="bg-gray-800 p-3 rounded-full text-gray-500"><Dumbbell size={24} /></div>
                                <p className="text-gray-500 font-bold">Sin entrenamiento</p>
                            </div>
                        )}

                        {/* NUTRICIÓN */}
                        {renderWidget('Nutrición', <Utensils size={16} />,
                            dayData?.nutrition ? (
                                <>
                                    <p className="text-2xl font-bold text-white">{dayData.nutrition.totalCalories} <span className="text-xs text-gray-500">kcal</span></p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-400">
                                        <span>P: {dayData.nutrition.totalProtein}</span>
                                        <span>C: {dayData.nutrition.totalCarbs}</span>
                                        <span>F: {dayData.nutrition.totalFat}</span>
                                        <span>FIBRA: {dayData.nutrition.totalFiber}</span>
                                    </div>
                                </>
                            ) : null,
                            'bg-orange-500'
                        )}

                        {/* PESO */}
                        {renderWidget('Peso Corporal', <Scale size={16} />,
                            dayData?.daily?.weight ? (
                                <p className="text-2xl font-bold text-white">{dayData.daily.weight} <span className="text-sm text-gray-500">kg</span></p>
                            ) : null,
                            'bg-purple-500'
                        )}

                        {/* SUEÑO */}
                        {renderWidget('Sueño', <Moon size={16} />,
                            dayData?.daily?.sleepHours ? (
                                <p className="text-2xl font-bold text-white">{dayData.daily.sleepHours} <span className="text-sm text-gray-500">h</span></p>
                            ) : null,
                            'bg-indigo-500'
                        )}

                        {/* ESTADO DE ÁNIMO */}
                        {renderWidget('Ánimo', <Smile size={16} />,
                            dayData?.daily?.mood ? (
                                <div className="text-center">
                                    <span className="text-3xl">{
                                        dayData.daily.mood === 'happy' ? '😄' :
                                            dayData.daily.mood === 'neutral' ? '😐' :
                                                dayData.daily.mood === 'sad' ? '😔' : '⚡'
                                    }</span>
                                    <p className="text-xs text-gray-400 mt-1 capitalize">{dayData.daily.mood}</p>
                                </div>
                            ) : null,
                            'bg-yellow-500'
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}