import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Angry, Laugh } from 'lucide-react';

export default function MoodWidget({ mood, onUpdate }) {
    // 1. Iniciamos el estado con lo que venga de la base de datos (o null)
    const [selected, setSelected] = useState(mood);

    // 2. EFECTO CLAVE: Cuando 'mood' cambie (al cargar la página), actualizamos la selección
    useEffect(() => {
        setSelected(mood);
    }, [mood]);

    const moods = [
        { value: 'rad', icon: Laugh, color: 'text-green-400', label: 'Genial' },
        { value: 'good', icon: Smile, color: 'text-blue-400', label: 'Bien' },
        { value: 'meh', icon: Meh, color: 'text-gray-400', label: 'Normal' },
        { value: 'bad', icon: Frown, color: 'text-orange-400', label: 'Mal' },
        { value: 'awful', icon: Angry, color: 'text-red-500', label: 'Fatal' },
    ];

    const handleSelect = (value) => {
        setSelected(value); // Actualiza visualmente al instante
        onUpdate(value);    // Envía a la base de datos para guardar
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400 text-xs font-bold uppercase">Estado de Ánimo</h3>
            </div>

            <div className="flex justify-between items-center px-1">
                {moods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selected === m.value;

                    return (
                        <button
                            key={m.value}
                            onClick={() => handleSelect(m.value)}
                            className={`flex flex-col items-center gap-1 transition-all duration-200 outline-none ${isSelected
                                    ? 'scale-110 opacity-100'
                                    : 'opacity-40 hover:opacity-70 hover:scale-105'
                                }`}
                        >
                            <div className={`p-2 rounded-full transition-all ${isSelected
                                    ? 'bg-gray-800 ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-500'
                                    : 'bg-transparent'
                                }`}>
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

            <div className="text-center h-4 mt-1">
                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selected ? 'text-white' : 'text-gray-600'
                    }`}>
                    {moods.find(m => m.value === selected)?.label || "Selecciona"}
                </span>
            </div>
        </div>
    );
}