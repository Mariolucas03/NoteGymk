import { Flame } from 'lucide-react';

export default function StreakWidget({ streak = 0 }) {
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-900 border border-gray-800 rounded-2xl p-4 h-40 flex flex-col items-center justify-center relative overflow-hidden shadow-lg group hover:border-orange-500/50 transition-all">

            {/* Fondo de Fuego Sutil */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent opacity-50"></div>

            {/* Cabecera */}
            <h3 className="text-orange-500 text-xs font-bold uppercase mb-2 tracking-widest z-10 flex items-center gap-1">
                Racha Fuego
            </h3>

            {/* Número Gigante y Llama */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Icono animado */}
                <div className="relative">
                    <Flame
                        size={40}
                        className={`text-orange-500 fill-orange-500 ${streak > 0 ? 'animate-pulse' : 'grayscale opacity-50'}`}
                    />
                    {/* Brillo extra si hay racha */}
                    {streak > 0 && <div className="absolute inset-0 bg-orange-500 blur-xl opacity-50 animate-pulse"></div>}
                </div>

                <span className="text-4xl font-black text-white mt-2 drop-shadow-lg">
                    {streak}
                </span>

                <p className="text-[10px] text-gray-400 font-medium mt-1">
                    Días seguidos
                </p>
            </div>

            {/* Decoración circular de fondo */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl"></div>

        </div>
    );
}