import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, CheckCircle, X, ChevronRight, Clock, Trophy, Play } from 'lucide-react';

export default function TrainingWidget({ workout }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // --- CASO 1: NO HAY ENTRENAMIENTO (PENDIENTE) ---
    // AHORA: Se ve idéntico visualmente a los demás widgets (Misma altura, fondo, icono)
    if (!workout) {
        return (
            <div
                onClick={() => navigate('/gym')}
                className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-blue-500/50 transition-all group"
            >
                {/* Icono de Fondo Decorativo */}
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <Dumbbell size={48} />
                </div>

                {/* Cabecera */}
                <div className="flex items-center gap-2 text-gray-400 mb-1 z-10 group-hover:text-blue-400 transition-colors">
                    <Dumbbell size={18} />
                    <span className="text-xs font-bold uppercase">Entrenamiento</span>
                </div>

                {/* Contenido Central */}
                <div className="z-10">
                    <span className="text-3xl font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                        Pendiente
                    </span>
                </div>

                {/* Pie de tarjeta */}
                <div className="z-10 flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase tracking-wide">
                    <span>Tocá para iniciar</span>
                    <ChevronRight size={12} />
                </div>
            </div>
        );
    }

    // --- CASO 2: ENTRENAMIENTO COMPLETADO (TARJETA VERDE) ---
    return (
        <>
            {/* TARJETA PEQUEÑA (HOME) - ESTILO COMPLETADO */}
            <div
                onClick={() => setIsOpen(true)}
                className="col-span-2 bg-gradient-to-br from-green-900/40 to-gray-900 border border-green-500/30 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-green-500/60 transition-all group"
            >
                {/* Icono Fondo */}
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <CheckCircle size={48} />
                </div>

                {/* Cabecera */}
                <div className="z-10 flex items-center gap-2 mb-1">
                    <div className="bg-green-500/20 p-1 rounded-md">
                        <CheckCircle size={14} className="text-green-400" />
                    </div>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Completado</span>
                </div>

                {/* Contenido Central */}
                <div className="z-10">
                    <h3 className="text-2xl font-bold text-white leading-tight line-clamp-1">
                        {workout.routineName}
                    </h3>
                    <p className="text-gray-400 text-xs flex items-center gap-3 mt-1 font-medium">
                        <span className="flex items-center gap-1"><Clock size={12} /> {Math.floor(workout.duration / 60)} min</span>
                        <span className="flex items-center gap-1 text-yellow-500"><Trophy size={12} /> +{workout.earnedXP} XP</span>
                    </p>
                </div>

                {/* Pie (Icono flecha) */}
                <div className="z-10 flex justify-end">
                    <div className="bg-black/30 p-2 rounded-full group-hover:bg-black/50 transition-colors">
                        <ChevronRight size={16} className="text-green-400" />
                    </div>
                </div>
            </div>

            {/* --- MODAL EXPANDIDO (TELETRANSPORTADO) --- */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:px-4">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />

                    {/* Modal */}
                    <div className="relative bg-gray-900 w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 z-10">

                        {/* Header Modal */}
                        <div className="p-6 border-b border-gray-800 bg-gray-950 rounded-t-3xl sticky top-0 z-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{workout.routineName}</h2>
                                <p className="text-green-400 text-sm font-medium mt-1 flex items-center gap-2">
                                    <CheckCircle size={14} /> Finalizado hoy
                                </p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Lista de Ejercicios (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {workout.exercises.map((ex, idx) => (
                                <div key={idx} className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                                    {/* Título Ejercicio */}
                                    <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                                        <h4 className="text-white font-bold">{ex.name}</h4>
                                    </div>

                                    {/* Tabla Fija de Sets */}
                                    <div className="p-3">
                                        <div className="grid grid-cols-3 text-[10px] uppercase text-gray-500 font-bold mb-2 text-center">
                                            <span>Set</span>
                                            <span>Kg</span>
                                            <span>Reps</span>
                                        </div>
                                        <div className="space-y-1">
                                            {ex.sets.filter(s => s.completed).map((set, sIdx) => (
                                                <div key={sIdx} className="grid grid-cols-3 text-sm text-center py-1.5 bg-gray-900 rounded border border-gray-800/50">
                                                    <span className="font-bold text-gray-500">{sIdx + 1}</span>
                                                    <span className="text-white font-bold">{set.weight}</span>
                                                    <span className="text-gray-300">{set.reps}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Footer Resumen */}
                            <div className="flex gap-4 mt-4 text-center">
                                <div className="flex-1 bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Tiempo</p>
                                    <p className="text-xl font-bold text-white">{Math.floor(workout.duration / 60)}<span className="text-sm">m</span></p>
                                </div>
                                <div className="flex-1 bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 uppercase font-bold">XP Ganada</p>
                                    <p className="text-xl font-bold text-blue-400">+{workout.earnedXP}</p>
                                </div>
                                <div className="flex-1 bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Monedas</p>
                                    <p className="text-xl font-bold text-yellow-400">+{workout.earnedCoins}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    );
}