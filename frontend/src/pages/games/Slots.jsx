import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Sparkles, Zap, Gem, Cherry, Play, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

const SYMBOLS = [
    { id: 1, icon: <Cherry size={48} />, color: 'text-red-500', value: 2 },
    { id: 2, icon: <Zap size={48} />, color: 'text-yellow-400', value: 5 },
    { id: 3, icon: <Gem size={48} />, color: 'text-cyan-400', value: 10 },
    { id: 4, icon: <Sparkles size={48} />, color: 'text-fuchsia-500', value: 20 },
];

const SPIN_COST = 50;

export default function Slots() {
    const { user, setUser } = useOutletContext();
    const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [message, setMessage] = useState('¡Gira para ganar Fichas!');
    const currentFichas = user?.stats?.gameCoins || 0;

    const handleSpin = async () => {
        if (!user) return;
        if (currentFichas < SPIN_COST) { setMessage("⚠️ No tienes suficientes Fichas."); return; }
        if (isSpinning) return;

        const newBalance = currentFichas - SPIN_COST;
        const updatedUser = { ...user, stats: { ...user.stats, gameCoins: newBalance } };
        setUser(updatedUser);

        setIsSpinning(true);
        setMessage('Girando...');
        api.post('/users/reward', { gameCoins: -SPIN_COST }).catch(console.error);

        const interval = setInterval(() => {
            setReels([
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            ]);
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            const finalReels = [
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            ];
            setReels(finalReels);
            setIsSpinning(false);
            checkWin(finalReels, newBalance);
        }, 2000);
    };

    const checkWin = async (resultReels, currentBalance) => {
        if (resultReels[0].id === resultReels[1].id && resultReels[1].id === resultReels[2].id) {
            const prize = SPIN_COST * resultReels[0].value;
            setMessage(`¡GANASTE ${prize} FICHAS!`);

            const finalBalance = currentBalance + prize;
            const winnerUser = { ...user, stats: { ...user.stats, gameCoins: finalBalance } };
            setUser(winnerUser);
            localStorage.setItem('user', JSON.stringify(winnerUser));

            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#d946ef', '#22d3ee'] });
            try { await api.post('/users/reward', { gameCoins: prize }); } catch (e) { }
        } else {
            setMessage("¡Suerte para la próxima!");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] w-full bg-slate-950 overflow-hidden relative text-white select-none">
            {/* HEADER */}
            <div className="shrink-0 h-14 flex items-center justify-between px-4 bg-slate-900/80 border-b border-white/5 z-40">
                <div className="flex items-center gap-3">
                    <Link to="/games" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"><ChevronLeft size={20} /></Link>
                    <h1 className="font-black tracking-tighter text-lg uppercase italic text-fuchsia-500">Neon Slots</h1>
                </div>
                <div className="bg-purple-900/40 border border-purple-500/30 px-3 py-1.5 rounded-xl flex flex-col items-end backdrop-blur-md">
                    <span className="text-lg font-black text-white leading-none">{currentFichas}</span>
                    <span className="text-purple-400 text-[10px] font-bold uppercase leading-none">Fichas</span>
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="relative p-6 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl">
                    <div className="absolute inset-0 rounded-2xl border-2 border-fuchsia-500 blur-[2px] opacity-70 pointer-events-none"></div>
                    <div className="flex gap-4 mb-8">
                        {reels.map((symbol, i) => (
                            <div key={i} className={`w-24 h-32 md:w-32 md:h-40 bg-black rounded-lg flex items-center justify-center border-2 border-slate-700 relative overflow-hidden transition-all duration-100 ${isSpinning ? 'blur-[2px]' : 'blur-0'}`}>
                                <div className={`transform transition-transform ${isSpinning ? 'scale-110 animate-pulse' : 'scale-100'} ${symbol.color} z-0`}>{symbol.icon}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <p className="mb-4 text-cyan-300 font-bold min-h-[1.5rem]">{message}</p>
                        <button onClick={handleSpin} disabled={isSpinning} className={`relative group overflow-hidden px-10 py-4 rounded-full font-black text-xl tracking-wider transition-all ${isSpinning ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white hover:scale-105 shadow-[0_0_20px_rgba(217,70,239,0.6)]'}`}>
                            <span className="relative z-10 flex items-center gap-2">{isSpinning ? 'GIRANDO...' : <><Play fill="currentColor" /> GIRAR ({SPIN_COST})</>}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}