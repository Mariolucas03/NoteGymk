import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { X, Gift, Coins, Zap, Trophy, Crown } from 'lucide-react';

export default function DailyRewardModal({ data, onClose }) {
    if (!data) return null;

    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        // Confeti en capa altísima para que se vea, la librería gestiona que no bloquee clicks
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 20000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => {
            clearInterval(interval);
            confetti.reset();
        };
    }, []);

    const {
        currentDay = 1, claimedDays = [], rewardOfDay = {},
        message = "¡Recompensa!", subMessage = "", buttonText = "Reclamar", isViewOnly = false
    } = data;
    const { coins = 0, xp = 0, type = 'normal' } = rewardOfDay;

    return createPortal(
        // 1. CONTENEDOR MAESTRO (Cubre todo, Z-Index altísimo)
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            {/* 2. FONDO GRIS (Backdrop) */}
            {/* Posición absoluta para llenar el contenedor maestro */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={isViewOnly ? onClose : undefined}
            ></div>

            {/* 3. TARJETA (Contenido) */}
            {/* Posición relativa + z-10 para asegurar que flote SOBRE el fondo gris hermano */}
            <div className="relative z-10 bg-gray-900 w-full max-w-sm rounded-3xl border border-yellow-500/30 shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">

                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-white hover:bg-gray-700 z-50 transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Cabecera */}
                <div className={`h-32 flex items-center justify-center ${type === 'epic' ? 'bg-purple-900' : type === 'rare' ? 'bg-blue-900' : 'bg-yellow-900/50'}`}>
                    <div className="animate-bounce">
                        {type === 'epic' ? <Crown size={64} className="text-purple-300" /> : type === 'rare' ? <Trophy size={64} className="text-blue-300" /> : <Gift size={64} className="text-yellow-300" />}
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="p-6 text-center space-y-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{message}</h2>
                    <p className="text-sm text-yellow-500 font-bold">{subMessage}</p>

                    <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 flex justify-around items-center">
                        <div className="flex flex-col items-center">
                            <Coins className="text-yellow-400 mb-1" />
                            <span className="text-2xl font-black text-white">+{coins}</span>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-700"></div>
                        <div className="flex flex-col items-center">
                            <Zap className="text-blue-400 mb-1" />
                            <span className="text-2xl font-black text-white">+{xp}</span>
                        </div>
                    </div>

                    <div className="flex justify-between gap-1 pt-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const isCompleted = claimedDays.includes(day) || (currentDay >= day && !isViewOnly);
                            const isCurrent = currentDay === day;
                            return <div key={day} className={`h-2 flex-1 rounded-full transition-all ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-yellow-500 animate-pulse' : 'bg-gray-800'}`} />;
                        })}
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-transform active:scale-95 shadow-lg cursor-pointer ${isViewOnly ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20'}`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}