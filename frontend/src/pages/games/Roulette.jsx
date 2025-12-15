import { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, History, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function Roulette() {
    const { user, setUser } = useOutletContext();

    // --- CONFIGURACIÓN (Ruleta Europea Estándar) ---
    const WHEEL_NUMBERS = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
    const CHIPS = [1, 5, 10, 25, 100, 500];
    const SEGMENT_ANGLE = 360 / 37;

    // --- ESTADOS ---
    const [selectedChip, setSelectedChip] = useState(5);
    const [bets, setBets] = useState({});
    const [totalBet, setTotalBet] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [history, setHistory] = useState([]);

    // Panel de apuestas (Drawer)
    const [showBetTable, setShowBetTable] = useState(false);

    // Animación Física
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);
    const [ballStage, setBallStage] = useState('idle'); // idle, spinning, dropping

    const requestRef = useRef();

    // --- ANIMACIÓN DE GIRO LENTO (IDLE) ---
    // Mantiene la ruleta viva cuando no se juega
    useEffect(() => {
        if (!spinning) {
            const animate = () => {
                setWheelRotation(prev => prev + 0.02); // Giro muy lento elegante
                setBallRotation(prev => prev + 0.02);
                requestRef.current = requestAnimationFrame(animate);
            };
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [spinning]);

    // --- HELPERS ---
    const getNumberColor = (num) => {
        if (num === 0) return 'green';
        const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        return redNums.includes(num) ? 'red' : 'black';
    };

    // --- LÓGICA DE APUESTAS ---
    const placeBet = (spot) => {
        if (spinning) return;
        if (!user) return;

        // Comprobación de saldo estricta
        if (user.coins < totalBet + selectedChip) {
            // Feedback visual de error
            const chipBtn = document.getElementById(`chip-${selectedChip}`);
            if (chipBtn) {
                chipBtn.classList.add('animate-pulse', 'ring-2', 'ring-red-500');
                setTimeout(() => chipBtn.classList.remove('animate-pulse', 'ring-2', 'ring-red-500'), 500);
            }
            return;
        }

        setBets(prev => ({ ...prev, [spot]: (prev[spot] || 0) + selectedChip }));
        setTotalBet(prev => prev + selectedChip);
    };

    const clearBets = () => {
        if (spinning) return;
        setBets({});
        setTotalBet(0);
    };

    // --- LÓGICA DE GIRO (CORE) ---
    const spinWheel = () => {
        if (spinning || totalBet === 0 || !user) return;

        setSpinning(true);
        setLastResult(null);
        setBallStage('spinning');
        setShowBetTable(false); // Cerramos panel para ver la acción

        // 1. ECONOMÍA: Cobro Visual Inmediato (Objeto Directo)
        const balanceAfterBet = user.coins - totalBet;
        setUser({ coins: balanceAfterBet });

        // 2. API SYNC (Background)
        api.post('/users/reward', { coins: -totalBet }).catch(err => console.error("Error cobrando apuesta:", err));

        // 3. CÁLCULO FÍSICO
        const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
        const winningNumber = WHEEL_NUMBERS[randomIndex];

        // Matemáticas de aterrizaje:
        // El ángulo objetivo alinea el número ganador con la parte superior (0 grados visuales)
        // Añadimos muchas vueltas (rotaciones completas) para la animación
        const angleToWinner = (randomIndex * SEGMENT_ANGLE);
        const wheelSpins = 5 * 360;
        const ballSpins = 8 * 360; // La bola da más vueltas que la rueda (contrarrotación)

        // Ajustamos la rotación actual para que no "salte" hacia atrás
        const currentRotMod = wheelRotation % 360;
        const targetWheelRot = wheelRotation + wheelSpins + (360 - currentRotMod) + (360 - angleToWinner);

        // La bola gira en sentido contrario (negativo)
        const targetBallRot = ballRotation - ballSpins;

        setWheelRotation(targetWheelRot);
        setBallRotation(targetBallRot);

        // Fase de caída de la bola (timing manual para simular gravedad)
        setTimeout(() => setBallStage('dropping'), 3000);

        // 4. FIN DEL JUEGO Y PREMIOS
        setTimeout(async () => {
            setSpinning(false);
            setBallStage('idle');
            setLastResult(winningNumber);
            setHistory(prev => [winningNumber, ...prev].slice(0, 8));

            let winnings = 0;
            const winningColor = getNumberColor(winningNumber);

            // Cálculo de ganancias
            Object.entries(bets).forEach(([spot, amount]) => {
                const numSpot = parseInt(spot);

                // Pleno (x36)
                if (!isNaN(numSpot) && numSpot === winningNumber) winnings += amount * 36;
                // Colores (x2)
                else if (spot === 'red' && winningColor === 'red') winnings += amount * 2;
                else if (spot === 'black' && winningColor === 'black') winnings += amount * 2;
                // Par/Impar (x2)
                else if (spot === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) winnings += amount * 2;
                else if (spot === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) winnings += amount * 2;
                // Mitades (x2)
                else if (spot === '1-18' && winningNumber >= 1 && winningNumber <= 18) winnings += amount * 2;
                else if (spot === '19-36' && winningNumber >= 19 && winningNumber <= 36) winnings += amount * 2;
                // Docenas (x3)
                else if (spot === '1st12' && winningNumber >= 1 && winningNumber <= 12) winnings += amount * 3;
                else if (spot === '2nd12' && winningNumber >= 13 && winningNumber <= 24) winnings += amount * 3;
                else if (spot === '3rd12' && winningNumber >= 25 && winningNumber <= 36) winnings += amount * 3;
            });

            if (winnings > 0) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500'] });

                // Actualizar saldo con premio (Balance previo calculado + Ganancia)
                setUser({ coins: balanceAfterBet + winnings });

                // Guardar premio en DB
                try {
                    await api.post('/users/reward', { coins: winnings, xp: 15 });
                } catch (e) { console.error(e); }
            }

            setBets({});
            setTotalBet(0);
        }, 5000); // Duración total de la animación
    };

    // --- COMPONENTES UI ---

    const ChipSelector = () => (
        <div className="flex gap-2 justify-center py-2 bg-black/20 rounded-xl mb-2 overflow-x-auto no-scrollbar relative z-50 pointer-events-auto">
            {CHIPS.map(val => (
                <button
                    id={`chip-${val}`}
                    key={val}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedChip(val); }}
                    className={`relative shrink-0 w-11 h-11 rounded-full border-[3px] border-dashed flex items-center justify-center font-black text-[10px] shadow-xl transition-transform active:scale-95 cursor-pointer z-50 
                    ${val === 1 ? 'bg-white border-gray-300 text-gray-800' : ''} 
                    ${val === 5 ? 'bg-red-600 border-red-800 text-white' : ''} 
                    ${val === 10 ? 'bg-blue-600 border-blue-800 text-white' : ''} 
                    ${val === 25 ? 'bg-green-600 border-green-800 text-white' : ''} 
                    ${val === 100 ? 'bg-gray-900 border-yellow-500 text-yellow-500' : ''} 
                    ${val === 500 ? 'bg-purple-900 border-pink-500 text-pink-300' : ''} 
                    ${selectedChip === val ? 'scale-110 -translate-y-1 ring-2 ring-yellow-400' : 'opacity-80'}`}
                >
                    {val}
                </button>
            ))}
        </div>
    );

    const BoardSpot = ({ label, value, color, colSpan = 1, rowSpan = 1, type = 'number', className = '' }) => {
        const betAmount = bets[value];
        let bgClass = color === 'red' ? 'bg-red-700' : color === 'black' ? 'bg-gray-900' : 'bg-green-700';
        if (type === 'special') bgClass = 'bg-green-900/40 border border-green-500/30 text-green-100 hover:bg-green-800/60';

        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    placeBet(value);
                }}
                className={`relative z-20 rounded border border-black/20 flex items-center justify-center font-bold text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] active:brightness-90 transition-all text-xs cursor-pointer select-none touch-manipulation w-full h-full ${bgClass} ${className}`}
                style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
            >
                {label}
                {betAmount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-bounce-in">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-300 text-black text-[9px] flex items-center justify-center font-black shadow-lg drop-shadow-md transform -translate-y-1">
                            {betAmount}
                        </div>
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-gray-950 text-white overflow-hidden select-none flex flex-col font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black pointer-events-none -z-10"></div>

            {/* TOP BAR */}
            <div className="absolute top-4 left-4 z-40 flex items-center gap-4 pointer-events-auto">
                <Link to="/games" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-md border border-white/5 active:scale-95">
                    <ChevronLeft size={24} />
                </Link>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5 overflow-x-auto max-w-[200px] no-scrollbar">
                    <History size={14} className="text-gray-400 mr-1 shrink-0" />
                    {history.length === 0 && <span className="text-[10px] text-gray-500 whitespace-nowrap">Historial vacío</span>}
                    {history.map((n, i) => (
                        <div key={i} className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border border-white/10 shadow-lg animate-in zoom-in ${getNumberColor(n) === 'red' ? 'bg-red-600' : getNumberColor(n) === 'black' ? 'bg-gray-900' : 'bg-green-600'}`}>{n}</div>
                    ))}
                </div>
            </div>

            {/* AREA RULETA (VISUAL) */}
            <div className="flex-1 flex items-center justify-center relative pb-20 pointer-events-none">
                <div className="relative w-[90vw] h-[90vw] max-w-[450px] max-h-[450px] rounded-full shadow-[0_0_60px_rgba(0,0,0,0.8)] border-[16px] border-[#4a3728] bg-[#2e1d10] pointer-events-auto transition-transform duration-700">

                    {/* Decoración Dorada */}
                    <div className="absolute inset-0 rounded-full border-[2px] border-[#a07820] pointer-events-none z-30 opacity-60"></div>

                    {/* RUEDA GIRATORIA */}
                    <div className="w-full h-full rounded-full relative overflow-hidden"
                        style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            transition: spinning ? 'transform 5s cubic-bezier(0.2, 0.0, 0.2, 1)' : 'none' // Curva Bezier suave
                        }}>

                        {/* Segmentos de color */}
                        <div className="w-full h-full absolute inset-0 z-10"
                            style={{ background: `conic-gradient(${WHEEL_NUMBERS.map((n, i) => { const color = getNumberColor(n) === 'red' ? '#b91c1c' : getNumberColor(n) === 'black' ? '#111' : '#15803d'; const start = i * SEGMENT_ANGLE; const end = (i + 1) * SEGMENT_ANGLE; return `${color} ${start}deg ${end}deg`; }).join(', ')})` }}></div>

                        {/* Números */}
                        {WHEEL_NUMBERS.map((n, i) => (
                            <div key={i} className="absolute top-0 left-1/2 w-[12%] h-[50%] origin-bottom pt-2 flex justify-center z-20" style={{ transform: `translateX(-50%) rotate(${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg)` }}>
                                <span className="text-white font-bold text-lg sm:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">{n}</span>
                            </div>
                        ))}

                        {/* Centro de la rueda */}
                        <div className="absolute inset-0 m-auto w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[#2a2a2a] to-black border-[8px] border-[#444] shadow-2xl flex items-center justify-center z-50">
                            {lastResult !== null && !spinning && (
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 animate-in zoom-in duration-300 shadow-xl ${getNumberColor(lastResult) === 'red' ? 'bg-red-600 border-red-800' : getNumberColor(lastResult) === 'black' ? 'bg-black border-gray-700' : 'bg-green-600 border-green-800'}`}>
                                    <span className="text-3xl font-black text-white">{lastResult}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOLA (Capa Superior) */}
                    <div className="absolute inset-0 pointer-events-none z-40"
                        style={{
                            transform: `rotate(${ballRotation}deg)`,
                            transition: spinning ? 'transform 5s cubic-bezier(0.2, 0.0, 0.2, 1)' : 'none'
                        }}>
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full transition-all duration-1000 ease-out 
                            ${ballStage === 'dropping' ? 'p-[45px] sm:p-[60px]' : 'p-[15px]'}`}>
                            <div className="mx-auto w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] border border-gray-200"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTÓN FLOTANTE JUGAR */}
            {!showBetTable && !spinning && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs px-4 pointer-events-auto animate-in slide-in-from-bottom-4">
                    <button onClick={() => setShowBetTable(true)} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-4 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-yellow-400">
                        {totalBet > 0 ? `APOSTAR (${totalBet})` : 'JUGAR / APOSTAR'}
                        <Play fill="black" size={20} />
                    </button>
                </div>
            )}

            {/* DRAWER APUESTAS */}
            <div className={`fixed inset-x-0 bottom-20 bg-[#0f3d24] rounded-t-3xl shadow-[0_-10px_60px_rgba(0,0,0,0.9)] border-t border-green-400/20 z-50 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) pointer-events-auto ${showBetTable ? 'translate-y-0' : 'translate-y-[130%]'}`}>

                {/* Tirador */}
                <div onClick={() => setShowBetTable(false)} className="w-full h-8 flex items-center justify-center cursor-pointer active:opacity-50">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                </div>

                <div className="px-3 pb-3">
                    <ChipSelector />

                    {/* TABLERO */}
                    <div className="bg-green-800 p-2 rounded-xl shadow-inner border-[4px] border-[#3d2b1f] relative overflow-hidden mb-3 z-10">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 mix-blend-overlay pointer-events-none z-0"></div>

                        {/* GRID UNIFICADO 13x3 */}
                        <div className="grid grid-cols-13 grid-rows-3 gap-0.5 relative z-10 h-36 pointer-events-auto">
                            {/* CERO */}
                            <BoardSpot label="0" value="0" color="green" colSpan={1} rowSpan={3} className="h-full flex items-center justify-center text-lg rounded-l-lg" />

                            {/* FILA SUPERIOR (3, 6, 9...) */}
                            {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(n => (
                                <BoardSpot key={n} label={n} value={n.toString()} color={getNumberColor(n)} />
                            ))}
                            {/* FILA MEDIA (2, 5, 8...) */}
                            {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(n => (
                                <BoardSpot key={n} label={n} value={n.toString()} color={getNumberColor(n)} />
                            ))}
                            {/* FILA INFERIOR (1, 4, 7...) */}
                            {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => (
                                <BoardSpot key={n} label={n} value={n.toString()} color={getNumberColor(n)} />
                            ))}
                        </div>

                        {/* DOCENAS */}
                        <div className="grid grid-cols-13 gap-0.5 mt-0.5 z-10 relative pointer-events-auto">
                            <div className="col-span-1"></div>
                            <div className="col-span-4"><BoardSpot label="1ª 12" value="1st12" type="special" className="h-9" /></div>
                            <div className="col-span-4"><BoardSpot label="2ª 12" value="2nd12" type="special" className="h-9" /></div>
                            <div className="col-span-4"><BoardSpot label="3ª 12" value="3rd12" type="special" className="h-9" /></div>
                        </div>

                        {/* EXTERNAS */}
                        <div className="grid grid-cols-13 gap-0.5 mt-0.5 z-10 relative pointer-events-auto">
                            <div className="col-span-1"></div>
                            <div className="col-span-2"><BoardSpot label="1-18" value="1-18" type="special" className="h-9" /></div>
                            <div className="col-span-2"><BoardSpot label="PAR" value="even" type="special" className="h-9" /></div>
                            <div className="col-span-2"><BoardSpot label="🔴" value="red" color="red" className="h-9" /></div>
                            <div className="col-span-2"><BoardSpot label="⚫" value="black" color="black" className="h-9" /></div>
                            <div className="col-span-2"><BoardSpot label="IMPAR" value="odd" type="special" className="h-9" /></div>
                            <div className="col-span-2"><BoardSpot label="19-36" value="19-36" type="special" className="h-9" /></div>
                        </div>
                    </div>

                    {/* CONTROLES INFERIORES */}
                    <div className="flex gap-3 relative z-20 pointer-events-auto">
                        <button onClick={clearBets} className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-xl font-bold text-xs hover:bg-gray-700 border border-gray-600 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <RotateCcw size={16} /> BORRAR
                        </button>
                        <button
                            onClick={spinWheel}
                            disabled={totalBet === 0}
                            className={`flex-[3] py-3 rounded-xl font-black text-lg shadow-lg border-b-4 transition-all flex items-center justify-center gap-2 ${totalBet === 0 ? 'bg-gray-700 border-gray-900 text-gray-500' : 'bg-yellow-500 border-yellow-700 text-black active:scale-95 active:border-b-0 active:translate-y-1'}`}
                        >
                            GIRAR ({totalBet})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}