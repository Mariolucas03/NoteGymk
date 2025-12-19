import { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, History, ChevronUp, ChevronDown, Disc } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const CHIPS = [1, 5, 10, 25, 100, 500];
const SEGMENT_ANGLE = 360 / 37;

export default function Roulette() {
    const { user, setUser } = useOutletContext();
    // 🔥 USAR FICHAS
    const currentFichas = user?.stats?.gameCoins || 0;

    const [selectedChip, setSelectedChip] = useState(5);
    const [bets, setBets] = useState({});
    const [totalBet, setTotalBet] = useState(0);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showBoard, setShowBoard] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [lastResult, setLastResult] = useState(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const animate = () => { if (!spinning) setRotation(prev => (prev + 0.05) % 360); animationRef.current = requestAnimationFrame(animate); };
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [spinning]);

    const getNumberColor = (num) => {
        if (num === 0) return 'green';
        const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        return redNums.includes(num) ? 'red' : 'black';
    };

    const placeBet = (spots) => {
        if (spinning) return;
        if (currentFichas < totalBet + selectedChip) return;
        const spotKey = Array.isArray(spots) ? `multi-${spots.sort((a, b) => a - b).join('-')}` : spots;
        setBets(prev => ({ ...prev, [spotKey]: (prev[spotKey] || 0) + selectedChip }));
        setTotalBet(prev => prev + selectedChip);
    };

    const clearBets = () => { if (spinning) return; setBets({}); setTotalBet(0); };

    const spinWheel = async () => {
        if (spinning || totalBet === 0) return;
        setSpinning(true);
        setShowBoard(false);
        setLastResult(null);

        // COBRAR
        const newBalance = currentFichas - totalBet;
        setUser({ ...user, stats: { ...user.stats, gameCoins: newBalance } });
        try { await api.post('/users/reward', { gameCoins: -totalBet }); } catch (e) { }

        const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
        const winningNumber = WHEEL_NUMBERS[randomIndex];
        const currentRot = rotation % 360;
        const winnerCenterAngle = (randomIndex * SEGMENT_ANGLE) + (SEGMENT_ANGLE / 2);
        const distanceToZero = (360 - winnerCenterAngle);
        const targetRotation = rotation + (360 * 10) + (360 - currentRot) + distanceToZero;

        setRotation(targetRotation);
        setTimeout(() => finishGame(winningNumber), 5000);
    };

    const finishGame = async (winningNumber) => {
        setSpinning(false);
        setLastResult(winningNumber);
        setHistory(prev => [winningNumber, ...prev].slice(0, 10));
        setRotation(prev => prev % 360);
        setTimeout(() => setShowBoard(true), 1500);

        let winnings = 0;
        const color = getNumberColor(winningNumber);

        Object.entries(bets).forEach(([key, amount]) => {
            if (key.startsWith('multi-')) {
                const nums = key.replace('multi-', '').split('-').map(Number);
                if (nums.includes(winningNumber)) winnings += amount * (36 / nums.length);
            } else {
                const n = parseInt(key);
                if (!isNaN(n) && n === winningNumber) winnings += amount * 36;
                else if (key === 'red' && color === 'red') winnings += amount * 2;
                else if (key === 'black' && color === 'black') winnings += amount * 2;
                else if (key === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) winnings += amount * 2;
                else if (key === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) winnings += amount * 2;
                else if (key === '1st12' && winningNumber >= 1 && winningNumber <= 12) winnings += amount * 3;
                else if (key === '2nd12' && winningNumber >= 13 && winningNumber <= 24) winnings += amount * 3;
                else if (key === '3rd12' && winningNumber >= 25 && winningNumber <= 36) winnings += amount * 3;
                else if (key === 'col1' && winningNumber > 0 && winningNumber % 3 === 1) winnings += amount * 3;
                else if (key === 'col2' && winningNumber > 0 && winningNumber % 3 === 2) winnings += amount * 3;
                else if (key === 'col3' && winningNumber > 0 && winningNumber % 3 === 0) winnings += amount * 3;
            }
        });

        if (winnings > 0) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            // Sumar al saldo (usamos user del context actualizado)
            // Como ya restamos la apuesta, ahora solo sumamos el premio
            setUser(prev => ({
                ...prev,
                stats: { ...prev.stats, gameCoins: prev.stats.gameCoins + winnings }
            }));

            try { await api.post('/users/reward', { gameCoins: winnings, xp: 10 }); } catch (e) { }
        }
        setBets({});
        setTotalBet(0);
    };

    const ChipVisual = ({ amount, scale = "scale-100" }) => (
        <div className={`absolute inset-0 flex items-center justify-center z-50 pointer-events-none ${scale}`}>
            <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-dashed border-yellow-200 text-black text-[9px] flex items-center justify-center font-black shadow-[0_2px_5px_rgba(0,0,0,0.5)] animate-in zoom-in">{amount}</div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-zinc-950 overflow-hidden relative text-white select-none">
            {/* HEADER */}
            <div className="shrink-0 h-14 flex items-center justify-between px-4 bg-zinc-900/80 border-b border-white/5 z-40">
                <div className="flex items-center gap-3">
                    <Link to="/games" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"><ChevronLeft size={20} /></Link>
                    <h1 className="font-black tracking-tighter text-lg uppercase italic flex items-center gap-2"><Disc className="text-red-500" /> Ruleta</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-purple-900/40 border border-purple-500/30 px-3 py-1 rounded-xl flex flex-col items-end backdrop-blur-md">
                        <span className="text-base font-black text-white leading-none">{currentFichas}</span>
                        <span className="text-purple-400 text-[9px] font-bold uppercase leading-none">Fichas</span>
                    </div>
                    <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-lg transition ${showHistory ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400'}`}><History size={20} /></button>
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center relative bg-[radial-gradient(circle_at_center,_#1a3d2b_0%,_#09090b_100%)]">
                <div className="relative w-[80vw] h-[80vw] max-w-[450px] max-h-[450px]">
                    <div className="w-full h-full rounded-full border-[15px] border-[#3e2b1f] shadow-2xl relative overflow-hidden" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)' : 'none' }}>
                        <div className="absolute inset-0" style={{ background: `conic-gradient(${WHEEL_NUMBERS.map((n, i) => `${getNumberColor(n) === 'red' ? '#b91c1c' : getNumberColor(n) === 'black' ? '#111' : '#15803d'} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`).join(', ')})` }}></div>
                        {WHEEL_NUMBERS.map((n, i) => (
                            <div key={i} className="absolute top-0 left-1/2 w-8 h-1/2 -translate-x-1/2 origin-bottom pt-3 text-center" style={{ transform: `rotate(${i * SEGMENT_ANGLE + (SEGMENT_ANGLE / 2)}deg)` }}>
                                <span className="text-[16px] font-black block rotate-180">{n}</span>
                            </div>
                        ))}
                        <div className="absolute inset-0 m-auto w-[38%] h-[38%] bg-zinc-900 rounded-full border-[6px] border-zinc-700 flex items-center justify-center z-20">
                            {lastResult !== null && !spinning && <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${getNumberColor(lastResult) === 'red' ? 'bg-red-600 border-red-400' : 'bg-zinc-900 border-zinc-700'} animate-in zoom-in`}><span className="text-4xl font-black">{lastResult}</span></div>}
                        </div>
                    </div>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_white] z-30 border-2 border-zinc-300"></div>
                </div>
            </div>

            {/* TABLERO */}
            <div className={`absolute bottom-0 left-0 w-full transition-all duration-500 z-50 ${showBoard ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}>
                <button onClick={() => !spinning && setShowBoard(!showBoard)} className="w-full h-[60px] bg-[#062415] border-t-4 border-[#3e2b1f] flex items-center justify-between px-6 shadow-2xl">
                    <div className="flex items-center gap-2">{showBoard ? <ChevronDown size={24} className="text-yellow-500" /> : <ChevronUp size={24} className="text-yellow-500" />}<span className="font-black text-sm uppercase tracking-widest text-gray-300">Tablero</span></div>
                    <div className="text-yellow-500 font-black text-lg">{totalBet} 💰</div>
                </button>
                <div className="bg-[#062415] p-2 pb-10 border-t border-white/5">
                    <div className="flex justify-center gap-2 mb-4">
                        {CHIPS.map(val => (
                            <button key={val} onClick={() => setSelectedChip(val)} className={`w-11 h-11 rounded-full border-2 border-dashed flex items-center justify-center font-black text-[10px] transition-all ${selectedChip === val ? 'scale-110 border-yellow-400 bg-yellow-500 text-black -translate-y-2' : 'opacity-60 bg-zinc-800 border-zinc-600'}`}>{val}</button>
                        ))}
                    </div>
                    {/* ... (Resto del tablero igual, omitido para ahorrar espacio ya que solo se cambiaron las funciones) */}
                    <div className="max-w-xl mx-auto relative bg-green-950/40 rounded-xl p-2 border-2 border-[#a07820]/30 shadow-inner">
                        <div className="grid grid-cols-[45px_repeat(12,1fr)_40px] gap-1 h-36 relative">
                            {/* CERO */}
                            <div className="relative">
                                <button onClick={() => placeBet(0)} className="w-full h-full bg-green-700 rounded-l-lg font-black text-sm border border-white/10">0{bets[0] && <ChipVisual amount={bets[0]} />}</button>
                                {/* ... Calles ... */}
                            </div>
                            {/* NUMEROS */}
                            <div className="col-span-12 grid grid-cols-12 grid-rows-3 gap-1 relative">
                                {[3, 2, 1].map((row) => [...Array(12)].map((_, colIndex) => {
                                    const n = (colIndex * 3) + row;
                                    return (
                                        <div key={n} className="relative h-11">
                                            <button onClick={() => placeBet(n)} className={`w-full h-full rounded border border-white/5 font-black text-sm ${getNumberColor(n) === 'red' ? 'bg-red-700' : 'bg-zinc-900'}`}>{n}{bets[n] && <ChipVisual amount={bets[n]} />}</button>
                                        </div>
                                    )
                                }))}
                            </div>
                            {/* COLUMNAS */}
                            <div className="flex flex-col gap-1">
                                <button onClick={() => placeBet('col3')} className="flex-1 bg-green-900/40 rounded text-[10px] border border-white/5">2:1</button>
                                <button onClick={() => placeBet('col2')} className="flex-1 bg-green-900/40 rounded text-[10px] border border-white/5">2:1</button>
                                <button onClick={() => placeBet('col1')} className="flex-1 bg-green-900/40 rounded text-[10px] border border-white/5">2:1</button>
                            </div>
                        </div>
                        {/* EXTERNAS */}
                        <div className="grid grid-cols-[45px_repeat(3,1fr)_40px] gap-1 mt-2 ml-11">
                            <button onClick={() => placeBet('1st12')} className="h-9 bg-green-900/40 rounded border border-white/10 text-[10px] font-bold">1st 12</button>
                            <button onClick={() => placeBet('2nd12')} className="h-9 bg-green-900/40 rounded border border-white/10 text-[10px] font-bold">2nd 12</button>
                            <button onClick={() => placeBet('3rd12')} className="h-9 bg-green-900/40 rounded border border-white/10 text-[10px] font-bold">3rd 12</button>
                        </div>
                        <div className="grid grid-cols-[45px_repeat(6,1fr)_40px] gap-1 mt-1 ml-11 text-[9px] font-bold">
                            <button onClick={() => placeBet('1-18')} className="h-9 bg-green-950/60 rounded border border-white/5">1-18</button>
                            <button onClick={() => placeBet('even')} className="h-9 bg-green-950/60 rounded border border-white/5">PAR</button>
                            <button onClick={() => placeBet('red')} className="h-9 bg-red-700 rounded border border-white/5">ROJO</button>
                            <button onClick={() => placeBet('black')} className="h-9 bg-zinc-900 rounded border border-white/5">NEGRO</button>
                            <button onClick={() => placeBet('odd')} className="h-9 bg-green-950/60 rounded border border-white/5">IMPAR</button>
                            <button onClick={() => placeBet('19-36')} className="h-9 bg-green-950/60 rounded border border-white/5">19-36</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 max-w-xl mx-auto h-14">
                        <button onClick={clearBets} disabled={spinning} className="h-full px-6 bg-zinc-800 rounded-2xl text-zinc-400 border border-white/5 active:scale-95 transition-all"><RotateCcw size={22} /></button>
                        <button onClick={spinWheel} disabled={spinning || totalBet === 0} className={`flex-1 h-full rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${spinning || totalBet === 0 ? 'bg-zinc-800 text-zinc-600' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black active:scale-[0.98] shadow-lg shadow-yellow-500/10'}`}>
                            {spinning ? 'GIRANDO...' : `JUGAR`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}