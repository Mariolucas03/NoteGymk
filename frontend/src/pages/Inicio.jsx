import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function Inicio() {
    const { addXp } = useUser();
    const [missions, setMissions] = useState([
        { id: 1, title: 'Meditar', xp: 20, completed: false },
        { id: 2, title: 'Ejercicio', xp: 50, completed: false },
        { id: 3, title: 'Leer', xp: 15, completed: false },
        { id: 4, title: 'Estudiar', xp: 40, completed: false },
        { id: 5, title: 'Hidratación', xp: 10, completed: false }
    ]);
    const [newM, setNewM] = useState('');

    const complete = (id) => {
        setMissions(prev => prev.map(m => {
            if (m.id === id && !m.completed) {
                addXp(m.xp, { action: m.title, type: 'misiones' });
                // persist event via backend if desired (omitted here for brevity)
                return { ...m, completed: true };
            }
            return m;
        }));
    };

    const addMission = () => {
        if (!newM.trim()) return;
        const id = missions.length ? Math.max(...missions.map(m => m.id)) + 1 : 1;
        setMissions([...missions, { id, title: newM, xp: 20, completed: false }]);
        setNewM('');
    };

    return (
        <div>
            <h3 className="font-bold">Misiones Diarias</h3>
            <div className="mt-2 space-y-2">
                {missions.map(m => (
                    <div key={m.id} className="flex justify-between items-center">
                        <div className={m.completed ? 'line-through text-gray-400' : ''}>{m.title} (+{m.xp} XP)</div>
                        {!m.completed && <button className="text-blue-500" onClick={() => complete(m.id)}>Completar</button>}
                    </div>
                ))}
            </div>

            <div className="mt-3 flex gap-2">
                <input className="flex-1 p-2 border rounded" value={newM} onChange={e => setNewM(e.target.value)} placeholder="Nueva misión" />
                <button className="bg-blue-500 text-white p-2 rounded" onClick={addMission}>Añadir</button>
            </div>
        </div>
    );
}
