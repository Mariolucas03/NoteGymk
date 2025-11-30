import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function GrupoMuscular({ group, goBack }) {
    const { addXp, user } = useUser();
    const [exercises, setExercises] = useState([
        { name: '', sets: [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }] }
    ]);
    const [duration, setDuration] = useState(0);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        let t;
        if (running) t = setInterval(() => setDuration(d => d + 1), 1000);
        return () => clearInterval(t);
    }, [running]);

    const handleSetChange = (exIdx, setIdx, field, value) => {
        const arr = [...exercises]; arr[exIdx].sets[setIdx][field] = value; setExercises(arr);
    };
    const handleName = (i, val) => { const arr = [...exercises]; arr[i].name = val; setExercises(arr); };
    const addExercise = () => setExercises([...exercises, { name: '', sets: [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }] }]);

    const save = async () => {
        const date = new Date().toISOString().split('T')[0];
        const body = { date, group, exercises, duration };
        try {
            await fetch(`${API_BASE_URL}/user/${user.id}/gym`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            addXp(50, { action: 'gym', group });
            alert('Entrenamiento guardado');
            goBack();
        } catch (e) { console.error(e); alert('No se pudo guardar'); }
    };

    return (
        <section>
            <button onClick={goBack} className="text-blue-500">← Volver</button>
            <h3 className="font-bold mt-2">{group}</h3>
            <p>Duración: {Math.floor(duration / 60).toString().padStart(2, '0')}:{(duration % 60).toString().padStart(2, '0')}</p>
            <button className="p-2 bg-gray-300 rounded" onClick={() => setRunning(r => !r)}>{running ? 'Pausar' : 'Iniciar'}</button>

            <div className="mt-3 space-y-2">
                {exercises.map((ex, i) => (
                    <div key={i} className="border p-2 rounded">
                        <input className="w-full p-2 border rounded mb-2" value={ex.name} onChange={e => handleName(i, e.target.value)} placeholder="Ejercicio" />
                        {ex.sets.map((s, si) => (
                            <div key={si} className="flex gap-2 mb-1">
                                <input className="w-24 p-2 border rounded" value={s.weight} onChange={e => handleSetChange(i, si, 'weight', e.target.value)} placeholder={`Peso set ${si + 1}`} />
                                <input className="w-24 p-2 border rounded" value={s.reps} onChange={e => handleSetChange(i, si, 'reps', e.target.value)} placeholder={`Reps set ${si + 1}`} />
                            </div>
                        ))}
                    </div>
                ))}
                <button className="p-2 bg-green-500 text-white rounded" onClick={addExercise}>+ Añadir ejercicio</button>
            </div>

            <button className="mt-4 p-3 bg-blue-500 text-white rounded w-full" onClick={save}>Guardar entrenamiento</button>
        </section>
    );
}
