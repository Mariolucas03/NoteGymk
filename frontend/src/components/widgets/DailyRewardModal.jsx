import { useState } from 'react';
import { X, Check, Lock, Gift } from 'lucide-react';
import { getRewardForDay } from '../../utils/rewardsGenerator';
import api from '../../services/api';

export default function DailyRewardModal({ user, onClose, onUpdateUser }) {
    const [loading, setLoading] = useState(false);

    // Calcular día actual
    const creationDate = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - creationDate);
    const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const daysToShow = [currentDay - 2, currentDay - 1, currentDay, currentDay + 1, currentDay + 2];

    const handleClaim = async () => {
        setLoading(true);
        const todaysReward = getRewardForDay(currentDay);

        try {
            const res = await api.post('/users/claim-daily', {
                coins: todaysReward.coins,
                xp: todaysReward.xp,
                lives: todaysReward.lives
            });

            // AQUÍ ESTÁ EL CAMBIO CLAVE:
            // El backend nos devuelve el usuario nuevo entero, se lo pasamos a Home
            if (res.data.user) {
                onUpdateUser(res.data.user);
                onClose(); // Cerramos el modal AHORA SÍ
            }
        } catch (error) {
            console.error("Error reclamando:", error);
            alert("Hubo un error al reclamar. Intenta recargar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl p-6 flex flex-col items-center">

                <h2 className="text-2xl font-bold text-white mb-1">Recompensa Diaria</h2>
                <p className="text-blue-400 font-mono text-sm mb-6">Día {currentDay}</p>

                <div className="flex justify-between items-end w-full mb-8 relative px-1">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -z-10 -translate-y-1/2 rounded"></div>

                    {daysToShow.map((day) => {
                        if (day < 1) return <div key={day} className="w-12" />;

                        const isToday = day === currentDay;
                        const isPast = day < currentDay;
                        // Verificamos de forma segura si está reclamado
                        const isClaimed = user.dailyRewards?.claimedDays?.includes(day);
                        const reward = getRewardForDay(day);

                        return (
                            <div key={day} className={`flex flex-col items-center transition-all ${isToday ? 'scale-110 -translate-y-2' : 'opacity-50 scale-90'}`}>
                                <span className="text-[10px] text-gray-400 mb-1 font-bold">DÍA {day}</span>

                                <div className={`
                            w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-lg mb-1
                            ${isToday ? 'bg-blue-900/40 border-blue-400 shadow-blue-500/30' : 'bg-gray-800 border-gray-700'}
                            ${isPast && isClaimed ? 'bg-green-900/20 border-green-500' : ''}
                            ${isPast && !isClaimed ? 'bg-red-900/20 border-red-500' : ''}
                        `}>
                                    {isPast ? (
                                        isClaimed ? <Check size={24} className="text-green-500" /> : <X size={24} className="text-red-500" />
                                    ) : (
                                        isToday ? <Gift size={24} className="text-yellow-400 animate-bounce" /> : <Lock size={20} className="text-gray-600" />
                                    )}
                                </div>

                                {/* TEXTO DE RECOMPENSA (Mejorado para verse bien) */}
                                <span className={`text-[11px] font-bold font-mono ${isToday ? 'text-yellow-300' : 'text-gray-500'}`}>
                                    +{reward.coins}💰
                                </span>
                            </div>
                        );
                    })}
                </div>

                {user.dailyRewards?.claimedDays?.includes(currentDay) ? (
                    <button onClick={onClose} className="bg-gray-800 text-gray-400 py-3 px-8 rounded-xl font-bold w-full">
                        Vuelve mañana
                    </button>
                ) : (
                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3.5 px-8 rounded-xl font-bold text-lg w-full shadow-lg shadow-orange-900/50"
                    >
                        {loading ? 'Reclamando...' : '¡RECLAMAR!'}
                    </button>
                )}
            </div>
        </div>
    );
}