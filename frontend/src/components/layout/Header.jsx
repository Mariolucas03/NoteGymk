import { Link } from 'react-router-dom';
import Mascot from '../common/Mascot';
import HealthWidget from './HealthWidget';

export default function Header({ user, setUser }) {
    if (!user) return null;

    // --- DATOS SEGUROS ---
    const stats = user.stats || {};

    const level = user.level || 1;
    const currentXP = user.currentXP || 0;
    const nextLevelXP = user.nextLevelXP || 100;

    // Leemos 'coins' de la raíz del usuario
    const coins = user.coins || 0;

    const username = user.username || user.name || "Usuario";

    // Porcentaje XP
    const xpPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 h-20 px-4 shadow-lg select-none overflow-visible">

            <div className="max-w-md mx-auto h-full flex justify-between items-center relative z-30">

                {/* --- GRUPO IZQUIERDA: AVATAR + INFO --- */}
                <div className="flex items-center gap-3">

                    {/* 1. CÍRCULO AVATAR */}
                    <Link to="/profile" className="flex-shrink-0">
                        <div className="w-11 h-11 rounded-full border-2 border-blue-500 bg-gray-800 flex items-center justify-center overflow-hidden shadow-lg active:scale-95 transition-transform">
                            <span className="text-lg font-bold text-blue-200">{username.charAt(0).toUpperCase()}</span>
                        </div>
                    </Link>

                    {/* 2. INFO DE USUARIO */}
                    <div className="flex flex-col justify-center">
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <h2 className="text-white font-bold text-sm max-w-[100px] truncate capitalize">
                                {username}
                            </h2>
                            <span className="text-xs font-black text-yellow-400 drop-shadow-sm">
                                Lvl {level}
                            </span>
                        </div>

                        {/* Barra XP */}
                        <div className="relative w-32 h-4 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${xpPercentage}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="text-[9px] font-bold text-white drop-shadow-md tracking-wider">
                                    {currentXP}/{nextLevelXP}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- GRUPO DERECHA: CAJAS COMPACTAS --- */}
                <div className="flex flex-col items-end gap-1.5">

                    {/* CAJA 1: MONEDAS (AHORA LLEVA A GAMES) */}
                    {/* 🔥 CAMBIO AQUÍ: De /shop a /games */}
                    <Link to="/games">
                        <div className="w-20 h-7 flex items-center justify-center gap-1.5 bg-gray-900 border border-yellow-500/30 rounded-full shadow-sm active:scale-95 transition-transform hover:border-yellow-500">
                            <span className="text-white font-bold text-xs">{coins}</span>
                            <span className="text-xs">💰</span>
                        </div>
                    </Link>

                    {/* CAJA 2: WIDGET DE VIDAS INTERACTIVO */}
                    <HealthWidget user={user} setUser={setUser} />

                </div>

            </div>

            {/* --- MASCOTA --- */}
            <Mascot />

        </header>
    );
}