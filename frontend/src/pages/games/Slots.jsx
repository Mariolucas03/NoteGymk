import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, Zap, Gem, Cherry, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

// Configuración de premios
const SYMBOLS = [
    { id: 1, icon: <Cherry size={48} />, color: 'text-red-500', name: 'Cherry', value: 2 },
    { id: 2, icon: <Zap size={48} />, color: 'text-yellow-400', name: 'Zap', value: 5 },
    { id: 3, icon: <Gem size={48} />, color: 'text-cyan-400', name: 'Diamond', value: 10 },
    { id: 4, icon: <Sparkles size={48} />, color: 'text-fuchsia-500', name: 'Jackpot', value: 20 },
];

const SPIN_COST = 50;
const SPIN_DURATION = 2000;

export default function Slots() {
    // Obtenemos user y setUser del Layout
    const { user, setUser } = useOutletContext();

    const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [message, setMessage] = useState('¡Gira para ganar!');
    const [winAmount, setWinAmount] = useState(0);

    const handleSpin = async () => {
        // 1. Validación de seguridad
        if (!user) return; // Esperar a que cargue el usuario

        if (user.coins < SPIN_COST) {
            setMessage("⚠️ No tienes suficientes monedas.");
            return;
        }

        if (isSpinning) return;

        // 2. ECONOMÍA: Cobro (Adaptado a tu Layout)
        // Calculamos el nuevo valor directamente usando el 'user' actual
        const newBalance = user.coins - SPIN_COST;

        // ¡IMPORTANTE! Enviamos un OBJETO, no una función, porque tu Layout así lo espera.
        setUser({ coins: newBalance });

        setIsSpinning(true);
        setMessage('Girando...');
        setWinAmount(0);

        // API en background
        api.post('/users/reward', { coins: -SPIN_COST }).catch(err => {
            console.error("Error cobrando entrada:", err);
        });

        // 3. ANIMACIÓN
        const interval = setInterval(() => {
            setReels([
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            ]);
        }, 100);

        // 4. RESULTADO
        setTimeout(async () => {
            clearInterval(interval);

            // Generar resultado
            const finalReels = [
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            ];

            setReels(finalReels);
            setIsSpinning(false);

            // Pasamos el balance actualizado (ya restado) para calcular el premio sobre la base correcta
            checkWin(finalReels, newBalance);

        }, SPIN_DURATION);
    };

    const checkWin = async (resultReels, currentCoins) => {
        if (resultReels[0].id === resultReels[1].id && resultReels[1].id === resultReels[2].id) {
            const symbol = resultReels[0];
            const prize = SPIN_COST * symbol.value;

            setMessage(`¡GANASTE ${prize} MONEDAS!`);
            setWinAmount(prize);

            // ACTUALIZAR PREMIO VISUALMENTE
            // Usamos 'currentCoins' que calculamos antes para asegurar sincronía
            setUser({ coins: currentCoins + prize });

            triggerConfetti();

            try {
                await api.post('/users/reward', { coins: prize });
            } catch (error) {
                console.error("Error guardando premio", error);
            }
        } else {
            setMessage("¡Suerte para la próxima!");
        }
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#d946ef', '#22d3ee', '#fbbf24']
        });
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
            {/* Fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

            <h1 className="text-4xl md:text-6xl font-black mb-8 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                Cyber Slots
            </h1>

            <div className="relative p-6 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-[0_0_50px_rgba(217,70,239,0.3)]">
                {/* Marco Neon */}
                <div className="absolute inset-0 rounded-2xl border-2 border-fuchsia-500 blur-[2px] opacity-70 pointer-events-none"></div>

                {/* Rodillos */}
                <div className="flex gap-4 mb-8">
                    {reels.map((symbol, index) => (
                        <div key={index} className={`w-24 h-32 md:w-32 md:h-40 bg-black rounded-lg flex items-center justify-center border-2 border-slate-700 relative overflow-hidden transition-all duration-100 ${isSpinning ? 'blur-[2px]' : 'blur-0'} ${winAmount > 0 && !isSpinning ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : ''}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none z-10"></div>
                            <div className={`transform transition-transform ${isSpinning ? 'scale-110 animate-pulse' : 'scale-100'} ${symbol.color} z-0`}>
                                {symbol.icon}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botón */}
                <div className="flex flex-col items-center gap-4">
                    <div className="text-xl font-bold font-mono text-cyan-300 drop-shadow-md min-h-[2rem]">
                        {message}
                    </div>

                    <button
                        onClick={handleSpin}
                        disabled={isSpinning}
                        className={`relative group overflow-hidden px-10 py-4 rounded-full font-black text-xl tracking-wider transition-all ${isSpinning ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white hover:scale-105 shadow-[0_0_20px_rgba(217,70,239,0.6)] hover:shadow-[0_0_40px_rgba(217,70,239,0.8)] active:scale-95'}`}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isSpinning ? 'GIRANDO...' : <><Play fill="currentColor" /> GIRAR ({SPIN_COST})</>}
                        </span>
                        {!isSpinning && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>}
                    </button>
                </div>
            </div>

            {/* Paytable */}
            <div className="mt-10 flex gap-6 text-slate-400 text-sm font-mono">
                {SYMBOLS.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                        <span className={s.color}>{s.icon}</span> <span>x{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}