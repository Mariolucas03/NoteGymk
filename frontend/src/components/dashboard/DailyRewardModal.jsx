import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Gift, Crown, Coins, Zap } from 'lucide-react';

export default function DailyRewardModal({ isOpen, onClose, onClaim, userStreak }) {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(false);

    // Helper to generate preview (simulating backend logic for UI speed)
    // Ideally we would fetch this from /api/user/rewards-preview, but for now we can generate it client-side
    // based on the user's current streak to ensure instant rendering.
    useEffect(() => {
        if (isOpen) {
            const generatedRewards = [];
            const currentDay = userStreak || 1;

            for (let i = -2; i <= 2; i++) {
                const day = currentDay + i;
                if (day > 0) {
                    let type = 'daily';
                    let coins = 50;
                    let xp = 20;

                    if (day % 30 === 0) {
                        type = 'monthly';
                        coins = 500;
                        xp = 500;
                    } else if (day % 7 === 0) {
                        type = 'weekly';
                        coins = 150;
                        xp = 100;
                    }

                    generatedRewards.push({
                        day,
                        type,
                        coins,
                        xp,
                        status: i < 0 ? 'claimed' : (i === 0 ? 'current' : 'locked')
                    });
                }
            }
            setRewards(generatedRewards);
        }
    }, [isOpen, userStreak]);

    const handleClaim = async () => {
        setLoading(true);
        await onClaim();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-violet-600/20 blur-3xl -z-10" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-1">¡Recompensa Diaria!</h2>
                    <p className="text-slate-400 text-sm">Vuelve cada día para ganar más premios</p>
                </div>

                {/* Carousel */}
                <div className="flex justify-between items-end gap-2 mb-8 overflow-x-auto pb-4 px-2 no-scrollbar">
                    {rewards.map((reward) => {
                        const isCurrent = reward.status === 'current';
                        const isClaimed = reward.status === 'claimed';
                        const isSpecial = reward.type !== 'daily';

                        return (
                            <div
                                key={reward.day}
                                className={`relative flex flex-col items-center justify-center rounded-xl border transition-all duration-300
                                    ${isCurrent
                                        ? 'w-24 h-32 bg-slate-800 border-violet-500 shadow-lg shadow-violet-500/20 scale-110 z-10'
                                        : 'w-16 h-20 bg-slate-900/50 border-slate-800 opacity-60'
                                    }
                                `}
                            >
                                {/* Header (Day) */}
                                <div className={`absolute top-0 w-full text-center py-1 text-[10px] font-bold uppercase rounded-t-xl
                                    ${isCurrent ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-500'}
                                `}>
                                    Día {reward.day}
                                </div>

                                {/* Icon */}
                                <div className="mt-4 mb-1">
                                    {isClaimed ? (
                                        <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400">
                                            <Check size={isCurrent ? 24 : 16} />
                                        </div>
                                    ) : (
                                        <>
                                            {reward.type === 'monthly' ? (
                                                <Crown size={isCurrent ? 32 : 20} className="text-yellow-400" />
                                            ) : reward.type === 'weekly' ? (
                                                <Gift size={isCurrent ? 32 : 20} className="text-purple-400" />
                                            ) : (
                                                <Coins size={isCurrent ? 28 : 18} className="text-slate-300" />
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Reward Values (Only for Current or Future) */}
                                {!isClaimed && (
                                    <div className="flex flex-col items-center">
                                        <span className={`font-bold ${isCurrent ? 'text-sm text-white' : 'text-[10px] text-slate-400'}`}>
                                            {reward.coins}
                                        </span>
                                        {isCurrent && (
                                            <span className="text-[10px] text-violet-300 flex items-center gap-0.5">
                                                +{reward.xp} XP
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Lock for future */}
                                {reward.status === 'locked' && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
                                        <Lock size={12} className="text-slate-600" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Claim Button */}
                <button
                    onClick={handleClaim}
                    disabled={loading}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    ) : (
                        <>
                            <Gift size={20} />
                            <span>¡Reclamar Recompensa!</span>
                        </>
                    )}
                </button>

            </div>
        </div>
    );
}
