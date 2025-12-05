import React, { useState } from 'react';
import { Flame, LogOut, Plus, ScrollText } from 'lucide-react';
import { completeMission, deleteMission, incrementMission } from '../services/missionService';
import MissionList from '../components/dashboard/MissionList';
import DashboardControls from '../components/dashboard/DashboardControls';
import DailySummaryModal from '../components/dashboard/DailySummaryModal';
import { useUser } from '../context/UserContext';
import { getDailySummary } from '../services/missionService';

export default function Dashboard({
    onOpenMissionModal,
}) {
    const { user, missions, refreshUser, logout } = useUser();
    const [missionFrequency, setMissionFrequency] = useState('daily');

    // Daily Summary State
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    const handleOpenSummary = async () => {
        try {
            const data = await getDailySummary();
            setSummaryData(data);
            setIsSummaryModalOpen(true);
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    };

    const handleComplete = async (id) => {
        try {
            await completeMission(id);
            refreshUser();
        } catch (error) {
            console.error("Error completing mission", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMission(id);
            refreshUser();
        } catch (error) {
            console.error("Error deleting mission", error);
        }
    };

    const handleIncrement = async (id) => {
        try {
            await incrementMission(id);
            refreshUser();
        } catch (error) {
            console.error("Error incrementing mission", error);
        }
    };

    return (
        <>
            {/* Encabezado: Racha y Botones */}
            <div className="relative flex items-center justify-center mb-6">
                {/* Botón Resumen (History) - Izquierda Absoluta */}
                <button
                    onClick={handleOpenSummary}
                    className="absolute left-0 bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-full shadow-lg shadow-violet-900/20 active:scale-90 transition-all"
                    title="Resumen de Ayer"
                >
                    <ScrollText size={20} />
                </button>

                {/* Racha (Centrada) */}
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 py-2 px-6 rounded-full">
                    <Flame size={18} className="text-orange-500 animate-pulse" fill="currentColor" />
                    <span className="text-orange-400 font-bold text-sm">Racha: {user?.streak || 0} días</span>
                </div>
                {/* Botón + (Alineado a la derecha absoluta) */}
                <button
                    onClick={onOpenMissionModal}
                    className="absolute right-0 bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-full shadow-lg shadow-violet-900/20 active:scale-90 transition-all"
                >
                    <Plus size={20} />
                </button>
            </div>

            <DailySummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                data={summaryData}
            />

            {/* Controls */}
            <DashboardControls
                activeFrequency={missionFrequency}
                onFrequencyChange={setMissionFrequency}
            />

            {/* Missions List */}
            <MissionList
                missions={missions}
                frequency={missionFrequency}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onIncrement={handleIncrement}
            />

            {/* Logout */}
            <div className="mt-10 text-center">
                <button
                    onClick={logout}
                    className="text-slate-500 hover:text-red-400 text-xs flex items-center justify-center gap-1 mx-auto"
                >
                    <LogOut size={12} /> Cerrar Sesión
                </button>
            </div>
        </>
    );
}
