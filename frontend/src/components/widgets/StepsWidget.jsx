import { Footprints } from 'lucide-react';

export default function StepsWidget({ steps = 0 }) {
    return (
        // CAMBIO: h-40 para igualar altura visual
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-4 flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Footprints size={48} />
            </div>
            <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Footprints size={18} /> <span className="text-xs font-bold uppercase">Pasos</span>
            </div>
            <div>
                <span className="text-3xl font-bold text-white">{steps}</span>
            </div>
            <p className="text-[10px] text-gray-600">Movimiento diario</p>
        </div>
    );
}