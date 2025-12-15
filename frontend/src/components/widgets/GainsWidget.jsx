import React from 'react';
import { Trophy, Heart, Zap, Coins } from 'lucide-react';

// Ahora recibe las props GLOBALES del usuario
export default function GainsWidget({ totalCoins = 0, currentXP = 0, nextLevelXP = 100, level = 1, lives = 0 }) {

    // Cálculo seguro del porcentaje de la barra (0% a 100%)
    const progress = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black p-5 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden h-full flex flex-col justify-between group">

            {/* Fondo decorativo (Glow) */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500"></div>

            {/* --- CABECERA SUPERIOR --- */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Trophy size={12} className="text-yellow-500" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Nivel {level}</span>
                    </div>

                    {/* Saldo de Monedas */}
                    <div className="text-white font-black text-3xl flex items-center gap-2 drop-shadow-md">
                        {totalCoins.toLocaleString()}
                        <Coins size={20} className="text-yellow-400 fill-yellow-400/20" />
                    </div>
                </div>

                {/* Contador de Vidas */}
                <div className="flex items-center gap-1.5 bg-red-950/30 px-2.5 py-1.5 rounded-xl border border-red-500/20 shadow-inner backdrop-blur-sm">
                    <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" />
                    <span className="text-red-100 font-bold text-base">{lives}</span>
                </div>
            </div>

            {/* --- BARRA DE EXPERIENCIA --- */}
            <div className="mt-auto relative z-10">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1.5 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Zap size={10} className="text-blue-400" /> XP Actual</span>
                    <span>{currentXP} <span className="text-gray-600">/</span> {nextLevelXP}</span>
                </div>

                <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] relative transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    >
                        {/* Brillo en la punta de la barra */}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[1px]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}