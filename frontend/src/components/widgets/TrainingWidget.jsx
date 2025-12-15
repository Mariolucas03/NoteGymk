import React from 'react';
import { Dumbbell, CheckCircle, ChevronRight, Clock } from 'lucide-react';

export default function TrainingWidget({ workout }) {

    // --- ESTADO 1: NO HAY ENTRENAMIENTO (PENDIENTE) ---
    if (!workout) {
        return (
            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-blue-500/50 transition-all group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <Dumbbell size={48} />
                </div>
                <div className="flex items-center gap-2 text-gray-400 mb-1 z-10 group-hover:text-blue-400 transition-colors">
                    <Dumbbell size={18} />
                    <span className="text-xs font-bold uppercase">Entrenamiento</span>
                </div>
                <div className="z-10">
                    <span className="text-3xl font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                        Pendiente
                    </span>
                </div>
                <div className="z-10 flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase tracking-wide">
                    <span>Tocá para iniciar</span>
                    <ChevronRight size={12} />
                </div>
            </div>
        );
    }

    // --- ESTADO 2: ENTRENAMIENTO COMPLETADO (LIMPIO) ---
    return (
        <div className="col-span-2 bg-gradient-to-br from-green-900/40 to-gray-900 border border-green-500/30 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-green-500/60 transition-all group">

            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <CheckCircle size={48} />
            </div>

            <div className="z-10 flex items-center gap-2 mb-1">
                <div className="bg-green-500/20 p-1 rounded-md">
                    <CheckCircle size={14} className="text-green-400" />
                </div>
                <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Completado</span>
            </div>

            <div className="z-10">
                <h3 className="text-2xl font-bold text-white leading-tight line-clamp-1">
                    {workout.name || workout.routineName}
                </h3>

                {/* AQUI QUITAMOS LA XP Y MONEDAS, SOLO TIEMPO */}
                <p className="text-gray-400 text-xs flex items-center gap-3 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {Math.floor((workout.duration || 0) / 60)} min
                    </span>
                </p>
            </div>

            <div className="z-10 flex justify-end">
                <div className="bg-black/30 p-2 rounded-full group-hover:bg-black/50 transition-colors">
                    <ChevronRight size={16} className="text-green-400" />
                </div>
            </div>
        </div>
    );
}