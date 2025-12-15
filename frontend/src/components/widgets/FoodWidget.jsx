import { Utensils } from 'lucide-react';

export default function FoodWidget({ currentKcal = 0, limitKcal = 2100 }) {
    // Cálculos visuales para el círculo
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min((currentKcal / limitKcal) * 100, 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isOverLimit = currentKcal > limitKcal;
    const strokeColor = isOverLimit ? "#ef4444" : "#3b82f6";

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-full min-h-[160px] flex flex-col justify-between relative shadow-lg group hover:border-blue-500/50 transition-all">
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                    <Utensils size={12} /> Dieta
                </h3>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Fondo */}
                    <svg className="transform -rotate-90 w-full h-full">
                        <circle cx="50%" cy="50%" r={radius} stroke="#1f2937" strokeWidth="8" fill="transparent" />
                        {/* Progreso */}
                        <circle
                            cx="50%" cy="50%" r={radius}
                            stroke={strokeColor} strokeWidth="8" fill="transparent"
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round" className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-sm font-bold ${isOverLimit ? 'text-red-400' : 'text-white'}`}>{currentKcal}</span>
                        <div className="h-[1px] w-6 bg-gray-700 my-0.5"></div>
                        <span className="text-[10px] text-gray-500 font-mono">{limitKcal}</span>
                    </div>
                </div>
            </div>

            <div className="z-10 text-center mt-auto">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kcal Hoy</span>
            </div>
        </div>
    );
}