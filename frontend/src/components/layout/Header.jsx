import { useNavigate } from 'react-router-dom';
import { Heart, Coins } from 'lucide-react';

export default function Header({ user }) {
    const navigate = useNavigate();
    if (!user) return null;

    // Accedemos a las propiedades DIRECTAMENTE (sin .stats)
    // Usamos || 0 por seguridad si algún dato falta
    const level = user.level || 1;
    const currentXP = user.currentXP || 0;
    const nextLevelXP = user.nextLevelXP || 100;
    const coins = user.coins || 0;
    const lives = user.lives || 5;

    const xpPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 h-20 px-4 flex items-center justify-between shadow-lg">

            <div className="flex items-center gap-3">
                {/* Nivel */}
                <div onClick={() => navigate('/profile')} className="relative cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-2 border-blue-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{level}</span>
                    </div>
                </div>

                {/* Info + XP */}
                <div className="flex flex-col justify-center">
                    <h2 className="text-white font-bold text-sm truncate max-w-[120px]">
                        {user.username}
                    </h2>
                    <div className="w-24 h-2 bg-gray-800 rounded-full mt-1 relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${xpPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        {currentXP}/{nextLevelXP} XP
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex flex-col items-center bg-gray-900 border border-yellow-900/50 px-2 py-1 rounded-lg min-w-[50px]">
                    <Coins size={16} className="text-yellow-400 mb-0.5" />
                    <span className="text-yellow-100 text-xs font-bold">{coins}</span>
                </div>
                <div className="flex flex-col items-center bg-gray-900 border border-red-900/50 px-2 py-1 rounded-lg min-w-[50px]">
                    <Heart size={16} className="text-red-500 fill-red-500 mb-0.5" />
                    <span className="text-red-100 text-xs font-bold">{lives}</span>
                </div>
            </div>
        </header>
    );
}