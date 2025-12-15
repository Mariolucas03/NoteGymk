import { Coins, Zap, Heart, TrendingUp } from 'lucide-react';

export default function GainsWidget({ dailyCoins = 0, dailyXP = 0, dailyLives = 0 }) {
    return (
        <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-4 h-40 relative overflow-hidden flex flex-col justify-between shadow-lg group">

            {/* Header */}
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-yellow-400 transition-colors">
                    <TrendingUp size={12} /> Ganancias Hoy
                </h3>
                <div className="bg-yellow-500/10 p-1 rounded-md">
                    <Coins size={14} className="text-yellow-500" />
                </div>
            </div>

            {/* Lista de Ganancias */}
            <div className="space-y-3 z-10 mt-2">

                {/* Monedas */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-500/20 p-1 rounded-full">
                            <Coins size={12} className="text-yellow-500" />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">Monedas</span>
                    </div>
                    <span className={`text-sm font-bold ${dailyCoins > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                        +{dailyCoins}
                    </span>
                </div>

                {/* XP */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/20 p-1 rounded-full">
                            <Zap size={12} className="text-blue-500" />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">XP</span>
                    </div>
                    <span className={`text-sm font-bold ${dailyXP > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                        +{dailyXP}
                    </span>
                </div>

                {/* Vidas (Opcional, si no se ganan vidas a diario se queda en gris) */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-500/20 p-1 rounded-full">
                            <Heart size={12} className="text-red-500" />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">Vidas</span>
                    </div>
                    <span className={`text-sm font-bold ${dailyLives > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                        +{dailyLives}
                    </span>
                </div>

            </div>

            {/* Fondo Decorativo */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all pointer-events-none" />
        </div>
    );
}