import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import FooterNav from './components/FooterNav';
import Header from './components/Header';
import AddMissionModal from './components/dashboard/AddMissionModal';
import DailyRewardModal from './components/dashboard/DailyRewardModal';
import { createMission, claimDailyReward } from './services/missionService';
import { UserProvider, useUser } from './context/UserContext';

function MainContent() {
    const { user, token, loading, refreshUser } = useUser();
    const [view, setView] = useState('home'); // 'home' | 'shop'

    // Modales Globales (UI State)
    const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
    const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);

    // Check Daily Reward
    useEffect(() => {
        if (user) {
            checkDailyReward(user);
        }
    }, [user]);

    const checkDailyReward = (userData) => {
        if (!userData) return;
        const lastClaim = userData.lastDailyClaim ? new Date(userData.lastDailyClaim) : null;
        const today = new Date();
        const isSameDay = lastClaim && lastClaim.toDateString() === today.toDateString();

        if (!isSameDay) {
            setIsDailyModalOpen(true);
        }
    };

    const handleClaimDaily = async () => {
        try {
            await claimDailyReward();
            await refreshUser();
            setIsDailyModalOpen(false);
        } catch (err) {
            console.log("Intento de reclamo fallido:", err.message);

            if (err.message && err.message.includes('Already claimed')) {
                alert("¡Ya has reclamado tu recompensa de hoy! Vuelve mañana.");
            } else {
                alert("Error al reclamar: " + (err.message || "Error desconocido"));
            }

            setIsDailyModalOpen(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;
    if (!token) return <Auth onSuccess={(u, t) => window.location.reload()} />; // Simple reload to trigger context init, or use login() from context if passed to Auth

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-24 pt-20">
            <Header />
            <main className="max-w-md mx-auto px-4">
                {view === 'home' && (
                    <Dashboard
                        onOpenMissionModal={() => setIsMissionModalOpen(true)}
                    />
                )}
                {view === 'shop' && (
                    <Shop />
                )}
            </main>
            <AddMissionModal
                isOpen={isMissionModalOpen}
                onClose={() => setIsMissionModalOpen(false)}
                onAdd={async (data) => { await createMission(data); refreshUser(); }}
            />

            <DailyRewardModal
                isOpen={isDailyModalOpen}
                onClose={() => setIsDailyModalOpen(false)}
                onClaim={handleClaimDaily}
                userStreak={user?.dailyStreak}
            />
            <FooterNav activeTab={view} onTabChange={setView} />
        </div>
    );
}

export default function App() {
    return (
        <UserProvider>
            <MainContent />
        </UserProvider>
    );
}