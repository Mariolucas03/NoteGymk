import { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, DollarSign, History, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function Roulette() {
    const { user, setUser } = useOutletContext();

    // --- CONFIGURACIÓN ---
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
    const [ballStage, setBallStage] = useState('idle');

    const requestRef = useRef();

    // --- ANIMACIÓN DE GIRO LENTO (IDLE) ---
    useEffect(() => {
        if (!spinning) {
            const animate = () => {
                setWheelRotation(prev => prev + 0.05);
                setBallRotation(prev => prev + 0.05);
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

        // Comprobación de saldo
        if ((user?.coins || 0) < totalBet + selectedChip) {
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

    // --- LÓGICA DE GIRO ---
    const spinWheel = () => {
        if (spinning || totalBet === 0) return;

        setSpinning(true);
        setLastResult(null);
        setBallStage('spinning');
        setShowBetTable(false); // Cerramos panel para ver la acción

        setUser({ ...user, coins: user.coins - totalBet });

        const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
        const winningNumber = WHEEL_NUMBERS[randomIndex];

        // Matemáticas de aterrizaje
        const angleToWinner = (randomIndex * SEGMENT_ANGLE) + (SEGMENT_ANGLE / 2);
        const wheelSpins = 5 * 360;
        const ballSpins = 3 * 360;

        const targetWheelRot = wheelRotation + wheelSpins + (360 - angleToWinner);
        const targetBallRot = ballRotation - ballSpins;

        setWheelRotation(targetWheelRot);
        setBallRotation(targetBallRot);

        setTimeout(() => setBallStage('dropping'), 3500);

        // FIN DEL JUEGO
        setTimeout(async () => {
            setSpinning(false);
            setBallStage('idle');
            setLastResult(winningNumber);
            setHistory(prev => [winningNumber, ...prev].slice(0, 8));

            let winnings = 0;
            const winningColor = getNumberColor(winningNumber);

            Object.entries(bets).forEach(([spot, amount]) => {
                const numSpot = parseInt(spot);
                // Pagos estándar
                if (!isNaN(numSpot) && numSpot === winningNumber) winnings += amount * 36;
                else if (spot === 'red' && winningColor === 'red') winnings += amount * 2;
                else if (spot === 'black' && winningColor === 'black') winnings += amount * 2;
                else if (spot === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) winnings += amount * 2;
                else if (spot === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) winnings += amount * 2;
                else if (spot === '1-18' && winningNumber >= 1 && winningNumber <= 18) winnings += amount * 2;
                else if (spot === '19-36' && winningNumber >= 19 && winningNumber <= 36) winnings += amount * 2;
                else if (spot === '1st12' && winningNumber >= 1 && winningNumber <= 12) winnings += amount * 3;
                else if (spot === '2nd12' && winningNumber >= 13 && winningNumber <= 24) winnings += amount * 3;
                else if (spot === '3rd12' && winningNumber >= 25 && winningNumber <= 36) winnings += amount * 3;
            });

            if (winnings > 0) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500'] });
                try {
                    const { data } = await api.post('/users/reward', { coins: winnings, xp: 15 });
                    setUser(data.user);
                } catch (e) { console.error(e); }
            }

            setBets({});
            setTotalBet(0);
        }, 5000);
    };

    // --- COMPONENTES UI ---

    // IMPORTANTE: z-50 y pointer-events-auto para asegurar que recibe clics
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
        if (type === 'special') bgClass = 'bg-green-900/40 border border-green-500/30 text-green-100';

        return (
            <button
                type="button"
                // IMPORTANTE: stopPropagation para que el clic no pase al fondo
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
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-300 text-black text-[9px] flex items-center justify-center font-black shadow-lg drop-shadow-md">
                            {betAmount}
                        </div>
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-gray-950 text-white overflow-hidden select-none flex flex-col">
            <div className="absolute inset-0 bg-radial-gradient from-green-900/10 to-black pointer-events-none -z-10"></div>

            {/* TOP BAR */}
            <div className="absolute top-4 left-4 z-40 flex items-center gap-4 pointer-events-auto">
                <Link to="/games" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-md border border-white/5">
                    <ChevronLeft size={24} />
                </Link>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                    <History size={14} className="text-gray-400 mr-1" />
                    {history.length === 0 && <span className="text-[10px] text-gray-500">Historial vacío</span>}
                    {history.map((n, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border border-white/10 shadow-lg animate-in zoom-in ${getNumberColor(n) === 'red' ? 'bg-red-600' : getNumberColor(n) === 'black' ? 'bg-gray-900' : 'bg-green-600'}`}>{n}</div>
                    ))}
                </div>
            </div>

            {/* AREA RULETA */}
            <div className="flex-1 flex items-center justify-center relative pb-20 pointer-events-none"> {/* El contenedor NO recibe clics */}
                <div className="relative w-[90vw] h-[90vw] max-w-[450px] max-h-[450px] rounded-full shadow-[0_0_60px_rgba(0,0,0,0.8)] border-[16px] border-[#5c4033] bg-[#2e1d10] pointer-events-auto"> {/* La ruleta SÍ (si quisieras interaccionar) */}
                    <div className="absolute inset-0 rounded-full border-[2px] border-[#a07820] pointer-events-none z-30 opacity-60"></div>
                    <div className="w-full h-full rounded-full relative overflow-hidden" style={{ transform: `rotate(${wheelRotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none' }}>
                        <div className="w-full h-full absolute inset-0 z-10" style={{ background: `conic-gradient(${WHEEL_NUMBERS.map((n, i) => { const color = getNumberColor(n) === 'red' ? '#b91c1c' : getNumberColor(n) === 'black' ? '#111' : '#15803d'; const start = i * SEGMENT_ANGLE; const end = (i + 1) * SEGMENT_ANGLE; return `${color} ${start}deg ${end}deg`; }).join(', ')})` }}></div>
                        {WHEEL_NUMBERS.map((n, i) => (
                            <div key={i} className="absolute top-0 left-1/2 w-[12%] h-[50%] origin-bottom pt-2 flex justify-center z-20" style={{ transform: `translateX(-50%) rotate(${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg)` }}>
                                <span className="text-white font-bold text-lg sm:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">{n}</span>
                            </div>
                        ))}
                        <div className="absolute inset-0 m-auto w-[40%] h-[40%] rounded-full bg-[#1a1a1a] border-[8px] border-[#333] shadow-2xl flex items-center justify-center z-50">
                            {lastResult !== null && !spinning && (
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 animate-in zoom-in duration-300 ${getNumberColor(lastResult) === 'red' ? 'bg-red-600 border-red-800' : getNumberColor(lastResult) === 'black' ? 'bg-black border-gray-700' : 'bg-green-600 border-green-800'}`}>
                                    <span className="text-3xl font-black text-white">{lastResult}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none z-40" style={{ transform: `rotate(${ballRotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none' }}>
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full transition-all duration-1000 ease-out ${ballStage === 'dropping' ? 'p-[45px] sm:p-[60px]' : 'p-[15px]'}`}>
                            <div className="mx-auto w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-gray-300"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTÓN FLOTANTE (POINTER EVENTS AUTO) */}
            {!showBetTable && !spinning && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs px-4 pointer-events-auto">
                    <button onClick={() => setShowBetTable(true)} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-4 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-yellow-400">
                        {totalBet > 0 ? `APOSTAR (${totalBet})` : 'JUGAR / APOSTAR'}
                        <Play fill="black" size={20} />
                    </button>
                </div>
            )}

            {/* DRAWER APUESTAS (POINTER EVENTS AUTO) */}
            <div className={`fixed inset-x-0 bottom-20 bg-[#0f3d24] rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.8)] border-t border-green-400/30 z-50 transition-transform duration-300 ease-out pointer-events-auto ${showBetTable ? 'translate-y-0' : 'translate-y-[120%]'}`}>
                <div onClick={() => setShowBetTable(false)} className="w-full h-6 flex items-center justify-center cursor-pointer active:opacity-50">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                </div>

                <div className="px-3 pb-3">
                    <ChipSelector />

                    {/* TABLERO (TU DISEÑO 13 COLUMNAS) */}
                    <div className="bg-green-800 p-2 rounded-xl shadow-inner border-[3px] border-yellow-900/60 relative overflow-hidden mb-3 z-10">

                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 mix-blend-overlay pointer-events-none z-0"></div>

                        {/* GRID UNIFICADO 13x3 */}
                        <div className="grid grid-cols-13 grid-rows-3 gap-0.5 relative z-10 h-36 pointer-events-auto"> {/* Altura fija h-36 */}

                            {/* CERO: Ocupa las 3 filas de la columna 1 */}
                            <BoardSpot
                                label="0"
                                value="0"
                                color="green"
                                colSpan={1}
                                rowSpan={3}
                                className="h-full flex items-center justify-center text-lg rounded-l-lg"
                            />

                            {/* FILA SUPERIOR (3, 6, 9...) */}
                            {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(n => (
                                <BoardSpot key={n} label={n} value={n.toString()} color={getNumberColor(n)} colSpan={1} rowSpan={1} />
                            ))}

                            {/* FILA MEDIA (2, 5, 8...) */}
                            {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(n => (
                                <BoardSpot key={n} label={n} value={n.toString()} color={getNumberColor(n)} colSpan={1} rowSpan={1} />
                            ))}

                            {/* FILA INFERIOR (1, 4, 7...) */}
                            {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => (
                                <BoardSpot key={n} label={n} value={n.toString()} color={getNumberColor(n)} colSpan={1} rowSpan={1} />
                            ))}
                        </div>

                        {/* DOCENAS */}
                        <div className="grid grid-cols-13 gap-0.5 mt-0.5 z-10 relative pointer-events-auto">
                            <div className="col-span-1"></div> {/* Hueco debajo del 0 */}
                            <div className="col-span-4"><BoardSpot label="1ª 12" value="1st12" type="special" className="h-10" /></div>
                            <div className="col-span-4"><BoardSpot label="2ª 12" value="2nd12" type="special" className="h-10" /></div>
                            <div className="col-span-4"><BoardSpot label="3ª 12" value="3rd12" type="special" className="h-10" /></div>
                        </div>

                        {/* EXTERNAS */}
                        <div className="grid grid-cols-13 gap-0.5 mt-0.5 z-10 relative pointer-events-auto">
                            <div className="col-span-1"></div>
                            <div className="col-span-2"><BoardSpot label="1-18" value="1-18" type="special" className="h-10" /></div>
                            <div className="col-span-2"><BoardSpot label="PAR" value="even" type="special" className="h-10" /></div>
                            <div className="col-span-2"><BoardSpot label="🔴" value="red" color="red" className="h-10" /></div>
                            <div className="col-span-2"><BoardSpot label="⚫" value="black" color="black" className="h-10" /></div>
                            <div className="col-span-2"><BoardSpot label="IMPAR" value="odd" type="special" className="h-10" /></div>
                            <div className="col-span-2"><BoardSpot label="19-36" value="19-36" type="special" className="h-10" /></div>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-20 pointer-events-auto">
                        <button onClick={clearBets} className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-xl font-bold text-xs hover:bg-gray-700 border border-gray-600 flex items-center justify-center gap-2">
                            <RotateCcw size={16} /> BORRAR
                        </button>
                        <button
                            onClick={spinWheel}
                            disabled={totalBet === 0}
                            className={`flex-[3] py-3 rounded-xl font-black text-lg shadow-lg border-b-4 transition-all ${totalBet === 0 ? 'bg-gray-700 border-gray-900 text-gray-500' : 'bg-yellow-500 border-yellow-700 text-black active:scale-95 active:border-b-0 active:translate-y-1'}`}
                        >
                            GIRAR ({totalBet})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}