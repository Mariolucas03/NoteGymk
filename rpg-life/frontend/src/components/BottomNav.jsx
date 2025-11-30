import React from 'react';

export default function BottomNav({ setActive }) {
    return (
        <nav className="bg-white p-2 shadow fixed bottom-0 left-0 right-0 max-w-md mx-auto flex">
            <button onClick={() => setActive('inicio')} className="flex-1">Inicio</button>
            <button onClick={() => setActive('objetivos')} className="flex-1">Objetivos</button>
            <button onClick={() => setActive('gym')} className="flex-1">Gym</button>
            <button onClick={() => setActive('tienda')} className="flex-1">Tienda</button>
            <button onClick={() => setActive('perfil')} className="flex-1">Perfil</button>
        </nav>
    );
}
