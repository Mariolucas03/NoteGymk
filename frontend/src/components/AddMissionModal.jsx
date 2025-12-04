import React, { useState } from 'react';
import { X, Plus, Zap, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddMissionModal({ isOpen, onClose, onAdd }) {
    const [name, setName] = useState('');
    const [difficulty, setDifficulty] = useState('facil');
    const [frequency, setFrequency] = useState('daily');
    const [isRecurring, setIsRecurring] = useState(true); // true = Fija, false = Temporal
    const [xp, setXp] = useState(100);
    const [coins, setCoins] = useState(50);
    const [targetValue, setTargetValue] = useState(1);
    const [hasProgress, setHasProgress] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);

    // Configuration Objects
    const REWARDS = {
        facil: { coins: 50, xp: 100, label: 'Fácil', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
        media: { coins: 150, xp: 300, label: 'Media', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
        dificil: { coins: 500, xp: 1000, label: 'Difícil', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
        muy_dificil: { coins: 1000, xp: 2500, label: 'Muy Difícil', color: 'bg-red-500/20 text-red-400 border-red-500/50' }
    };

    const MULTIPLIERS = {
        daily: 1,
        weekly: 5,
        monthly: 20,
        annual: 100
    };

    // Helper to calculate expiration
    const calculateExpiration = (freq) => {
        const now = new Date();
        let date = new Date();

        switch (freq) {
            case 'weekly':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? 0 : 7); // Next Sunday
                date.setDate(diff);
                date.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                date = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
                date.setHours(23, 59, 59, 999);
                break;
            case 'annual':
                date = new Date(now.getFullYear(), 11, 31); // Dec 31st
                date.setHours(23, 59, 59, 999);
                break;
            case 'daily':
            default:
                return null;
        }
        return date;
    };

    // Auto-Calculate Rewards
    React.useEffect(() => {
        const baseReward = REWARDS[difficulty];
        const multiplier = MULTIPLIERS[frequency] || 1;

        setXp(baseReward.xp * multiplier);
        setCoins(baseReward.coins * multiplier);
    }, [difficulty, frequency]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        onAdd({
            name,
            xp: Number(xp),
            coins: Number(coins),
            frequency,
            isRecurring,
            difficulty,
            expiresAt: calculateExpiration(frequency),
            targetValue: hasProgress ? Number(targetValue) : 1,
            completed: false
        });

        // Reset & Close
        setName('');
        setDifficulty('facil');
        setFrequency('daily');
        setIsRecurring(true);
        setHasProgress(false);
        setTargetValue(1);
        setExpiresAt(null);
        onClose();
    };

    // ... (existing render code)

    {/* Continuity Selector */ }
    {/* ... */ }



    {/* Frequency Selector */ }
    {/* ... */ }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
                        <h2 className="text-lg font-bold text-white">Nueva Misión</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Leer 10 páginas"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Continuity Selector (Temporal vs Fija) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Continuidad</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(false)}
                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${!isRecurring ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Temporal (Una vez)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(true)}
                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${isRecurring ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Fija (Recurrente)
                                </button>
                            </div>
                        </div>

                        {/* Progress / Repetitions Selector */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Añadir barra de progreso</label>
                                <input
                                    type="checkbox"
                                    checked={hasProgress}
                                    onChange={(e) => setHasProgress(e.target.checked)}
                                    className="w-5 h-5 accent-violet-600 bg-slate-800 border-slate-600 rounded focus:ring-violet-500 focus:ring-2"
                                />
                            </div>

                            {hasProgress && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-slate-300">Objetivo:</span>
                                    <input
                                        type="number"
                                        min="2"
                                        value={targetValue}
                                        onChange={(e) => setTargetValue(e.target.value)}
                                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-white focus:border-violet-500 outline-none"
                                    />
                                    <span className="text-sm text-slate-500">repeticiones</span>
                                </div>
                            )}
                        </div>

                        {/* Frequency Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Frecuencia / Caducidad</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
                            >
                                <option value="daily">Diaria</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="annual">Anual</option>
                            </select>
                            <p className="text-[10px] text-slate-500 mt-2 text-center">
                                {isRecurring ? 'Se reinicia:' : 'Caduca:'} <span className="text-violet-400">{calculateExpiration(frequency)?.toLocaleDateString()}</span>
                            </p>
                        </div>

                        {/* Difficulty Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Dificultad</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
                            >
                                <option value="facil">Fácil</option>
                                <option value="media">Media</option>
                                <option value="dificil">Difícil</option>
                                <option value="muy_dificil">Muy Difícil</option>
                            </select>
                        </div>

                        {/* Rewards Preview */}
                        <div className={`grid grid-cols-2 gap-4 p-3 rounded-xl border ${REWARDS[difficulty].color} bg-opacity-10`}>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold uppercase opacity-70">XP</span>
                                <span className="text-xl font-bold flex items-center gap-1">
                                    <Zap size={16} /> {xp}
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold uppercase opacity-70">Monedas</span>
                                <span className="text-xl font-bold flex items-center gap-1">
                                    <Coins size={16} /> {coins}
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="mt-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Plus size={20} />
                            Crear Misión
                        </button>

                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
