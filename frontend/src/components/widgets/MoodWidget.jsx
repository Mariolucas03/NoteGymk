import { useState, useEffect } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import api from '../../services/api';

export default function MoodWidget({ initialMood }) {
    const [mood, setMood] = useState(initialMood);
    const [loading, setLoading] = useState(false);

    // Sincronizar si viene dato inicial del padre
    useEffect(() => {
        if (initialMood) setMood(initialMood);
    }, [initialMood]);

    const handleMoodSelect = async (selectedMood) => {
        setMood(selectedMood);
        setLoading(true);
        try {
            // Enviamos al backend: type='mood', value='happy'/'neutral'/'sad'
            await api.put('/daily/update', { type: 'mood', value: selectedMood });
        } catch (error) {
            console.error("Error guardando ánimo", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between h-40 shadow-lg relative overflow-hidden">

            {/* Título */}
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estado de Ánimo</h3>
                {loading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center mt-2 z-10">

                {/* HAPPY */}
                <button
                    onClick={() => handleMoodSelect('happy')}
                    className={`p-3 rounded-xl transition-all transform active:scale-95 ${mood === 'happy' ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500' : 'bg-gray-800 text-gray-600 hover:bg-gray-800/80'}`}
                >
                    <Smile size={32} />
                </button>

                {/* NEUTRAL */}
                <button
                    onClick={() => handleMoodSelect('neutral')}
                    className={`p-3 rounded-xl transition-all transform active:scale-95 ${mood === 'neutral' ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500' : 'bg-gray-800 text-gray-600 hover:bg-gray-800/80'}`}
                >
                    <Meh size={32} />
                </button>

                {/* SAD */}
                <button
                    onClick={() => handleMoodSelect('sad')}
                    className={`p-3 rounded-xl transition-all transform active:scale-95 ${mood === 'sad' ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500' : 'bg-gray-800 text-gray-600 hover:bg-gray-800/80'}`}
                >
                    <Frown size={32} />
                </button>

            </div>

            {/* Texto de estado actual */}
            <p className="text-center text-sm font-medium text-gray-500 mt-2 z-10">
                {mood === 'happy' && "¡Sigue así! 🔥"}
                {mood === 'neutral' && "Día tranquilo 🌊"}
                {mood === 'sad' && "Mañana será mejor 💪"}
                {!mood && "Registra tu día"}
            </p>

            {/* Decoración Fondo */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 transition-colors duration-500
        ${mood === 'happy' ? 'bg-green-500' : mood === 'sad' ? 'bg-red-500' : mood === 'neutral' ? 'bg-yellow-500' : 'bg-transparent'}
      `} />
        </div>
    );
}