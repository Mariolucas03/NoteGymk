import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Angry, Laugh, HeartPulse } from 'lucide-react';

export default function MoodWidget({ mood, onUpdate }) {
    const [selected, setSelected] = useState(mood);
    const [animating, setAnimating] = useState(null);

    useEffect(() => {
        setSelected(mood);
    }, [mood]);

    const moods = [
        { value: 'rad', icon: Laugh, color: 'text-green-400', ringColor: 'ring-green-400', activeBg: 'bg-green-500/20', label: 'Genial' },
        { value: 'good', icon: Smile, color: 'text-blue-400', ringColor: 'ring-blue-400', activeBg: 'bg-blue-500/20', label: 'Bien' },
        { value: 'meh', icon: Meh, color: 'text-gray-300', ringColor: 'ring-gray-300', activeBg: 'bg-gray-500/20', label: 'Normal' },
        { value: 'bad', icon: Frown, color: 'text-orange-400', ringColor: 'ring-orange-400', activeBg: 'bg-orange-500/20', label: 'Mal' },
        { value: 'awful', icon: Angry, color: 'text-red-500', ringColor: 'ring-red-500', activeBg: 'bg-red-500/20', label: 'Fatal' },
    ];

    const handleSelect = (value) => {
        setSelected(value);
        setAnimating(value);
        onUpdate(value);
        setTimeout(() => setAnimating(null), 300);
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 h-40 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-gray-700 transition-colors">

            {/* Header */}
            <div className="flex justify-between items-center z-10 px-1">
                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1">
                    <HeartPulse size={12} className={selected ? 'text-pink-500' : 'text-gray-500'} />
                    Ánimo
                </h3>
            </div>

            {/* Iconos (Distribución optimizada con justify-between) */}
            <div className="flex justify-between items-center w-full z-10 mt-1 px-0.5">
                {moods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selected === m.value;
                    const isBouncing = animating === m.value;

                    return (
                        <button
                            key={m.value}
                            onClick={() => handleSelect(m.value)}
                            className={`
                                relative flex flex-col items-center justify-center transition-all duration-300 outline-none
                                ${isSelected ? 'scale-110 opacity-100 -translate-y-1' : 'opacity-40 hover:opacity-80 hover:scale-105'}
                                ${isBouncing ? 'animate-bounce' : ''}
                            `}
                        >
                            <div className={`
                                p-2 rounded-full transition-all duration-300
                                ${isSelected ? `${m.activeBg} ring-2 ring-offset-2 ring-offset-gray-900 ${m.ringColor}` : 'bg-transparent'}
                            `}>
                                <Icon
                                    size={20} // Tamaño un pelín más pequeño para que quepan bien los 5
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
            <div className="text-center mt-auto z-10 h-6 flex items-center justify-center">
                {selected ? (
                    <span className={`text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1 ${moods.find(m => m.value === selected)?.color}`}>
                        {moods.find(m => m.value === selected)?.label}
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wide animate-pulse">¿Cómo estás hoy?</span>
                )}
            </div>

            {/* Decoración de fondo sutil */}
            {selected && (
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-500
                    ${selected === 'rad' ? 'bg-green-500' :
                        selected === 'good' ? 'bg-blue-500' :
                            selected === 'bad' ? 'bg-orange-500' :
                                selected === 'awful' ? 'bg-red-500' : 'bg-gray-500'}
                `}></div>
            )}
        </div>
    );
}