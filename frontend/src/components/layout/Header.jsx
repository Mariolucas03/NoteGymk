import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Header({ user, logout }) {
    if (!user) return null;

    // Datos seguros con valores por defecto
    const level = user.level || 1;
    const currentXP = user.currentXP || 0;
    const nextLevelXP = user.nextLevelXP || 100;
    const coins = user.coins || 0;
    const lives = user.lives || 5; // Valor por defecto 5 (estándar en juegos)

    // CORRECCIÓN DE NOMBRE: Busca username, luego name, o pone "Usuario"
    const username = user.username || user.name || "Usuario";

    // Cálculo porcentaje XP (máximo 100%)
    const xpPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 h-20 px-4 shadow-lg select-none">
            <div className="max-w-md mx-auto h-full flex items-center justify-between gap-3">

                {/* --- GRUPO IZQUIERDA: NIVEL + NOMBRE/XP --- */}
                <div className="flex items-center gap-3 flex-1">

                    {/* 1. NIVEL (Círculo Grande) - Link a Perfil */}
                    <Link to="/profile" className="flex-shrink-0">
                        <div className="relative w-12 h-12 flex items-center justify-center cursor-pointer active:scale-95 transition-transform rounded-full border-2 border-blue-500 bg-gray-900">
                            <span className="text-xl font-black text-white">{level}</span>
                        </div>
                    </Link>

                    {/* 2. NOMBRE Y BARRA XP (Columna) */}
                    <div className="flex flex-col w-full max-w-[140px]">
                        {/* Nombre de Usuario */}
                        <h2 className="text-white font-bold text-sm truncate mb-1 capitalize">
                            {username}
                        </h2>

                        {/* Barra XP con texto DENTRO */}
                        <div className="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                            {/* Relleno Azul */}
                            <div
                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${xpPercentage}%` }}
                            ></div>

                            {/* Texto centrado absoluto */}
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="text-[9px] font-bold text-white drop-shadow-md tracking-wider">
                                    {currentXP}/{nextLevelXP} XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- GRUPO DERECHA: CAJAS DE STATS --- */}
                <div className="flex items-center gap-2">

                    {/* Caja Monedas [ 500 💰 ] - AHORA ES UN LINK A /GAMES */}
                    <Link to="/games">
                        <div className="flex items-center gap-1.5 bg-gray-900 border border-yellow-500/30 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-800 transition-colors active:scale-95 group">
                            <span className="font-bold text-white text-sm group-hover:text-yellow-400 transition-colors">{coins}</span>
                            <span className="text-xs">💰</span>
                        </div>
                    </Link>

                    {/* Caja Vidas [ 5 ❤️ ] */}
                    <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-600 px-2 py-1.5 rounded-md">
                        <span className="font-bold text-white text-sm">{lives}</span>
                        <span className="text-xs">❤️</span>
                    </div>

                    {/* Botón Salir */}
                    <button onClick={logout} className="text-gray-600 hover:text-red-400 ml-1 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>

            </div>
        </header>
    );
}