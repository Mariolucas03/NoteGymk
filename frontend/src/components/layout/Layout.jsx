import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom'; // Outlet es donde se renderiza la página hija
import Header from './Header';
import Footer from './Footer';
// Aquí importaremos el Footer más adelante

export default function Layout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Verificar sesión
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        // 2. Cargar datos (Aquí podríamos refrescarlos desde la API en el futuro)
        setUser(JSON.parse(storedUser));
        setLoading(false);
    }, [navigate]);

    if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Cargando NoteGymk...</div>;

    return (
        <div className="min-h-screen bg-black">
            {/* Header Fijo */}
            <Header user={user} />

            {/* Contenido Principal */}
            {/* pt-24 da espacio arriba para que el header fijo no tape el contenido */}
            <main className="pt-24 px-4 pb-24 text-white">
                <Outlet context={{ user, setUser }} />
            </main>

            {/* Footer Fijo Abajo */}
            <Footer /> {/* <--- 2. AÑADIR COMPONENTE */}
        </div>
    );
}