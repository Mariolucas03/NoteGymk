import React from 'react';
import { Heart, Coins, Star } from 'lucide-react';

export default function Header({ user }) {
    // Logic for Level Title
    const getLevelTitle = (level) => {
        if (level <= 5) return "Principiante";
        if (level <= 10) return "Avanzado";
        if (level <= 20) return "Experto";
        return "Maestro";
    };

    // Calculate XP progress percentage
    const xpPercentage = Math.min((user.xp / user.nextLevelXp) * 100, 100);

    return (
        <header className="fixed top-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-b border-white/10 z-50 px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between max-w-md mx-auto">

                {/* Left: Avatar & Level */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={user.avatarUrl || "https://placehold.co/100"}
                            alt="User"
                            className="w-12 h-12 rounded-full border-2 border-violet-500 object-cover"
                        />
                        {/* Pet Avatar (Small overlay) */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden">
                            <img src={user.petUrl || "https://placehold.co/50"} alt="Pet" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Lvl {user.level}</span>
                        <span className="text-sm font-medium text-slate-200">{getLevelTitle(user.level)}</span>
                    </div>
                </div>

                {/* Right: Stats */}
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3 text-xs font-bold">
                        <div className="flex items-center gap-1 text-red-400">
                            <Heart size={14} fill="currentColor" />
                            <span>{user.health}/{user.maxHealth}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                            <Coins size={14} fill="currentColor" />
                            <span>{user.coins}</span>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden relative mt-1">
                        <div
                            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
                            style={{ width: `${xpPercentage}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-500">{user.xp} / {user.nextLevelXp} XP</span>
                </div>

            </div>
        </header>
    );
}
