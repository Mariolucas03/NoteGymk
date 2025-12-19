import React from 'react';
import { Trophy, CheckCircle, ChevronRight, Target } from 'lucide-react';

export default function MissionsWidget({ completed = 0, total = 0 }) {

    // LÓGICA ANTI-BUG:
    // 1. Si no hay total (0), evitamos dividir por cero.
    // 2. Si completed > total (porque borraste una pero ya la habías hecho), 
    //    ajustamos visualmente para que no se rompa la barra.
    const safeTotal = total === 0 ? 1 : total;
    const visualPercent = Math.min((completed / safeTotal) * 100, 100);
    const isAllDone = completed >= total && total > 0;

    return (
        <div className="col-span-2 bg-gradient-to-r from-blue-900/40 to-gray-900 border border-blue-500/30 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden h-40 flex flex-col justify-between group">

            {/* Fondo Decorativo */}
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Trophy size={48} />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-blue-400">
                    <Target size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Objetivos</span>
                </div>
                {/* Contador */}
                <div className={`text-xs font-black px-2 py-1 rounded-lg z-10 ${isAllDone ? 'bg-green-500/20 text-green-400' : 'bg-blue-600/20 text-blue-300'}`}>
                    {completed} <span className="text-gray-500">/</span> {total}
                </div>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full z-10">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
                    <span>Progreso Diario</span>
                    <span>{Math.round(visualPercent)}%</span>
                </div>
                <div className="relative w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                    <div
                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isAllDone ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`}
                        style={{ width: `${visualPercent}%` }}
                    ></div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 z-10">
                <p className="font-medium">
                    {total === 0 ? "No hay misiones activas" :
                        isAllDone ? "¡Todo completado! 🎉" : "Sigue cumpliendo hábitos"}
                </p>
                <div className="bg-black/30 p-1.5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ChevronRight size={14} />
                </div>
            </div>
        </div>
    );
}