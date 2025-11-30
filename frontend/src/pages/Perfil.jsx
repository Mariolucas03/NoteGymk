import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function Perfil() {
    const { user } = useUser();
    const [selectedDate, setSelectedDate] = useState('');
    const [events, setEvents] = useState([]);

    // --- FUNCIÓN TEMPORAL PARA CREAR USUARIO EN LA NUBE ---
    const crearUsuario = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: "user_1",
                    name: "Ana Garcia",
                    xp: 0,
                    level: 1,
                    coins: 200,
                    lives: 3
                })
            });
            if (res.ok) {
                alert("¡ÉXITO! Usuario user_1 creado en la nube. Ahora recarga la página.");
            } else {
                alert("Error al crear. Mira la consola.");
                console.error(await res.text());
            }
        } catch (e) {
            alert("Error de conexión: " + e);
        }
    };
    // ------------------------------------------------------

    useEffect(() => {
        async function load() {
            if (!user?.id) return; 

            try {
                const res = await fetch(`${API_BASE_URL}/user/${user.id}/events`);
                
                if (!res.ok) {
                    console.warn("Error cargando eventos, servidor respondió:", res.status);
                    setEvents([]); 
                    return;
                }

                const data = await res.json();
                setEvents(Array.isArray(data) ? data : []);
            } catch (e) { 
                console.error("Error de conexión:", e);
                setEvents([]); 
            }
        }
        load();
    }, [user]); 

    const eventsForDate = selectedDate 
        ? (events || []).filter(ev => ev.date === selectedDate) 
        : [];

    return (
        <section>
            <h3 className="font-bold">Perfil</h3>

            {/* --- BOTÓN DE SOCORRO --- */}
            <button 
                onClick={crearUsuario} 
                className="bg-red-600 text-white font-bold p-3 rounded w-full mb-4 shadow-lg hover:bg-red-700 transition-colors"
            >
                ⚠️ PULSA ESTO 1 VEZ PARA CREAR EL USUARIO
            </button>
            {/* ------------------------ */}

            <div className="border p-3 rounded flex justify-between items-center">
                <div>
                    <div>Nombre: {user?.name}</div>
                    <div>Nivel: {user?.level}</div>
                    <div>XP: {user?.xp}</div>
                    <div>Monedas: {user?.coins}</div>
                    <div>Vidas: {user?.lives}</div>
                </div>
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            </div>

            <div className="mt-3">
                <div className="font-semibold">Calendario</div>
                <input type="date" className="border p-2 rounded mt-2" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                <div className="mt-2">
                    {selectedDate ? (
                        eventsForDate.length ? (
                            <ul>
                                {eventsForDate.map((ev, i) => (
                                    <li key={i}>
                                        {ev.type === 'gym' && <>Gym ({ev.group})</>}
                                        {ev.type === 'compra' && <>Compra: {ev.item} ({ev.cost} 💰)</>}
                                        {ev.type === 'misiones' && <>Misión completada: {ev.name}</>}
                                        {ev.type === 'objetivo' && <>Objetivo completado: {ev.name}</>}
                                        {ev.type === 'xp' && <>XP: {ev.amount} · {ev.meta && ev.meta.action}</>}
                                    </li>
                                ))}
                            </ul>
                        ) : <div>No hay actividades para esta fecha.</div>
                    ) : <div>Selecciona una fecha para ver actividades.</div>}
                </div>
            </div>
        </section>
    );
}