import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer'; // <--- 1. IMPORTANTE: Importamos el Footer
import api from '../../services/api';

export default function Layout() {
    const navigate = useNavigate();

    // 1. INICIALIZACIÓN INTELIGENTE:
    // Al cargar la página, intentamos leer el usuario guardado en el navegador.
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // 2. SINCRONIZACIÓN EN SEGUNDO PLANO:
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Usamos /daily porque devuelve el usuario actualizado (monedas, nivel, XP)
                const res = await api.get('/daily');

                if (res.data.user) {
                    // Mezclamos lo que teníamos con lo nuevo por seguridad
                    const updatedUser = { ...user, ...res.data.user };

                    setUser(updatedUser);
                    // Guardamos en memoria local para la próxima vez
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            } catch (error) {
                console.error("Error actualizando usuario en Layout:", error);
                // Si el token falló, podrías redirigir al login:
                // if (error.response?.status === 401) logout();
            }
        };

        // Solo llamamos a la API si tenemos un token (estamos logueados)
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData();
        } else {
            navigate('/login');
        }
    }, []);

    // Función para cerrar sesión limpia
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Función auxiliar para que los hijos (Home, Games...) puedan actualizar el usuario
    const handleUserUpdate = (newData) => {
        setUser((prev) => {
            const updated = { ...prev, ...newData };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        // Usamos pb-24 (padding bottom) para que el Footer no tape el contenido final
        <div className="min-h-screen bg-black text-white pb-24 font-sans relative">

            {/* El Header siempre recibe el usuario actualizado */}
            <Header user={user} logout={logout} />

            <main className="pt-24 px-4 max-w-md mx-auto">
                {/* Pasamos 'user' y 'setUser' a todas las páginas */}
                <Outlet context={{ user, setUser: handleUserUpdate }} />
            </main>

            {/* --- 2. AQUÍ PONEMOS EL FOOTER --- */}
            <Footer />
        </div>
    );
}