import React from 'react';
import { Bike, CheckCircle, ChevronRight, Layers } from 'lucide-react'; // Cambié Dumbbell por Bike para diferenciar

export default function SportWidget({ workouts = [] }) {
    const safeWorkouts = Array.isArray(workouts) ? workouts : [];
    const count = safeWorkouts.length;
    const lastWorkout = count > 0 ? safeWorkouts[count - 1] : null;

    if (count === 0) {
        return (
            <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-green-500/60 transition-all group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Bike size={48} />
                </div>
                <div className="flex items-center gap-2 text-green-400 mb-1">
                    <Bike size={18} /> <span className="text-xs font-bold uppercase">Deporte</span>
                </div>
                <div>
                    <span className="text-2xl font-bold text-gray-500">Descanso</span>
                </div>
                <p className="text-[10px] text-gray-600">Sin actividad registrada</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-emerald-900/40 to-gray-900 border border-emerald-500/30 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg cursor-pointer hover:border-emerald-500/60 transition-all group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Bike size={48} />
            </div>

            <div className="z-10 flex justify-between items-start">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Bike size={18} /> <span className="text-xs font-bold uppercase">Deporte</span>
                </div>
                {count > 1 && (
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Layers size={10} /> x{count}
                    </span>
                )}
            </div>

            <div className="z-10">
                <span className="text-lg font-bold text-white line-clamp-2 leading-tight">
                    {lastWorkout.routineName}
                </span>
                <div className="mt-1 flex gap-2">
                    <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                        {lastWorkout.duration} min
                    </span>
                    <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold capitalize">
                        {lastWorkout.intensity}
                    </span>
                </div>
            </div>

            <p className="text-[10px] text-gray-500 z-10 flex justify-between items-center">
                <span>{count > 1 ? 'Ver historial diario' : '¡Gran trabajo!'}</span>
                <ChevronRight size={14} />
            </p>
        </div>
    );
}