import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// Componentes
import Header from './components/Header'; // Asumo que este archivo existe y está bien
import Inicio from './pages/Inicio';
import Objetivos from './pages/Objetivos';
import Gym from './pages/Gym';
import Tienda from './pages/Tienda';
import Perfil from './pages/Perfil';

export default function App() {
    // Usamos este hook para saber en qué página estamos y pintar el icono de azul
    const location = useLocation();

    // Función auxiliar para saber si un botón está activo
    const isActive = (path) => location.pathname === path ? "text-blue-600" : "text-gray-400";

    return (
        // Mantengo tu estilo de contenedor móvil (max-w-md)
        <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-100">
            
            {/* CABECERA */}
            <Header />

            {/* CONTENIDO PRINCIPAL (Donde cambian las páginas) */}
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                <Routes>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/objetivos" element={<Objetivos />} />
                    <Route path="/gym" element={<Gym />} />
                    <Route path="/tienda" element={<Tienda />} />
                    <Route path="/perfil" element={<Perfil />} />
                    {/* Si alguien entra a una ruta rara, le mandamos al inicio */}
                    <Route path="*" element={<Inicio />} />
                </Routes>
            </main>

            {/* BARRA DE NAVEGACIÓN INFERIOR (Fija abajo) */}
            <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-3 pb-5 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-50">
                
                {/* Botón INICIO */}
                <Link to="/" className={`flex flex-col items-center text-xs font-bold transition-colors ${isActive('/')}`}>
                    <span className="text-xl mb-1">🏠</span>
                    Inicio
                </Link>

                {/* Botón OBJETIVOS */}
                <Link to="/objetivos" className={`flex flex-col items-center text-xs font-bold transition-colors ${isActive('/objetivos')}`}>
                    <span className="text-xl mb-1">🎯</span>
                    Objetivos
                </Link>

                {/* Botón GYM */}
                <Link to="/gym" className={`flex flex-col items-center text-xs font-bold transition-colors ${isActive('/gym')}`}>
                    <span className="text-xl mb-1">💪</span>
                    Gym
                </Link>

                {/* Botón TIENDA */}
                <Link to="/tienda" className={`flex flex-col items-center text-xs font-bold transition-colors ${isActive('/tienda')}`}>
                    <span className="text-xl mb-1">🛒</span>
                    Tienda
                </Link>

                {/* Botón PERFIL */}
                <Link to="/perfil" className={`flex flex-col items-center text-xs font-bold transition-colors ${isActive('/perfil')}`}>
                    <span className="text-xl mb-1">👤</span>
                    Perfil
                </Link>

            </nav>
        </div>
    );
}