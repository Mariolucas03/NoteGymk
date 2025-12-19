import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, Ticket, Sparkles, XCircle, Trophy, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function ScratchGame() {
    const { user, setUser } = useOutletContext();
    const TICKET_COST = 10;
    // 🔥 USAR FICHAS
    const currentFichas = user?.stats?.gameCoins || 0;
    const currentXP = user?.currentXP || 0;

    const SYMBOLS = {
        DIAMOND: { id: 'diamond', icon: '💎', prize: 500, type: 'coins', label: '500' },
        XP: { id: 'xp', icon: '⚡', prize: 200, type: 'xp', label: '200 XP' },
        COIN: { id: 'coin', icon: '🪙', prize: 100, type: 'coins', label: '100' },
        LEMON: { id: 'lemon', icon: '🍋', prize: 50, type: 'coins', label: '50' },
        CHERRY: { id: 'cherry', icon: '🍒', prize: 15, type: 'coins', label: '15' },
        SKULL: { id: 'skull', icon: '💀', prize: 0, type: 'none', label: '' },
        POOP: { id: 'poop', icon: '💩', prize: 0, type: 'none', label: '' },
        CLOWN: { id: 'clown', icon: '🤡', prize: 0, type: 'none', label: '' },
        BRICK: { id: 'brick', icon: '🧱', prize: 0, type: 'none', label: '' }
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [grid, setGrid] = useState(Array(9).fill(null));
    const [revealed, setRevealed] = useState(Array(9).fill(false));
    const [winResult, setWinResult] = useState(null);

    const handlePlayAgain = () => { setWinResult(null); setTimeout(() => { buyTicket(); }, 100); };

    const buyTicket = async () => {
        if (currentFichas < TICKET_COST) { alert(`Faltan fichas.`); return; }
        if (processing) return;
        setProcessing(true);

        try {
            const newBalance = currentFichas - TICKET_COST;
            setUser({ ...user, stats: { ...user.stats, gameCoins: newBalance } });
            await api.post('/users/reward', { gameCoins: -TICKET_COST });
            startRound();
        } catch (error) { console.error("Error al cobrar:", error); } finally { setProcessing(false); }
    };

    const startRound = () => {
        const rng = Math.random() * 100;
        let winningSymbol = null;
        if (rng > 99) winningSymbol = SYMBOLS.DIAMOND;
        else if (rng > 95) winningSymbol = SYMBOLS.XP;
        else if (rng > 88) winningSymbol = SYMBOLS.COIN;
        else if (rng > 78) winningSymbol = SYMBOLS.LEMON;
        else if (rng > 65) winningSymbol = SYMBOLS.CHERRY;

        let newGrid = [];
        if (winningSymbol) {
            newGrid = [winningSymbol, winningSymbol, winningSymbol];
            const fillers = [SYMBOLS.SKULL, SYMBOLS.POOP, SYMBOLS.CLOWN, SYMBOLS.BRICK, SYMBOLS.CHERRY, SYMBOLS.LEMON];
            while (newGrid.length < 9) {
                const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
                const count = newGrid.filter(s => s.id === randomFiller.id).length;
                if (count < 2 && randomFiller.id !== winningSymbol.id) newGrid.push(randomFiller);
            }
        } else {
            const losingPool = [SYMBOLS.SKULL, SYMBOLS.SKULL, SYMBOLS.POOP, SYMBOLS.POOP, SYMBOLS.CLOWN, SYMBOLS.CLOWN, SYMBOLS.BRICK, SYMBOLS.BRICK, SYMBOLS.CHERRY];
            newGrid = [...losingPool];
        }
        newGrid = newGrid.sort(() => Math.random() - 0.5);
        setGrid(newGrid);
        setRevealed(Array(9).fill(false));
        setIsPlaying(true);
        setWinResult(null);
    };

    const revealCell = (index) => {
        if (!isPlaying || revealed[index]) return;
        const newRevealed = [...revealed];
        newRevealed[index] = true;
        setRevealed(newRevealed);
        if (newRevealed.every(r => r === true)) finishGame(grid);
    };

    const revealAll = () => {
        if (!isPlaying) return;
        setRevealed(Array(9).fill(true));
        finishGame(grid);
    };

    const finishGame = async (finalGrid) => {
        setIsPlaying(false);
        const counts = {};
        finalGrid.forEach(item => { counts[item.id] = (counts[item.id] || 0) + 1; });

        let winner = null;
        const trashIds = ['skull', 'poop', 'clown', 'brick'];
        Object.keys(counts).forEach(key => {
            if (counts[key] >= 3 && !trashIds.includes(key)) winner = Object.values(SYMBOLS).find(s => s.id === key);
        });

        if (winner) {
            setWinResult({ won: true, prize: winner });
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

            try {
                // Premios en fichas
                const coinGain = winner.type === 'coins' ? winner.prize : 0;
                const xpGain = winner.type === 'xp' ? winner.prize : 0;

                const newBalance = currentFichas + coinGain;
                setUser({ ...user, stats: { ...user.stats, gameCoins: newBalance }, currentXP: currentXP + xpGain });
                await api.post('/users/reward', { gameCoins: coinGain, xp: xpGain });

            } catch (error) { console.error("Error premio:", error); }
        } else {
            setWinResult({ won: false });
        }
    };

    return (
        <div className="flex flex-col items-center h-[calc(100vh-140px)] w-full max-w-md mx-auto px-2 overflow-hidden animate-in fade-in relative">

            {/* HEADER */}
            <div className="shrink-0 w-full flex items-center justify-between py-2 h-14">
                <div className="flex items-center gap-3">
                    <Link to="/games" className="bg-gray-900 p-2 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                        <Ticket className="text-purple-500" size={20} /> RASCA
                    </h1>
                </div>
                <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-1.5 rounded-xl flex flex-col items-end">
                    <span className="text-lg font-black text-white leading-none">{currentFichas}</span>
                    <span className="text-purple-400 text-[10px] font-bold uppercase leading-none">Fichas</span>
                </div>
            </div>

            {/* TABLA PREMIOS */}
            <div className="shrink-0 w-full mb-2">
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-2">
                    <div className="grid grid-cols-3 gap-2">
                        {Object.values(SYMBOLS).filter(s => s.type !== 'none').sort((a, b) => b.prize - a.prize).map((s) => (
                            <div key={s.id} className="flex flex-col items-center justify-center bg-black/40 rounded py-1 border border-gray-800/50">
                                <div className="flex text-xs filter drop-shadow-md mb-0.5">
                                    <span>{s.icon}</span>
                                </div>
                                <span className={`text-[10px] font-black leading-none ${s.type === 'xp' ? 'text-blue-400' : 'text-yellow-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* JUEGO */}
            <div className="flex-1 w-full flex items-center justify-center py-2 min-h-0">
                <div className="bg-gradient-to-br from-purple-900/20 to-black p-3 rounded-2xl border-4 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative aspect-square h-full max-h-[320px] w-auto max-w-full">
                    <div className="grid grid-cols-3 gap-2 h-full">
                        {grid.map((item, i) => (
                            <button key={i} onClick={() => revealCell(i)} disabled={!isPlaying || revealed[i]} className={`rounded-lg flex items-center justify-center text-3xl shadow-inner transition-all duration-200 relative overflow-hidden h-full w-full ${revealed[i] ? 'bg-gray-900 border border-gray-800' : 'bg-gradient-to-br from-purple-600 to-purple-800 border-b-4 border-purple-950 shadow-lg active:scale-95'}`}>
                                {revealed[i] ? <span className="animate-in zoom-in duration-300 drop-shadow-md filter">{item?.icon}</span> : <Sparkles size={16} className="text-purple-300/40 animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CONTROLES */}
            <div className="shrink-0 w-full h-24 relative flex items-center justify-center z-20">
                {!isPlaying && !winResult && (
                    <button onClick={buyTicket} disabled={currentFichas < TICKET_COST || processing} className={`w-full py-3 rounded-xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 absolute bottom-2 ${currentFichas < TICKET_COST ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-95 text-white'}`}>
                        {processing ? '...' : <><Ticket size={20} /> JUGAR (-{TICKET_COST} 🎰)</>}
                    </button>
                )}
                {isPlaying && (
                    <button onClick={revealAll} className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-8 rounded-full font-bold shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wide border border-gray-700 absolute bottom-4">Rascar Todo</button>
                )}
                {winResult && (
                    <div className="absolute bottom-0 w-full animate-in slide-in-from-bottom-5 duration-300 bg-gray-900 p-4 rounded-t-2xl border-t-2 border-purple-500 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-30">
                        <div className="flex items-center justify-between mb-3">
                            {winResult.won ? (
                                <div className="flex items-center gap-3"><Trophy size={32} className="text-yellow-400" /><div><h3 className="text-lg font-black text-yellow-400 uppercase leading-none">¡Ganaste!</h3><p className="text-white text-sm">Premio: <span className="font-bold text-lg">{winResult.prize.label}</span></p></div></div>
                            ) : (
                                <div className="flex items-center gap-3"><XCircle size={32} className="text-red-500" /><div><h3 className="text-lg font-black text-red-500 uppercase leading-none">Sin premio</h3><p className="text-gray-400 text-xs">Más suerte la próxima...</p></div></div>
                            )}
                        </div>
                        <button onClick={handlePlayAgain} disabled={currentFichas < TICKET_COST} className="w-full py-3 rounded-xl font-bold text-sm transition-colors uppercase bg-purple-600 hover:bg-purple-500 text-white">Jugar de nuevo (-{TICKET_COST})</button>
                    </div>
                )}
            </div>
        </div>
    );
}