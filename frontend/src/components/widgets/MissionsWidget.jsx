import { useState } from 'react';
import { createPortal } from 'react-dom'; // <--- 1. IMPRESCINDIBLE IMPORTAR ESTO
import { CheckCircle, ChevronRight, X, Trophy, Zap } from 'lucide-react';

export default function MissionsWidget({ stats }) {
    const [showModal, setShowModal] = useState(false);

    // Valores seguros
    const total = stats?.total || 0;
    const completed = stats?.completed || 0;
    const list = stats?.listCompleted || [];
    const percent = total > 0 ? (completed / total) * 100 : 0;

    return (
        <>
            {/* --- PARTE 1: EL WIDGET (LO QUE SE VE EN EL GRID) --- */}
            {/* Este div se queda dentro del grid y se puede arrastrar */}
            <div
                onClick={() => setShowModal(true)}
                className="col-span-2 bg-gradient-to-r from-blue-900/40 to-gray-900 border border-blue-500/30 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden h-40 flex flex-col justify-between group"
            >
                {/* Icono decorativo */}
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <Trophy size={48} />
                </div>

                {/* Header Widget */}
                <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 text-blue-400">
                        <CheckCircle size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Misiones Diarias</span>
                    </div>
                    <div className="bg-blue-600/20 text-blue-300 text-xs font-bold px-2 py-1 rounded-lg z-10">
                        {completed}/{total}
                    </div>
                </div>

                {/* Barra Progreso */}
                <div className="w-full z-10">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
                        <span>Progreso</span>
                        <span>{Math.round(percent)}%</span>
                    </div>
                    <div className="relative w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-out"
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 z-10">
                    <p>{percent === 100 ? "¡Objetivo diario cumplido! 🎉" : "Completa tus hábitos"}</p>
                    <ChevronRight size={14} className="text-gray-600" />
                </div>
            </div>

            {/* --- PARTE 2: EL MODAL (TELETRANSPORTADO) --- */}
            {/* Usamos createPortal para sacarlo del widget y ponerlo en el body */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in">
                    {/* Capa invisible para cerrar al hacer click fuera */}
                    <div className="absolute inset-0" onClick={(e) => { e.stopPropagation(); setShowModal(false); }}></div>

                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl h-[60vh] flex flex-col relative z-10">

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Trophy className="text-yellow-500" /> Misiones de Hoy
                            </h2>
                            <button onClick={() => setShowModal(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {list.length > 0 ? (
                                list.map(mission => (
                                    <div key={mission._id} className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex items-center gap-3">
                                        <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{mission.title}</h4>
                                            <div className="flex gap-2 text-[10px] text-gray-400 mt-1">
                                                <span className="bg-gray-800 px-1.5 py-0.5 rounded uppercase">{mission.frequency === 'daily' ? 'Diaria' : 'Semanal'}</span>
                                                <span className="flex items-center gap-1"><Zap size={10} /> +{mission.xpReward} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-gray-400">Aún no has completado misiones hoy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body // <--- AQUÍ LE DECIMOS QUE SE VAYA AL BODY
            )}
        </>
    );
}