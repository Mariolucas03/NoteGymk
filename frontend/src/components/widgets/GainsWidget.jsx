import { Coins, Sparkles, Heart } from 'lucide-react';

export default function GainsWidget({ dailyCoins = 0, dailyXP = 0, dailyLives = 0 }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 flex flex-col justify-between shadow-lg relative overflow-hidden hover:border-yellow-500/30 transition-all">

            {/* Título */}
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider z-10">
                Ganancias Hoy
            </h3>

            {/* Lista de Ganancias */}
            <div className="flex flex-col gap-2 z-10 mt-1">

                {/* Monedas */}
                <div className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-900/30 p-1 rounded-md text-yellow-400">
                            <Coins size={14} />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium uppercase">Monedas</span>
                    </div>
                    <span className="text-xs font-bold text-white">+{dailyCoins}</span>
                </div>

                {/* XP */}
                <div className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-900/30 p-1 rounded-md text-blue-400">
                            <Sparkles size={14} />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium uppercase">XP</span>
                    </div>
                    <span className="text-xs font-bold text-white">+{dailyXP}</span>
                </div>

                {/* VIDAS (Nuevo) */}
                <div className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-900/30 p-1 rounded-md text-red-400">
                            <Heart size={14} />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium uppercase">Vidas</span>
                    </div>
                    <span className="text-xs font-bold text-white">+{dailyLives}</span>
                </div>

            </div>

            {/* Brillo decorativo */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>
        </div>
    );
}