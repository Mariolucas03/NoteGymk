import React from 'react';
import MissionCard from './MissionCard';

export default function MissionList({ missions, frequency, onComplete, onDelete, onIncrement }) {
    const filteredMissions = missions.filter(m => m.frequency === frequency);

    if (filteredMissions.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 text-sm">
                <p>No hay misiones {frequency === 'daily' ? 'fijas' : frequency + 'es'}.</p>
                <p>¡Añade una para empezar!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {filteredMissions.map(mission => (
                <MissionCard
                    key={mission._id}
                    mission={{ ...mission, id: mission._id }}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onIncrement={onIncrement}
                />
            ))}
        </div>
    );
}
