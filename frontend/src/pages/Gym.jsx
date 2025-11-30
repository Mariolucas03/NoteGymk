import React, { useState } from 'react';
import GrupoMuscular from './GrupoMuscular';

export default function Gym() {
    const [group, setGroup] = useState(null);

    if (!group) {
        return (
            <section>
                <h3 className="font-bold">Gym</h3>
                <div className="flex flex-col gap-3 mt-3">
                    <button className="p-3 bg-blue-500 text-white rounded" onClick={() => setGroup('Pecho/Hombro/Triceps')}>Pecho / Hombro / Tríceps</button>
                    <button className="p-3 bg-green-500 text-white rounded" onClick={() => setGroup('Biceps/Espalda')}>Bíceps / Espalda</button>
                    <button className="p-3 bg-yellow-500 text-white rounded" onClick={() => setGroup('Pierna/Abdomen')}>Pierna / Abdomen</button>
                </div>
            </section>
        );
    }

    return <GrupoMuscular group={group} goBack={() => setGroup(null)} />;
}
