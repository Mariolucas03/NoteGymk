import React from 'react';

export default function DashboardControls({ activeFrequency, onFrequencyChange }) {
    return (
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 mb-4">
            <div className="grid grid-cols-4 gap-1">
                {['daily', 'weekly', 'monthly', 'annual'].map((freq) => (
                    <button
                        key={freq}
                        onClick={() => onFrequencyChange(freq)}
                        className={`w-full py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeFrequency === freq
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        {freq === 'daily' ? 'Diaria' :
                            freq === 'weekly' ? 'Semanal' :
                                freq === 'monthly' ? 'Mensual' : 'Anual'}
                    </button>
                ))}
            </div>
        </div>
    );
}
