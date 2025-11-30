import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function Perfil() {
    const { user } = useUser();
    const [selectedDate, setSelectedDate] = useState('');
    const [events, setEvents] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${API_BASE_URL}/user/${user.id}/events`);
                const data = await res.json();
                setEvents(data || []);
            } catch (e) { console.error(e); }
        }
        load();
    }, [user.id]);

    const eventsForDate = selectedDate ? events.filter(ev => ev.date === selectedDate) : [];

    return (
        <section>
            <h3 className="font-bold">Perfil</h3>
            <div className="border p-3 rounded flex justify-between items-center">
                <div>
                    <div>Nombre: {user.name}</div>
                    <div>Nivel: {user.level}</div>
                    <div>XP: {user.xp}</div>
                    <div>Monedas: {user.coins}</div>
                    <div>Vidas: {user.lives}</div>
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
