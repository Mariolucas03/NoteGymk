import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import DailyRewardModal from '../components/widgets/DailyRewardModal';
import MoodWidget from '../components/widgets/MoodWidget';
import WeightWidget from '../components/widgets/WeightWidget';
import FoodWidget from '../components/widgets/FoodWidget';
import StreakWidget from '../components/widgets/StreakWidget';
import GainsWidget from '../components/widgets/GainsWidget';
import TrainingWidget from '../components/widgets/TrainingWidget';

export default function Home() {
    const { user, setUser } = useOutletContext();
    const [showRewardModal, setShowRewardModal] = useState(false);

    // Estado para los datos del día (Mood, Weight, etc.)
    const [dailyData, setDailyData] = useState(null);

    // 1. Cargar datos del día al entrar
    useEffect(() => {
        const fetchDailyData = async () => {
            try {
                const res = await api.get('/daily');
                setDailyData(res.data);
            } catch (error) {
                console.error("Error cargando daily log", error);
            }
        };
        fetchDailyData();
    }, []);

    // 2. Lógica del Daily Reward
    useEffect(() => {
        if (!user) return;
        const creationDate = new Date(user.createdAt);
        const now = new Date();
        const currentDay = Math.ceil(Math.abs(now - creationDate) / (1000 * 60 * 60 * 24));
        const hasClaimedToday = user.dailyRewards?.claimedDays?.includes(currentDay);
        if (!hasClaimedToday) {
            const timer = setTimeout(() => setShowRewardModal(true), 800);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <div className="space-y-6 pb-6">

            {showRewardModal && (
                <DailyRewardModal
                    user={user}
                    onClose={() => setShowRewardModal(false)}
                    onUpdateUser={handleUserUpdate}
                />
            )}

            {/* CABECERA DE SECCIÓN */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Resumen Diario</h1>
                    <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <button className="text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg text-gray-400">
                    Editar Widgets
                </button>
            </div>

            {/* --- GRID DE WIDGETS --- */}
            <div className="grid grid-cols-2 gap-4">

                {/* 1. ENTRENAMIENTO (WIDGET INTELIGENTE) */}
                <TrainingWidget workout={dailyData?.workout} />

                {/* 2. ÁNIMO (50%) */}
                <MoodWidget initialMood={dailyData?.mood} />

                {/* 3. COMIDA (50%) */}
                <FoodWidget
                    currentKcal={dailyData?.totalKcal}
                    limitKcal={2100} // Más adelante esto vendrá de user.settings
                />

                {/* 4. PESO (50%) - AHORA ES EL WIDGET REAL */}
                <WeightWidget initialWeight={dailyData?.weight} />

                {/* 5. RACHA (50%) */}
                <StreakWidget streak={user.streak?.current} />

                {/* 6. GANANCIAS (50%) */}
                <GainsWidget
                    dailyCoins={0} // Próximamente conectaremos esto al historial de transacciones
                    dailyXP={0}
                    dailyLives={0}
                />

            </div>

        </div>
    );
}