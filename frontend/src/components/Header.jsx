import React from 'react';
import { Heart, Coins, Star } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Header() {
    const { user } = useUser();

    // Valores por defecto para evitar errores si user es null/undefined
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const nextLevelXp = user?.nextLevelXp || (level * 100);
    const coins = user?.coins || 0;
    const lives = user?.lives || 5; // Default to 5 if undefined

    const progress = Math.min((xp / nextLevelXp) * 100, 100);

    return (
        <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50 px-4 py-3">
            <div className="max-w-md mx-auto flex items-center justify-between">
                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-violet-900/50">
                        {level}
                    </div>
                    <div>
                        <h1 className="font-bold text-sm text-white leading-tight">{user?.name || 'Héroe'}</h1>
                        <div className="w-32 h-4 bg-slate-800 rounded-full mt-1 overflow-hidden relative">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white drop-shadow-md">
                                    {xp} / {nextLevelXp} XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                        <span className="text-xs font-bold text-yellow-100">{coins}</span>
                        <Coins size={14} className="text-yellow-400" fill="currentColor" />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                        <span className="text-xs font-bold text-red-100">{lives}</span>
                        <Heart size={14} className="text-red-500" fill="currentColor" />
                    </div>
                </div>
            </div>
        </header>
    );
}
