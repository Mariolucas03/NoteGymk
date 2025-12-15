import { Flame } from 'lucide-react';

export default function StreakWidget({ streak = 0 }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-full flex flex-col justify-between relative shadow-lg group hover:border-orange-500/50 transition-all overflow-hidden">

            {/* Encabezado */}
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-orange-400 transition-colors">
                    <Flame size={14} className={streak > 0 ? "text-orange-500 fill-orange-500" : "text-gray-500"} />
                    Racha
                </h3>
            </div>

            {/* Número Central */}
            <div className="flex flex-col items-center justify-center flex-1 z-10 mt-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tighter">
                        {streak}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Días</span>
                </div>

                {/* Mensaje motivacional pequeño */}
                <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    {streak > 0 ? "¡Sigue así!" : "¡Empieza hoy!"}
                </p>
            </div>

            {/* Decoración de fondo (Fuego sutil) */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-600/10 rounded-full blur-2xl group-hover:bg-orange-600/20 transition-all pointer-events-none" />

            {/* Decoración extra si hay racha alta */}
            {streak > 3 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/5 blur-3xl pointer-events-none" />
            )}
        </div>
    );
}