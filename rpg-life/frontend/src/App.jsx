import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Inicio from './pages/Inicio';
import Objetivos from './pages/Objetivos';
import Gym from './pages/Gym';
import Tienda from './pages/Tienda';
import Perfil from './pages/Perfil';

export default function App() {
    const [active, setActive] = useState('inicio');

    function renderSection() {
        switch (active) {
            case 'inicio': return <Inicio />;
            case 'objetivos': return <Objetivos />;
            case 'gym': return <Gym />;
            case 'tienda': return <Tienda />;
            case 'perfil': return <Perfil />;
            default: return <Inicio />;
        }
    }

    return (
        <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-100">
            <Header />
            <main className="flex-1 overflow-auto p-4">
                {renderSection()}
            </main>
            <BottomNav setActive={setActive} />
        </div>
    );
}
