import React from 'react';
import { Trophy, CheckCircle, ChevronRight } from 'lucide-react';

export default function MissionsWidget({ completed = 0, total = 2 }) {

    // Cálculo seguro
    const percent = total > 0 ? (completed / total) * 100 : 0;
    const isCompleted = total > 0 && completed >= total;

    return (
        <div className="col-span-2 bg-gradient-to-r from-blue-900/40 to-gray-900 border border-blue-500/30 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden h-40 flex flex-col justify-between group">

            {/* Fondo */}
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Trophy size={48} />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-blue-400">
                    <CheckCircle size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Misiones Diarias</span>
                </div>
                <div className="bg-blue-600/20 text-blue-300 text-xs font-bold px-2 py-1 rounded-lg z-10">
                    {completed}/{total}
                </div>
            </div>

            {/* Barra */}
            <div className="w-full z-10">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
                    <span>Progreso</span>
                    <span>{Math.round(percent)}%</span>
                </div>
                <div className="relative w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 z-10">
                <p>{percent >= 100 ? "¡Objetivo diario cumplido! 🎉" : "Completa tus hábitos"}</p>
                <ChevronRight size={14} className="text-gray-600" />
            </div>
        </div>
    );
}