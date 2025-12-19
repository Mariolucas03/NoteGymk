import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import Footer from './Footer';
import api from '../../services/api';
import RedemptionScreen from './RedemptionScreen'; // <--- 1. IMPORTAR PANTALLA ROJA

export default function Layout() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("Error parseando usuario local:", e);
            return null;
        }
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/daily');
                setUser((prevUser) => {
                    const safePrev = prevUser || {};
                    const updatedUser = {
                        ...safePrev,
                        ...(res.data.user || {}),
                        dailyLog: res.data
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    return updatedUser;
                });
            } catch (error) {
                console.error("Error sincronizando:", error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };

        const token = localStorage.getItem('token');
        if (token) fetchUserData();

    }, [navigate]);

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    // useCallback PARA EVITAR BUCLES
    const handleUserUpdate = useCallback((newData) => {
        setUser((prev) => {
            const updated = { ...prev, ...newData };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // --- 2. LÓGICA DE GAME OVER (EL MURO) ---
    // Si el usuario existe, tiene stats y su vida es 0 o menos... ¡BLOQUEO TOTAL!
    if (user && user.stats && user.stats.hp <= 0) {
        // Renderizamos SOLO la pantalla de redención. 
        // Pasamos handleUserUpdate como setUser para poder revivir.
        return <RedemptionScreen user={user} setUser={handleUserUpdate} />;
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans relative flex flex-col">
            {/* 3. Pasamos setUser al Header para que funcione el HealthWidget (guardar misión) */}
            <Header user={user} setUser={handleUserUpdate} logout={logout} />

            <main className="flex-grow pt-20 px-4 max-w-md mx-auto w-full">
                <Outlet context={{ user, setUser: handleUserUpdate }} />
            </main>

            <Footer />
        </div>
    );
}