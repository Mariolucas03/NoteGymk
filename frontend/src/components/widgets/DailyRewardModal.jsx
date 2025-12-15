import { useEffect } from 'react';
import { X, Coins, Zap, Trophy, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DailyRewardModal({ data, onClose }) {

    // Lanzar confeti al abrir
    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        return () => clearInterval(interval);
    }, []);

    if (!data) return null;

    // Valores por defecto para evitar errores si falta algún dato
    const coins = data.coins || 0;
    const xp = data.xp || 0;
    const message = data.message || "¡Recompensa Recibida!";
    const subMessage = data.subMessage || "¡Gran trabajo! Sigue así.";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/30 w-full max-w-sm rounded-3xl p-6 relative shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in zoom-in-95 duration-300">

                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Icono Principal Animado */}
                <div className="flex justify-center -mt-16 mb-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 rounded-full"></div>
                        <Trophy size={80} className="text-yellow-400 drop-shadow-2xl animate-bounce" />
                    </div>
                </div>

                {/* Textos */}
                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-wider">
                        {message}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {subMessage}
                    </p>
                </div>

                {/* Grid de Recompensas */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Tarjeta XP */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <Zap size={24} className="text-blue-400" fill="currentColor" />
                        </div>
                        <span className="text-2xl font-black text-white">+{xp}</span>
                        <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">XP Ganada</span>
                    </div>

                    {/* Tarjeta Monedas */}
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                        <div className="bg-yellow-500/20 p-2 rounded-full">
                            <Coins size={24} className="text-yellow-400" fill="currentColor" />
                        </div>
                        <span className="text-2xl font-black text-white">+{coins}</span>
                        <span className="text-xs text-yellow-300 font-bold uppercase tracking-wider">Monedas</span>
                    </div>
                </div>

                {/* Botón de Acción */}
                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black py-4 rounded-xl text-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                >
                    ¡RECLAMAR!
                </button>
            </div>
        </div>
    );
}