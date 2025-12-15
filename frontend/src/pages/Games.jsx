import { useOutletContext, Link } from 'react-router-dom';
import { Gamepad2, Dices, CircleDollarSign, Ticket, ChevronLeft, Disc } from 'lucide-react';

export default function Games() {
    // Obtenemos el usuario del contexto (Layout)
    const { user } = useOutletContext();

    const gamesList = [
        {
            id: 'fortune-wheel', // Esto coincidirá con la ruta /games/fortune-wheel
            name: 'La Ruleta de la Suerte',
            desc: 'Gira y multiplica tus ganancias diarias.',
            icon: <CircleDollarSign size={40} className="text-yellow-400" />,
            color: 'bg-yellow-900/20 border-yellow-500/30',
            btnColor: 'bg-yellow-500 hover:bg-yellow-400',
            status: 'Disponible'
        },
        {
            id: 'roulette',
            name: 'Ruleta',
            desc: 'Apuesta al rojo o negro clásico.',
            icon: <Disc size={40} className="text-red-400" />,
            color: 'bg-red-900/20 border-red-500/30',
            btnColor: 'bg-red-600 hover:bg-red-500',
            status: 'Disponible' // Puedes ponerlo en 'Próximamente' si aún no tienes el archivo creado
        },
        {
            id: 'dice',
            name: 'Dados Rápidos',
            desc: 'Saca mayor puntuación que la banca.',
            icon: <Dices size={40} className="text-blue-400" />,
            color: 'bg-blue-900/20 border-blue-500/30',
            btnColor: 'bg-blue-600 hover:bg-blue-500',
            status: 'Disponible'
        },
        {
            id: 'scratch',
            name: 'Rasca y Gana',
            desc: 'Encuentra 3 símbolos iguales.',
            icon: <Ticket size={40} className="text-purple-400" />,
            color: 'bg-purple-900/20 border-purple-500/30',
            btnColor: 'bg-purple-600 hover:bg-purple-500',
            status: 'Disponible'
        }
    ];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in select-none">
            {/* Cabecera */}
            <div className="flex items-center gap-3 mb-6">
                <Link to="/" className="bg-gray-900 p-2 rounded-xl border border-gray-800 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Gamepad2 className="text-purple-500" /> Sala de Juegos
                    </h1>
                    <p className="text-gray-400 text-xs">Diviértete y gana premios</p>
                </div>
            </div>

            {/* Grid de Juegos */}
            <div className="grid grid-cols-1 gap-4">
                {gamesList.map((game) => (
                    <div key={game.id} className={`p-4 rounded-2xl border ${game.color} flex items-center gap-4 relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                        {/* Icono con fondo */}
                        <div className="bg-gray-900/50 p-3 rounded-xl backdrop-blur-sm shadow-inner">
                            {game.icon}
                        </div>

                        {/* Textos */}
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">{game.name}</h3>
                            <p className="text-gray-400 text-xs">{game.desc}</p>
                        </div>

                        {/* BOTÓN INTELIGENTE: LINK O DESHABILITADO */}
                        {game.status === 'Disponible' ? (
                            <Link
                                to={`/games/${game.id}`}
                                className={`${game.btnColor} text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-colors flex items-center justify-center`}
                            >
                                Jugar
                            </Link>
                        ) : (
                            <button disabled className="bg-gray-800 text-gray-500 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed border border-gray-700">
                                Bloq.
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}