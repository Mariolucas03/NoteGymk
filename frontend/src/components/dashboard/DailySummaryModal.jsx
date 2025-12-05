import React from 'react';
import { X, CheckCircle2, XCircle, Trophy, ScrollText } from 'lucide-react';

export default function DailySummaryModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    const { completed = [], failed = [], stats = { xp: 0, coins: 0, livesLost: 0 } } = data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-800 p-4 flex items-center justify-center relative border-b border-slate-700">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
                        <ScrollText size={20} /> Resumen de Ayer
                    </h2>
                    <button onClick={onClose} className="absolute right-4 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-4 space-y-6 flex-1">

                    {/* Victorias (Completed) */}
                    <div>
                        <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <CheckCircle2 size={16} /> Completadas ({completed.length})
                        </h3>
                        {completed.length === 0 ? (
                            <p className="text-slate-500 text-sm italic py-2">Sin misiones completadas ayer...</p>
                        ) : (
                            <div className="space-y-2">
                                {completed.map(mission => (
                                    <div key={mission._id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex justify-between items-center">
                                        <span className="text-slate-200 font-medium text-sm">{mission.name}</span>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-yellow-400 font-bold">+{mission.coinReward} 🪙</span>
                                            <span className="text-purple-400 font-bold">+{mission.xpReward} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Derrotas (Failed) */}
                    <div>
                        <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <XCircle size={16} /> Caducadas ({failed.length})
                        </h3>
                        {failed.length === 0 ? (
                            <p className="text-slate-500 text-sm italic py-2">Ninguna misión caducada...</p>
                        ) : (
                            <div className="space-y-2">
                                {failed.map(mission => (
                                    <div key={mission._id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex justify-between items-center">
                                        <span className="text-slate-200 font-medium text-sm">{mission.name}</span>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-red-400 font-bold">
                                                -{mission.difficulty === 'facil' ? 10 : mission.difficulty === 'media' ? 5 : mission.difficulty === 'dificil' ? 3 : 1} ❤️
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer Reports */}
                <div className="bg-slate-950 p-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold">Balance Total:</span>
                        <div className="flex gap-3">
                            {stats.xp > 0 && <span className="text-purple-400 font-bold">+{stats.xp} XP</span>}
                            {stats.coins > 0 && <span className="text-yellow-400 font-bold">+{stats.coins} 🪙</span>}
                            {stats.livesLost > 0 && <span className="text-red-500 font-bold">-{stats.livesLost} ❤️</span>}
                            {stats.xp === 0 && stats.coins === 0 && stats.livesLost === 0 && <span className="text-slate-500">Sin cambios</span>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
