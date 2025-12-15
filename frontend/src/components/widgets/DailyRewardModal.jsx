import { useEffect } from 'react';
import { X, Lock, Check, XCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getRewardForDay } from '../../utils/rewardsGenerator';

export default function DailyRewardModal({ data, onClose }) {
    const isViewOnly = data?.isViewOnly || false;
    const currentDay = data?.currentDay || 1;
    const claimedDays = data?.claimedDays || [];
    const buttonText = data?.buttonText || "CERRAR";

    // Confeti solo si acabamos de reclamar (no en modo solo lectura)
    useEffect(() => {
        if (!isViewOnly) {
            const duration = 2000;
            const end = Date.now() + duration;
            const frame = () => {
                confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 } });
                confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 } });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
        }
    }, [isViewOnly]);

    if (!data) return null;

    // --- LÓGICA DE VENTANA FIJA ---
    // Calculamos el rango de 5 días para mostrar.
    // Intentamos que "HOY" esté en el medio (posición 3), 
    // pero si es el día 1 o 2, ajustamos para empezar siempre desde el 1.
    let startDay = currentDay - 2;
    if (startDay < 1) startDay = 1;

    const daysToShow = [];
    for (let i = 0; i < 5; i++) {
        daysToShow.push(startDay + i);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-3xl p-6 relative shadow-2xl flex flex-col items-center">

                {/* Botón cerrar */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                {/* Título y Mensaje */}
                <h2 className="text-2xl font-black text-white uppercase italic tracking-wider mb-1 text-center">
                    {data.message}
                </h2>
                <p className="text-gray-400 text-xs mb-8 text-center">
                    {data.subMessage}
                </p>

                {/* --- TIRA DE CALENDARIO --- */}
                <div className="flex justify-center items-end gap-2 w-full mb-8 overflow-x-auto pb-4 px-2 no-scrollbar">
                    {daysToShow.map((day) => {
                        const reward = getRewardForDay(day);

                        // ESTADOS LÓGICOS
                        const isToday = day === currentDay;
                        const isClaimed = claimedDays.includes(day);
                        // "Perdido" si es un día anterior a hoy y no está reclamado
                        const isMissed = day < currentDay && !isClaimed;

                        // ESTILOS DINÁMICOS
                        let bgClass = "bg-gray-800 border-gray-700"; // Futuro (Default)
                        let textClass = "text-gray-500";
                        let statusIcon = <Lock size={12} />;
                        let scaleClass = "scale-90 opacity-60"; // Pequeño y apagado

                        if (isToday) {
                            // HOY: Azul, Grande, Brillante
                            bgClass = "bg-blue-900/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]";
                            textClass = "text-white";
                            statusIcon = <div className="text-[9px] font-bold bg-blue-600 px-2 rounded-full text-white shadow-sm">HOY</div>;
                            scaleClass = "scale-110 z-10 mx-1 opacity-100";
                        }
                        else if (isClaimed) {
                            // RECLAMADO: Verde
                            bgClass = "bg-green-900/20 border-green-500/50";
                            textClass = "text-green-400";
                            statusIcon = <Check size={14} className="text-green-500" />;
                            scaleClass = "scale-95 opacity-80";
                        }
                        else if (isMissed) {
                            // PERDIDO: Rojo
                            bgClass = "bg-red-900/10 border-red-500/30";
                            textClass = "text-red-400";
                            statusIcon = <XCircle size={14} className="text-red-500" />;
                            scaleClass = "scale-95 opacity-60 grayscale-[0.5]";
                        }

                        return (
                            <div key={day} className={`
                                flex flex-col items-center justify-between p-3 rounded-2xl border-2 min-w-[70px] h-[110px] transition-all duration-300
                                ${bgClass} ${scaleClass}
                            `}>
                                {/* Cabecera Día */}
                                <span className={`text-[10px] font-bold uppercase ${textClass}`}>Día {day}</span>

                                {/* Icono Premio (Siempre visible) */}
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-2xl filter drop-shadow-lg">{reward.icon || '💰'}</span>

                                    <div className="flex flex-col items-center leading-tight">
                                        {/* Monedas */}
                                        <span className={`text-xs font-bold ${isMissed ? 'text-gray-500 line-through' : 'text-yellow-400'}`}>
                                            {reward.coins}
                                        </span>
                                        {/* XP */}
                                        <span className={`text-[8px] font-bold ${isMissed ? 'text-gray-600' : 'text-blue-400'}`}>
                                            +{reward.xp} XP
                                        </span>
                                    </div>
                                </div>

                                {/* Icono Estado Inferior */}
                                <div className="mt-1 h-4 flex items-center justify-center">
                                    {statusIcon}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Botón Acción */}
                <button
                    onClick={onClose}
                    className={`w-full max-w-xs py-3 rounded-xl text-lg font-black transition-all active:scale-95 ${isViewOnly
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        }`}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
}