import { useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';

export default function FoodWidget({ currentKcal = 0, limitKcal = 2100 }) {
    const navigate = useNavigate();

    // Cálculos para el Círculo SVG
    const radius = 35; // Radio del círculo
    const circumference = 2 * Math.PI * radius; // Perímetro total
    // Limitamos el porcentaje a 100% para que no se rompa el dibujo si te pasas comiendo
    const percentage = Math.min((currentKcal / limitKcal) * 100, 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Color dinámico: Azul si vas bien, Rojo si te pasas
    const isOverLimit = currentKcal > limitKcal;
    const strokeColor = isOverLimit ? "#ef4444" : "#3b82f6"; // Red-500 vs Blue-500

    return (
        <div
            onClick={() => navigate('/food')}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 flex flex-col justify-between relative shadow-lg cursor-pointer group hover:border-blue-500/50 transition-all"
        >

            {/* Título e Icono */}
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                    <Utensils size={12} /> Dieta
                </h3>
            </div>

            {/* GRÁFICO CIRCULAR CENTRADO */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-24 h-24 flex items-center justify-center">

                    {/* SVG Ring */}
                    <svg className="transform -rotate-90 w-full h-full">
                        {/* Fondo del círculo (Gris oscuro) */}
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke="#1f2937" // gray-800
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Barra de Progreso (Azul/Rojo) */}
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke={strokeColor}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>

                    {/* Texto Central */}
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-sm font-bold ${isOverLimit ? 'text-red-400' : 'text-white'}`}>
                            {currentKcal}
                        </span>
                        <div className="h-[1px] w-6 bg-gray-700 my-0.5"></div>
                        <span className="text-[10px] text-gray-500 font-mono">
                            {limitKcal}
                        </span>
                    </div>

                </div>
            </div>

            {/* Label Inferior */}
            <div className="z-10 text-center mt-auto">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kcal Hoy</span>
            </div>

        </div>
    );
}