import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function Perfil() {
    const { user } = useUser();
    const [selectedDate, setSelectedDate] = useState('');
    const [events, setEvents] = useState([]);

    useEffect(() => {
        async function load() {
            // Protección: Si no hay usuario cargado aún, no hacemos nada
            if (!user?.id) return; 

            try {
                const res = await fetch(`${API_BASE_URL}/user/${user.id}/events`);
                
                // Si el servidor da error, mostramos lista vacía en vez de romper la web
                if (!res.ok) {
                    console.warn("No se pudieron cargar eventos:", res.status);
                    setEvents([]); 
                    return;
                }

                const data = await res.json();
                // Aseguramos que data sea siempre un array
                setEvents(Array.isArray(data) ? data : []);
            } catch (e) { 
                console.error("Error de conexión:", e);
                setEvents([]); 
            }
        }
        load();
    }, [user]); 

    // Filtro seguro: (events || []) evita que la web se ponga en blanco si events es null
    const eventsForDate = selectedDate 
        ? (events || []).filter(ev => ev.date === selectedDate) 
        : [];

    return (
        <section>
            <h3 className="font-bold mb-4">Perfil</h3>

            <div className="border p-3 rounded flex justify-between items-center shadow-sm">
                <div>
                    {/* Usamos 'user?.' para proteger la carga inicial */}
                    <div className="font-medium text-lg">{user?.name}</div>
                    <div className="text-sm text-gray-600">Nivel: {user?.level}</div>
                    <div className="text-sm text-gray-600">XP: {user?.xp}</div>
                    <div className="text-sm text-gray-600">Monedas: {user?.coins}</div>
                    <div className="text-sm text-gray-600">Vidas: {user?.lives}</div>
                </div>
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl">
                    👤
                </div>
            </div>

            <div className="mt-6">
                <div className="font-semibold text-lg">Calendario de Actividad</div>
                <input 
                    type="date" 
                    className="border p-2 rounded mt-2 w-full" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                />
                
                <div className="mt-4 bg-gray-50 p-3 rounded min-h-[100px]">
                    {selectedDate ? (
                        eventsForDate.length ? (
                            <ul className="space-y-2">
                                {eventsForDate.map((ev, i) => (
                                    <li key={i} className="bg-white p-2 rounded border shadow-sm text-sm">
                                        {ev.type === 'gym' && <span className="text-blue-600 font-bold">💪 Gym ({ev.group})</span>}
                                        {ev.type === 'compra' && <span className="text-green-600 font-bold">🛒 Compra: {ev.item} (-{ev.cost}💰)</span>}
                                        {ev.type === 'misiones' && <span className="text-purple-600 font-bold">📜 Misión: {ev.name}</span>}
                                        {ev.type === 'objetivo' && <span className="text-orange-600 font-bold">🎯 Objetivo: {ev.name}</span>}
                                        {ev.type === 'xp' && <span className="text-yellow-600 font-bold">⭐ +{ev.amount} XP {ev.meta?.action ? `(${ev.meta.action})` : ''}</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : <div className="text-gray-500 text-center py-4">No hay actividades registradas este día.</div>
                    ) : <div className="text-gray-500 text-center py-4">Selecciona una fecha para ver tu historial.</div>}
                </div>
            </div>
        </section>
    );
}