import React from 'react';
import { Flame, Utensils } from 'lucide-react';

export default function KcalBalanceWidget({ intake = 0, burned = 0 }) {
    // Asegurar números para evitar errores
    const safeIntake = Number(intake) || 0;
    const safeBurned = Number(burned) || 0;
    const net = safeIntake - safeBurned;
    const isSurplus = net > 0;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 flex flex-col justify-between relative shadow-lg group hover:border-gray-700 transition-all cursor-pointer">

            {/* Header */}
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-white transition-colors">
                    <Flame size={12} className={isSurplus ? 'text-orange-500' : 'text-green-500'} /> Balance
                </h3>
            </div>

            {/* Contenido Central */}
            <div className="flex flex-col gap-3 z-10 mt-1">
                {/* Ingesta */}
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-blue-400">
                        <Utensils size={12} /> <span className="font-bold">Ingesta</span>
                    </div>
                    <span className="font-mono text-white">+{Math.round(safeIntake)}</span>
                </div>

                {/* Gasto */}
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-orange-500">
                        <Flame size={12} /> <span className="font-bold">Quema</span>
                    </div>
                    <span className="font-mono text-white">-{Math.round(safeBurned)}</span>
                </div>

                {/* Separador */}
                <div className="h-[1px] bg-gray-800 w-full"></div>

                {/* Neto */}
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Neto</span>
                    <span className={`text-xl font-black ${isSurplus ? 'text-white' : 'text-green-400'}`}>
                        {net > 0 ? '+' : ''}{Math.round(net)}
                    </span>
                </div>
            </div>

            {/* Decoración Fondo */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none ${isSurplus ? 'bg-orange-500' : 'bg-green-500'}`} />
        </div>
    );
}