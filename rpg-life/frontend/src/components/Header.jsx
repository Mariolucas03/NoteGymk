import React from 'react';
import { useUser } from '../context/UserContext';

export default function Header() {
    const { user } = useUser();
    // compute level progress (simple)
    const level = user.level || 1;
    const xpForLevel = (level - 1) * 100;
    const nextLevelXp = level * 100;
    const progress = Math.round(((user.xp - xpForLevel) / (nextLevelXp - xpForLevel)) * 100) || 0;

    return (
        <header className="flex items-center justify-between p-4 bg-white shadow">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="w-44">
                    <div className="font-bold">{user.name}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-xs text-gray-500">Nivel {level} · {user.xp} XP</div>
                </div>
            </div>

            <div className="text-right">
                <div className="text-red-500 font-bold">❤️ {user.lives}</div>
                <div className="text-yellow-600 font-bold">💰 {user.coins}</div>
            </div>
        </header>
    );
}
