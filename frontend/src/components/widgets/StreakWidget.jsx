import { Flame, CalendarDays, Trophy } from 'lucide-react';

export default function StreakWidget({ streak = 1 }) {
    // Aseguramos que nunca sea undefined
    const currentStreak = streak || 1;

    // Lógica visual: Fuego cambia de color/intensidad según la racha
    const isEpic = currentStreak >= 30; // Fuego azul/morado
    const isOnFire = currentStreak >= 7; // Fuego naranja intenso
    const isWarmingUp = currentStreak >= 3; // Fuego amarillo

    // Colores dinámicos
    let fireColor = "text-gray-600";
    let glowColor = "";
    let borderColor = "border-gray-800";

    if (isEpic) {
        fireColor = "text-purple-500 animate-pulse";
        glowColor = "shadow-purple-900/40 border-purple-500/50";
        borderColor = "border-purple-500/50";
    } else if (isOnFire) {
        fireColor = "text-orange-500 animate-pulse";
        glowColor = "shadow-orange-900/40 border-orange-500/50";
        borderColor = "border-orange-500/50";
    } else if (isWarmingUp) {
        fireColor = "text-yellow-500";
        glowColor = "shadow-yellow-900/20";
        borderColor = "border-yellow-500/30";
    }

    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 h-40 flex flex-col justify-between group shadow-lg transition-all duration-500 bg-gray-900 border ${borderColor} ${glowColor}`}>

            {/* Header */}
            <div className="flex justify-between items-start z-10">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${isOnFire ? 'text-white' : 'text-gray-400'}`}>
                    <Flame size={14} className={fireColor} fill="currentColor" />
                    {isEpic ? "LEYENDA" : isOnFire ? "ON FIRE" : "RACHA"}
                </h3>
                {isEpic && <Trophy size={16} className="text-yellow-400" />}
            </div>

            {/* Número Gigante */}
            <div className="z-10 flex items-baseline gap-1 mt-2">
                <span className={`text-6xl font-black tracking-tighter transition-all duration-300 ${isEpic ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600' : 'text-white'}`}>
                    {currentStreak}
                </span>
                <span className="text-sm font-bold text-gray-500 uppercase">Días</span>
            </div>

            {/* Mensaje Motivacional */}
            <div className="z-10 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                <p className="text-[10px] text-gray-300 font-medium flex items-center gap-2">
                    <CalendarDays size={12} className="text-gray-500" />
                    {currentStreak === 1 ? "¡El primer paso cuenta!" :
                        currentStreak < 7 ? "¡Sigue así, vas genial!" :
                            currentStreak < 30 ? "¡Eres imparable!" :
                                "¡Nivel Dios alcanzado!"}
                </p>
            </div>

            {/* --- EFECTOS DE FONDO --- */}

            {/* Fuego Gigante de Fondo */}
            <div className={`absolute -right-4 -bottom-6 transition-all duration-700 group-hover:scale-110 opacity-10 pointer-events-none`}>
                <Flame size={110} className={isEpic ? 'text-purple-600' : isOnFire ? 'text-orange-600' : 'text-gray-500'} fill="currentColor" />
            </div>

            {/* Partículas (Brillo) */}
            {isOnFire && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
            )}
        </div>
    );
}