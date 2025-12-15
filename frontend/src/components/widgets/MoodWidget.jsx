import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Angry, Laugh, HeartPulse } from 'lucide-react';

export default function MoodWidget({ mood, onUpdate }) {
    const [selected, setSelected] = useState(mood);
    const [animating, setAnimating] = useState(null); // Para efecto rebote

    useEffect(() => {
        setSelected(mood);
    }, [mood]);

    const moods = [
        { value: 'rad', icon: Laugh, color: 'text-green-400', activeBg: 'bg-green-500/20', label: 'Genial' },
        { value: 'good', icon: Smile, color: 'text-blue-400', activeBg: 'bg-blue-500/20', label: 'Bien' },
        { value: 'meh', icon: Meh, color: 'text-gray-300', activeBg: 'bg-gray-500/20', label: 'Normal' },
        { value: 'bad', icon: Frown, color: 'text-orange-400', activeBg: 'bg-orange-500/20', label: 'Mal' },
        { value: 'awful', icon: Angry, color: 'text-red-500', activeBg: 'bg-red-500/20', label: 'Fatal' },
    ];

    const handleSelect = (value) => {
        setSelected(value);
        setAnimating(value);
        onUpdate(value);

        // Reset animación
        setTimeout(() => setAnimating(null), 300);
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 flex flex-col justify-between shadow-lg relative overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1">
                    <HeartPulse size={12} className={selected ? 'text-pink-500' : 'text-gray-500'} />
                    Ánimo
                </h3>
            </div>

            {/* Iconos */}
            <div className="flex justify-between items-center px-1 z-10 mt-2">
                {moods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selected === m.value;
                    const isBouncing = animating === m.value;

                    return (
                        <button
                            key={m.value}
                            onClick={() => handleSelect(m.value)}
                            className={`
                                relative flex flex-col items-center gap-1 transition-all duration-300 outline-none
                                ${isSelected ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-80 hover:scale-105'}
                                ${isBouncing ? 'animate-bounce' : ''}
                            `}
                        >
                            <div className={`
                                p-2.5 rounded-full transition-all duration-300
                                ${isSelected ? `${m.activeBg} ring-2 ring-offset-2 ring-offset-gray-900 ${m.color.replace('text-', 'ring-')}` : 'bg-transparent'}
                            `}>
                                <Icon
                                    size={24}
                                    className={isSelected ? m.color : 'text-gray-400'}
                                    fill={isSelected ? "currentColor" : "none"}
                                    fillOpacity={0.2}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer / Label */}
            <div className="text-center mt-auto z-10 h-6">
                {selected ? (
                    <span className={`text-sm font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 ${moods.find(m => m.value === selected)?.color}`}>
                        {moods.find(m => m.value === selected)?.label}
                    </span>
                ) : (
                    <span className="text-xs text-gray-600 font-bold animate-pulse">¿Cómo te sientes hoy?</span>
                )}
            </div>

            {/* Decoración de fondo sutil */}
            {selected && (
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-500
                    ${selected === 'rad' ? 'bg-green-500' :
                        selected === 'good' ? 'bg-blue-500' :
                            selected === 'bad' ? 'bg-orange-500' :
                                selected === 'awful' ? 'bg-red-500' : 'bg-gray-500'}
                `}></div>
            )}
        </div>
    );
}