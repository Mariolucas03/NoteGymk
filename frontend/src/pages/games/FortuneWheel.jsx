import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, Gift, Flame, Diamond, Lock, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function FortuneWheel() {
    const { user, setUser } = useOutletContext();
    const [selectedMode, setSelectedMode] = useState(null);

    // --- CONFIGURACIÓN DE LAS 3 RULETAS ---
    const WHEEL_CONFIG = {
        daily: {
            title: "Diaria",
            cost: 0,
            color: "from-blue-600 to-cyan-500",
            icon: <Gift size={28} />,
            desc: "Gratis cada 24h.",
            prizes: [
                { label: '10', value: 10, color: '#3b82f6' },
                { label: '50', value: 50, color: '#eab308' },
                { label: '5', value: 5, color: '#6b7280' },
                { label: '25', value: 25, color: '#22c55e' },
                { label: '100', value: 100, color: '#a855f7' },
                { label: '5', value: 5, color: '#6b7280' },
            ]
        },
        hardcore: {
            title: "Hardcore",
            cost: 50,
            color: "from-red-600 to-orange-600",
            icon: <Flame size={28} />,
            desc: "Todo o nada.",
            prizes: [
                { label: '0', value: 0, color: '#1f2937' },
                { label: '0', value: 0, color: '#1f2937' },
                { label: '1K', value: 1000, color: '#ef4444' }, // Jackpot
                { label: '0', value: 0, color: '#1f2937' },
                { label: '0', value: 0, color: '#1f2937' },
                { label: '200', value: 200, color: '#f97316' }, // Recuperas x4
            ]
        },
        premium: {
            title: "Premium",
            cost: 200,
            color: "from-purple-600 to-pink-600",
            icon: <Diamond size={28} />,
            desc: "Premios altos.",
            prizes: [
                { label: '250', value: 250, color: '#a855f7' },
                { label: '300', value: 300, color: '#d946ef' },
                { label: '500', value: 500, color: '#eab308' },
                { label: '210', value: 210, color: '#8b5cf6' },
                { label: '400', value: 400, color: '#ec4899' },
                { label: '1K', value: 1000, color: '#14b8a6' },
            ]
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-white select-none relative overflow-hidden">

            {/* --- BARRA DE NAVEGACIÓN --- */}
            <div className="w-full px-4 py-3 z-20 flex items-center shrink-0 bg-gray-900 shadow-sm">
                {selectedMode ? (
                    <button
                        onClick={() => setSelectedMode(null)}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition active:scale-95 bg-gray-800 px-3 py-2 rounded-lg border border-white/10"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold">Volver</span>
                    </button>
                ) : (
                    <Link
                        to="/games"
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition active:scale-95 bg-gray-800 px-3 py-2 rounded-lg border border-white/10"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold">Juegos</span>
                    </Link>
                )}
            </div>

            {/* --- AREA CENTRAL --- */}
            <div className="flex-grow flex flex-col items-center justify-center w-full px-4 relative overflow-y-auto">
                <div className="w-full h-full flex flex-col items-center justify-center pb-6">

                    {selectedMode ? (
                        <ActiveWheel
                            config={WHEEL_CONFIG[selectedMode]}
                            mode={selectedMode}
                            user={user}
                            setUser={setUser}
                        />
                    ) : (
                        <div className="w-full max-w-sm grid gap-4 animate-in fade-in zoom-in duration-300">
                            <h2 className="text-2xl font-black text-center mb-4 uppercase tracking-widest text-white/80">
                                ELIGE TU RULETA
                            </h2>
                            <MenuCard config={WHEEL_CONFIG.daily} onClick={() => setSelectedMode('daily')} />
                            <MenuCard config={WHEEL_CONFIG.hardcore} onClick={() => setSelectedMode('hardcore')} />
                            <MenuCard config={WHEEL_CONFIG.premium} onClick={() => setSelectedMode('premium')} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- TARJETA DE MENÚ ---
function MenuCard({ config, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-5 rounded-2xl bg-gradient-to-r ${config.color} shadow-lg relative overflow-hidden group flex items-center justify-between border-2 border-white/5 active:scale-95 transition-transform`}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-black/20 p-3 rounded-xl backdrop-blur-sm text-white">
                    {config.icon}
                </div>
                <div className="text-left">
                    <h3 className="text-xl font-black italic uppercase leading-none text-white drop-shadow-md">{config.title}</h3>
                    <p className="text-[11px] text-white/90 font-bold mt-1">{config.desc}</p>
                </div>
            </div>
            <div className="relative z-10">
                <span className="text-lg font-black bg-black/30 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 text-white">
                    {config.cost === 0 ? "FREE" : config.cost}
                </span>
            </div>
            <div className="absolute right-[-20px] top-[-30px] opacity-10 scale-150 rotate-12">
                {config.icon}
            </div>
        </button>
    );
}

// --- LÓGICA DEL JUEGO REAL ---
function ActiveWheel({ config, mode, user, setUser }) {
    const prizes = config.prizes;
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [canDailySpin, setCanDailySpin] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    // Estado para el mensaje de premio
    const [winData, setWinData] = useState(null);

    useEffect(() => {
        if (mode === 'daily') {
            checkDaily();
            const interval = setInterval(checkDaily, 60000);
            return () => clearInterval(interval);
        } else {
            setCanDailySpin(true);
        }
    }, [mode, user.last_daily_spin]);

    const checkDaily = () => {
        if (!user.last_daily_spin) { setCanDailySpin(true); return; }
        const last = new Date(user.last_daily_spin);
        const today = new Date();
        const sameDay = last.getDate() === today.getDate() && last.getMonth() === today.getMonth() && last.getFullYear() === today.getFullYear();

        if (sameDay) {
            setCanDailySpin(false);
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
            const diff = tomorrow - today;
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            setTimeLeft(`${h}h ${m}m`);
        } else {
            setCanDailySpin(true);
        }
    };

    const handleSpin = async () => {
        if (spinning) return;
        if (mode === 'daily' && !canDailySpin) return;
        if (mode !== 'daily' && user.coins < config.cost) return;

        setSpinning(true);
        setWinData(null);

        // ---------------------------------------------------------
        // 1. COBRAR ENTRADA (BASE DE DATOS Y VISUAL)
        // ---------------------------------------------------------
        // Calculamos saldo restante
        const balanceAfterCost = user.coins - config.cost;

        // Actualizamos visualmente
        setUser(prev => ({ ...prev, coins: balanceAfterCost }));

        // Actualizamos en la BASE DE DATOS inmediatamente el cobro
        // Usamos PUT al usuario para fijar el saldo nuevo y evitar que recupere el dinero al recargar
        if (config.cost > 0) {
            try {
                // Usamos el ID del usuario. Asegúrate de si es _id o id en tu sistema.
                const userId = user._id || user.id;
                await api.put(`/users/${userId}`, { coins: balanceAfterCost });
            } catch (error) {
                console.error("Error cobrando entrada en DB:", error);
                // Si falla el cobro, en un sistema real pararíamos, pero aquí seguimos por fluidez
            }
        }

        // ---------------------------------------------------------
        // 2. CÁLCULO DEL PREMIO
        // ---------------------------------------------------------
        const randomIndex = Math.floor(Math.random() * prizes.length);
        const prize = prizes[randomIndex];

        // Matemáticas para centrar
        const segmentAngle = 360 / prizes.length;
        const targetRotation = rotation + 1800 + (360 - (randomIndex * segmentAngle) - (segmentAngle / 2));

        setRotation(targetRotation);

        // ---------------------------------------------------------
        // 3. ENTREGAR PREMIO AL FINALIZAR
        // ---------------------------------------------------------
        setTimeout(async () => {
            setSpinning(false);
            if (mode === 'daily') setCanDailySpin(false);

            // Pop-up visual
            setWinData(prize);

            if (prize.value > 0) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            }

            // Calculamos saldo FINAL (Saldo tras coste + Premio)
            const finalCoins = balanceAfterCost + prize.value;
            const now = new Date().toISOString();

            // Actualización Visual
            setUser(prev => ({
                ...prev,
                coins: finalCoins,
                ...(mode === 'daily' && { last_daily_spin: now })
            }));

            // GUARDAR PREMIO EN BASE DE DATOS
            try {
                if (prize.value > 0) {
                    // Usamos /reward igual que en DiceGame para sumar el premio
                    const { data } = await api.post('/users/reward', { coins: prize.value });
                    // Sincronizamos con la respuesta del servidor por seguridad
                    setUser(prev => ({ ...prev, coins: data.user.coins }));
                }

                // Si es diaria, guardamos también la FECHA
                if (mode === 'daily') {
                    const userId = user._id || user.id;
                    await api.put(`/users/${userId}`, { last_daily_spin: now });
                }
            } catch (e) {
                console.error("Error guardando premio:", e);
            }

            if (mode === 'daily') checkDaily();
        }, 5000);
    };

    const isLocked = mode === 'daily' && !canDailySpin;
    const canAfford = user.coins >= config.cost;

    return (
        <div className="flex flex-col items-center justify-between h-full w-full py-4 relative">

            {/* Header Texto */}
            <div className={`text-center animate-in slide-in-from-top-4 flex-none`}>
                <h2 className={`text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-b ${config.color}`}>
                    {config.title}
                </h2>
                {isLocked && <p className="text-xs text-gray-400 font-mono mt-1">Próximo giro: {timeLeft}</p>}
            </div>

            {/* --- RUEDA --- */}
            <div className="relative flex items-center justify-center flex-grow w-full py-2">
                <div className="absolute top-0 z-30 text-white text-4xl filter drop-shadow-[0_4px_2px_rgba(0,0,0,0.5)]">▼</div>

                <div
                    className="w-[85vw] h-[85vw] max-w-[340px] max-h-[340px] rounded-full border-4 border-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative bg-gray-900"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: spinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                    }}
                >
                    <div className="w-full h-full absolute inset-0" style={{
                        background: `conic-gradient(${prizes.map((p, i) => `${p.color} ${(i * 100) / prizes.length}% ${((i + 1) * 100) / prizes.length}%`).join(', ')})`
                    }}></div>

                    {prizes.map((p, i) => (
                        <div
                            key={i}
                            className="absolute top-0 left-1/2 w-0 h-[50%] origin-bottom flex justify-center pt-8"
                            style={{
                                transform: `rotate(${(i * 360) / prizes.length + (360 / prizes.length / 2)}deg)`
                            }}
                        >
                            <span className="text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] transform -translate-x-1/2">
                                {p.label}
                            </span>
                        </div>
                    ))}

                    <div className="absolute inset-0 m-auto w-14 h-14 bg-gray-800 rounded-full border-4 border-gray-700 shadow-inner flex items-center justify-center text-white">
                        {config.icon}
                    </div>
                </div>
            </div>

            {/* --- BOTÓN DE ACCIÓN --- */}
            <div className="w-full max-w-xs animate-in slide-in-from-bottom-4 flex-none pb-2">
                {isLocked ? (
                    <button disabled className="w-full py-4 rounded-2xl bg-gray-800 border border-gray-700 text-gray-400 font-bold flex items-center justify-center gap-2">
                        <Lock size={18} /> VUELVE MAÑANA
                    </button>
                ) : (
                    <button
                        onClick={handleSpin}
                        disabled={spinning || !canAfford}
                        className={`
                            w-full py-4 rounded-2xl font-black text-xl shadow-xl transition-transform active:scale-95
                            ${spinning || !canAfford
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : `bg-gradient-to-r ${config.color} text-white hover:scale-105`
                            }
                        `}
                    >
                        {spinning ? 'GIRANDO...' : config.cost === 0 ? '¡GIRAR GRATIS!' : `GIRAR (${config.cost})`}
                    </button>
                )}
                {!canAfford && !spinning && !isLocked && (
                    <p className="text-center text-xs text-red-400 font-bold mt-2">Saldo insuficiente</p>
                )}
            </div>

            {/* --- POP-UP DE PREMIO --- */}
            {winData && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-gray-800 rounded-3xl p-8 border-2 border-yellow-500/50 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full relative animate-in zoom-in-95">
                        <button onClick={() => setWinData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>

                        <div className="text-6xl mb-2">🎉</div>
                        <h3 className="text-2xl font-black text-white uppercase text-center">¡PREMIO CONSEGUIDO!</h3>

                        <div className="bg-gray-900/50 rounded-xl p-4 w-full text-center border border-white/5">
                            <span className="text-4xl font-black text-yellow-400 drop-shadow-md">
                                {winData.value > 0 ? `+${winData.value}` : '0'}
                            </span>
                            <span className="text-xl ml-2 text-yellow-200">💰</span>
                        </div>

                        <p className="text-gray-400 text-sm text-center">
                            {winData.value > 0 ? "Las monedas se han añadido a tu cuenta." : "Vaya... ¡Mejor suerte la próxima vez!"}
                        </p>

                        <button
                            onClick={() => setWinData(null)}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl mt-2 transition-colors"
                        >
                            ACEPTAR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}