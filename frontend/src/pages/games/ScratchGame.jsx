import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, Ticket, Sparkles, XCircle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function ScratchGame() {
    const { user, setUser } = useOutletContext();

    // --- 1. ECONOMÍA BALANCEADA ---
    const TICKET_COST = 10;

    // --- 2. SÍMBOLOS Y PREMIOS ---
    const SYMBOLS = {
        // GANADORES
        DIAMOND: { id: 'diamond', icon: '💎', prize: 500, type: 'coins', label: '500' },
        XP: { id: 'xp', icon: '⚡', prize: 200, type: 'xp', label: '200 XP' },
        COIN: { id: 'coin', icon: '🪙', prize: 100, type: 'coins', label: '100' },
        LEMON: { id: 'lemon', icon: '🍋', prize: 50, type: 'coins', label: '50' },
        CHERRY: { id: 'cherry', icon: '🍒', prize: 15, type: 'coins', label: '15' },

        // PERDEDORES (Basura variada para diluir)
        SKULL: { id: 'skull', icon: '💀', prize: 0, type: 'none', label: '' },
        POOP: { id: 'poop', icon: '💩', prize: 0, type: 'none', label: '' },
        CLOWN: { id: 'clown', icon: '🤡', prize: 0, type: 'none', label: '' },
        BRICK: { id: 'brick', icon: '🧱', prize: 0, type: 'none', label: '' }
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const [grid, setGrid] = useState(Array(9).fill(null));
    const [revealed, setRevealed] = useState(Array(9).fill(false));
    const [winResult, setWinResult] = useState(null);

    // --- LÓGICA DE JUEGO ---
    const buyTicket = () => {
        if (user.coins < TICKET_COST) {
            alert(`Necesitas ${TICKET_COST} monedas.`);
            return;
        }

        setUser({ ...user, coins: user.coins - TICKET_COST });

        // Probabilidad (65% Perder / 35% Ganar)
        const rng = Math.random() * 100;
        let winningSymbol = null;

        if (rng > 99) winningSymbol = SYMBOLS.DIAMOND; // 1%
        else if (rng > 95) winningSymbol = SYMBOLS.XP;      // 4%
        else if (rng > 88) winningSymbol = SYMBOLS.COIN;    // 7%
        else if (rng > 78) winningSymbol = SYMBOLS.LEMON;   // 10%
        else if (rng > 65) winningSymbol = SYMBOLS.CHERRY;  // 13%
        else winningSymbol = null;            // 65% Pierde

        let newGrid = [];

        if (winningSymbol) {
            newGrid = [winningSymbol, winningSymbol, winningSymbol];
            const fillers = [SYMBOLS.SKULL, SYMBOLS.POOP, SYMBOLS.CLOWN, SYMBOLS.BRICK, SYMBOLS.CHERRY, SYMBOLS.LEMON];
            while (newGrid.length < 9) {
                const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
                const count = newGrid.filter(s => s.id === randomFiller.id).length;
                if (count < 2 && randomFiller.id !== winningSymbol.id) {
                    newGrid.push(randomFiller);
                }
            }
        } else {
            const losingPool = [
                SYMBOLS.SKULL, SYMBOLS.SKULL, SYMBOLS.POOP, SYMBOLS.POOP,
                SYMBOLS.CLOWN, SYMBOLS.CLOWN, SYMBOLS.BRICK, SYMBOLS.BRICK, SYMBOLS.CHERRY
            ];
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
        checkWinCondition(newRevealed, grid);
    };

    const revealAll = () => {
        if (!isPlaying) return;
        const allRevealed = Array(9).fill(true);
        setRevealed(allRevealed);
        checkWinCondition(allRevealed, grid);
    };

    const checkWinCondition = (currentRevealedState, currentGrid) => {
        if (currentRevealedState.every(r => r === true)) {
            finishGame(currentGrid);
        }
    };

    const finishGame = async (finalGrid) => {
        setIsPlaying(false);
        const counts = {};
        finalGrid.forEach(item => { counts[item.id] = (counts[item.id] || 0) + 1; });

        let winner = null;
        const trashIds = ['skull', 'poop', 'clown', 'brick'];

        Object.keys(counts).forEach(key => {
            if (counts[key] >= 3 && !trashIds.includes(key)) {
                winner = Object.values(SYMBOLS).find(s => s.id === key);
            }
        });

        if (winner) {
            setWinResult({ won: true, prize: winner });
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            try {
                const rewardPayload = {
                    coins: winner.type === 'coins' ? winner.prize : 0,
                    xp: winner.type === 'xp' ? winner.prize : 0
                };
                const { data } = await api.post('/users/reward', rewardPayload);
                setUser(data.user);
            } catch (error) { console.error("Error premio:", error); }
        } else {
            setWinResult({ won: false });
        }
    };

    return (
        <div className="flex flex-col items-center min-h-[80vh] animate-in fade-in select-none pb-20">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-4">
                <Link to="/games" className="bg-gray-900 p-2 rounded-xl text-gray-400 hover:text-white">
                    <ChevronLeft size={24} />
                </Link>
                <div className="bg-gray-900 px-4 py-2 rounded-full border border-purple-500/30 flex items-center gap-2">
                    <span className="text-purple-400 font-bold">{user.coins}</span>
                    <span className="text-xs">💰</span>
                </div>
            </div>

            <h1 className="text-3xl font-black text-white flex items-center gap-2 mb-2">
                <Ticket className="text-purple-500" /> RASCA Y GANA
            </h1>
            <p className="text-gray-400 text-xs mb-4">Encuentra 3 iguales • Coste: <span className="text-yellow-400 font-bold">{TICKET_COST} 💰</span></p>

            {/* --- TABLA DE PREMIOS (VISUAL) --- */}
            <div className="w-full max-w-sm grid grid-cols-5 gap-2 mb-6 px-4">
                {Object.values(SYMBOLS)
                    .filter(s => s.type !== 'none') // Solo mostramos premios
                    .sort((a, b) => b.prize - a.prize) // Ordenamos del más caro al más barato
                    .map((s) => (
                        <div key={s.id} className="flex flex-col items-center bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                            <span className="text-xl mb-1 filter drop-shadow-md">{s.icon}</span>
                            <span className={`text-[10px] font-bold ${s.type === 'xp' ? 'text-blue-300' : 'text-yellow-300'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
            </div>

            {/* ZONA DE JUEGO */}
            <div className="bg-purple-900/20 p-4 rounded-3xl border-4 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)] mb-8 relative">
                <div className="grid grid-cols-3 gap-3">
                    {grid.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => revealCell(i)}
                            disabled={!isPlaying || revealed[i]}
                            className={`
                                w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-inner transition-all duration-300
                                ${revealed[i]
                                    ? 'bg-gray-900 border border-gray-800 scale-95'
                                    : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 border-b-4 border-purple-900 shadow-lg'
                                }
                            `}
                        >
                            {revealed[i] ? (
                                <span className="animate-in zoom-in duration-300 drop-shadow-md filter">{item?.icon}</span>
                            ) : (
                                <Sparkles size={20} className="text-purple-300/50" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTROLES */}
            <div className="w-full max-w-xs text-center h-24">
                {!isPlaying && !winResult && (
                    <button
                        onClick={buyTicket}
                        disabled={user.coins < TICKET_COST}
                        className={`
                            w-full py-4 rounded-2xl font-black text-xl shadow-lg transition-all
                            ${user.coins < TICKET_COST
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-[1.02] active:scale-95'
                            }
                        `}
                    >
                        JUGAR (-{TICKET_COST} 💰)
                    </button>
                )}

                {isPlaying && (
                    <button onClick={revealAll} className="text-purple-400 hover:text-white underline text-sm font-bold animate-pulse">
                        RASCAR TODO
                    </button>
                )}

                {winResult && (
                    <div className="animate-in zoom-in duration-300 bg-gray-900/90 p-4 rounded-2xl border border-purple-500/30">
                        {winResult.won ? (
                            <div>
                                <h3 className="text-2xl font-black text-yellow-400 mb-1">¡PREMIO!</h3>
                                <p className="text-white text-lg">Has ganado <span className="font-bold">{winResult.prize.label} {winResult.prize.type === 'coins' ? '💰' : ''}</span></p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                <div className="flex gap-2 items-center"><XCircle size={24} /> <span className="font-bold">Suerte la próxima...</span></div>
                            </div>
                        )}
                        <button onClick={() => setWinResult(null)} className="mt-3 text-sm text-purple-400 hover:text-white underline">
                            Jugar de nuevo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}