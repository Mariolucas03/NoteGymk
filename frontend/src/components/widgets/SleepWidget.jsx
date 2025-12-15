import { Moon } from 'lucide-react';

export default function SleepWidget({ hours = 0 }) {
    return (
        // CAMBIO: h-40
        <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Moon size={48} />
            </div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Moon size={18} /> <span className="text-xs font-bold uppercase">Sueño</span>
            </div>
            <div>
                <span className="text-3xl font-bold text-white">{hours}</span>
                <span className="text-sm text-gray-500 font-medium ml-1">h</span>
            </div>
            <p className="text-[10px] text-gray-600">Tiempo descansado</p>
        </div>
    );
}