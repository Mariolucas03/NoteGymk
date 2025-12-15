import { Dumbbell } from 'lucide-react';

export default function SportWidget({ workout }) {
    return (
        // CAMBIO: h-40
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-4 flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Dumbbell size={48} />
            </div>
            <div className="flex items-center gap-2 text-green-400 mb-1">
                <Dumbbell size={18} /> <span className="text-xs font-bold uppercase">Deporte</span>
            </div>

            {workout ? (
                <div>
                    <span className="text-lg font-bold text-white line-clamp-2 leading-tight">
                        {workout.routineName || "Entrenamiento"}
                    </span>
                    <div className="mt-1">
                        <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold">
                            COMPLETADO
                        </span>
                    </div>
                </div>
            ) : (
                <div>
                    <span className="text-2xl font-bold text-gray-500">Descanso</span>
                </div>
            )}

            <p className="text-[10px] text-gray-600">
                {workout ? "¡Gran trabajo hoy!" : "Sin actividad registrada"}
            </p>
        </div>
    );
}