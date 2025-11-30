import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function Objetivos() {
    const { addXp } = useUser();
    const [tab, setTab] = useState('semanal');
    const [objectives, setObjectives] = useState([
        { id: 1, title: 'Meta Semanal', xp: 100, type: 'semanal', completed: false },
        { id: 2, title: 'Meta Mensual', xp: 500, type: 'mensual', completed: false },
        { id: 3, title: 'Meta Anual', xp: 2000, type: 'anual', completed: false }
    ]);
    const [newObj, setNewObj] = useState('');

    const complete = (id) => {
        setObjectives(prev => prev.map(o => {
            if (o.id === id && !o.completed) {
                addXp(o.xp, { action: o.title, type: 'objetivo' });
                return { ...o, completed: true };
            }
            return o;
        }));
    };

    const addObjective = () => {
        if (!newObj.trim()) return;
        const id = objectives.length ? Math.max(...objectives.map(o => o.id)) + 1 : 1;
        setObjectives([...objectives, { id, title: newObj, xp: 50, type: tab, completed: false }]);
        setNewObj('');
    };

    return (
        <section>
            <h3 className="font-bold">Objetivos</h3>
            <div className="flex gap-2 mt-2">
                <button onClick={() => setTab('semanal')} className={`flex-1 p-2 ${tab === 'semanal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Semanal</button>
                <button onClick={() => setTab('mensual')} className={`flex-1 p-2 ${tab === 'mensual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Mensual</button>
                <button onClick={() => setTab('anual')} className={`flex-1 p-2 ${tab === 'anual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Anual</button>
            </div>

            <div className="mt-3">
                {objectives.filter(o => o.type === tab).map(o => (
                    <div key={o.id} className="flex justify-between items-center mt-2">
                        <div className={o.completed ? 'line-through text-gray-400' : ''}>{o.title} (+{o.xp} XP)</div>
                        {!o.completed && <button className="text-blue-500" onClick={() => complete(o.id)}>Completar</button>}
                    </div>
                ))}
                <div className="mt-3 flex gap-2">
                    <input className="flex-1 p-2 border rounded" placeholder="Nuevo objetivo" value={newObj} onChange={e => setNewObj(e.target.value)} />
                    <button className="p-2 bg-blue-500 text-white rounded" onClick={addObjective}>Añadir</button>
                </div>
            </div>
        </section>
    );
}
