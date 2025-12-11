import { NavLink } from 'react-router-dom';
import { Home, ScrollText, Utensils, Dumbbell, ShoppingBag } from 'lucide-react';

export default function Footer() {

    // Definimos los items para recorrerlos con un map y dejar el código limpio
    const navItems = [
        { name: 'Inicio', path: '/home', icon: Home },
        { name: 'Misiones', path: '/missions', icon: ScrollText },
        { name: 'Comida', path: '/food', icon: Utensils },
        { name: 'Gym', path: '/gym', icon: Dumbbell },
        { name: 'Tienda', path: '/shop', icon: ShoppingBag },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 h-16 px-2 pb-safe z-50">
            <ul className="flex justify-around items-center h-full">
                {navItems.map((item) => (
                    <li key={item.name} className="w-full">
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive
                                    ? 'text-blue-500 scale-110' // Estilo ACTIVO (Azul y un poco más grande)
                                    : 'text-gray-500 hover:text-gray-300' // Estilo INACTIVO
                                }`
                            }
                        >
                            {/* Renderizamos el Icono */}
                            <item.icon size={24} strokeWidth={2} />

                            {/* Texto pequeño debajo */}
                            <span className="text-[10px] mt-1 font-medium tracking-wide">
                                {item.name}
                            </span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}