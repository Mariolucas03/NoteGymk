import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function Inicio() {
    const { user, addXp } = useUser();
    
    // Misiones FIJAS
    const defaultMissions = [
        { id: 1, title: 'Ir al Gym', xp: 50, completed: false, type: 'fixed' },
        { id: 2, title: 'Andar 10.000 pasos', xp: 50, completed: false, type: 'fixed' },
        { id: 3, title: 'Leer 15 min', xp: 15, completed: false, type: 'fixed' },
        { id: 4, title: 'Estudiar 30 min', xp: 40, completed: false, type: 'fixed' },
        { id: 5, title: 'Ir a clase', xp: 10, completed: false, type: 'fixed' }
    ];

    const [missions, setMissions] = useState([]);
    const [newM, setNewM] = useState('');

    const saveToCloud = (updatedMissions) => {
        if (!user?.id) return;
        fetch(`${API_BASE_URL}/user/${user.id}/missions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ missions: updatedMissions })
        }).catch(err => console.error("Error guardando misiones", err));
    };

    useEffect(() => {
        if (!user?.id) return;

        fetch(`${API_BASE_URL}/user/${user.id}`)
            .then(res => res.json())
            .then(data => {
                // LÓGICA AUTOMÁTICA:
                // Si hay misiones guardadas, las mostramos.
                if (data.missions && data.missions.length > 0) {
                    setMissions(data.missions);
                } 
                // Si NO hay (usuario nuevo o error), cargamos las fijas y las guardamos SOLOS.
                else {
                    setMissions(defaultMissions);
                    saveToCloud(defaultMissions);
                }
            })
            .catch(err => console.error("Error cargando misiones", err));
    }, [user]);

    const complete = (id) => {
        const updated = missions.map(m => {
            if (m.id === id && !m.completed) {
                addXp(m.xp, { action: m.title, type: 'misiones' });
                return { ...m, completed: true };
            }
            return m;
        });
        setMissions(updated); 
        saveToCloud(updated); 
    };

    const addMission = () => {
        if (!newM.trim()) return;
        const id = missions.length ? Math.max(...missions.map(m => m.id)) + 1 : 1;
        const randomXp = (Math.floor(Math.random() * 8) * 5) + 15;

        const newMission = { 
            id, 
            title: newM, 
            xp: randomXp, 
            completed: false, 
            type: 'temp'
        };

        const updated = [...missions, newMission];
        setMissions(updated); 
        setNewM('');
        saveToCloud(updated);
    };

    return (
        <div>
            <h3 className="font-bold">Objetivos Diarios</h3>
            
            <div className="mt-2 space-y-2">
                {missions.length === 0 && <p className="text-gray-500 text-sm">Cargando misiones...</p>}

                {missions.map(m => (
                    <div key={m.id} className="flex justify-between items-center border-b pb-2">
                        <div className={m.completed ? 'line-through text-gray-400' : ''}>
                            {m.title} <span className="text-sm font-bold text-yellow-600">(+{m.xp} XP)</span>
                            {m.type === 'temp' && <span className="text-xs text-blue-400 ml-2">(Temp)</span>}
                        </div>
                        
                        {!m.completed ? (
                            <button 
                                className="text-blue-500 font-semibold hover:text-blue-700" 
                                onClick={() => complete(m.id)}
                            >
                                Completar
                            </button>
                        ) : (
                            <span className="text-green-500">✅</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-2">
                <input 
                    className="flex-1 p-2 border rounded" 
                    value={newM} 
                    onChange={e => setNewM(e.target.value)} 
                    placeholder="Nuevo objetivo..." 
                    onKeyPress={(e) => e.key === 'Enter' && addMission()} 
                />
                <button 
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold" 
                    onClick={addMission}
                >
                    Añadir
                </button>
            </div>
        </div>
    );
}