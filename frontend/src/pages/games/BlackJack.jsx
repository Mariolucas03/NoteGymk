import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, RefreshCcw, Play, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

// --- UTILIDADES DE BARAJA ---
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = () => {
    let deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            let weight = parseInt(value);
            if (value === 'J' || value === 'Q' || value === 'K') weight = 10;
            if (value === 'A') weight = 11;
            deck.push({ suit, value, weight, id: Math.random() });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (hand) => {
    let score = 0;
    let aces = 0;
    hand.forEach(card => {
        score += card.weight;
        if (card.value === 'A') aces += 1;
    });
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
};

export default function BlackJack() {
    const { user, setUser } = useOutletContext();

    // --- ESTADOS ---
    const [deck, setDeck] = useState([]);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameState, setGameState] = useState('betting'); // betting, dealing, playing, dealerTurn, ended
    const [bet, setBet] = useState(10);
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        setDeck(createDeck());
    }, []);

    // --- LÓGICA DE APUESTA Y JUEGO ---
    const placeBet = (amount) => {
        if (gameState !== 'betting') return;
        setBet(amount);
    };

    const dealGame = async () => {
        if (!user || user.coins < bet) {
            alert("No tienes suficientes monedas.");
            return;
        }

        // 1. COBRO VISUAL CORRECTO (Objeto directo para Layout)
        const newBalance = user.coins - bet;
        setUser({ coins: newBalance });

        // 2. API SYNC
        api.post('/users/reward', { coins: -bet }).catch(e => console.error(e));

        setGameState('dealing');
        setMessage('');
        setWinner(null);
        setPlayerHand([]);
        setDealerHand([]);

        let newDeck = [...deck];
        if (newDeck.length < 10) newDeck = createDeck();

        const p1 = newDeck.pop();
        const d1 = newDeck.pop();
        const p2 = newDeck.pop();
        const d2 = newDeck.pop();

        // --- ANIMACIÓN DE REPARTO OPTIMIZADA ---
        // Usamos delays acumulativos para efecto "Carta a carta"
        setTimeout(() => setPlayerHand([p1]), 200);
        setTimeout(() => setDealerHand([d1]), 600); // Dealer 1
        setTimeout(() => setPlayerHand([p1, p2]), 1000); // Player 2

        setTimeout(() => {
            setDealerHand([d1, d2]); // Dealer 2 (Oculta)
            setDeck(newDeck);

            const pScore = calculateScore([p1, p2]);
            if (pScore === 21) {
                // Verificar si dealer también tiene BJ instantáneo
                const dScore = calculateScore([d1, d2]);
                if (dScore === 21) {
                    handleGameOver([p1, p2], [d1, d2], 'push', bet, newBalance);
                } else {
                    handleGameOver([p1, p2], [d1, d2], 'blackjack', bet, newBalance);
                }
            } else {
                setGameState('playing');
            }
        }, 1400);
    };

    const hit = () => {
        const newDeck = [...deck];
        const card = newDeck.pop();
        const newHand = [...playerHand, card];
        setDeck(newDeck);
        setPlayerHand(newHand);

        if (calculateScore(newHand) > 21) {
            handleGameOver(newHand, dealerHand, 'dealer');
        }
    };

    const stand = () => {
        setGameState('dealerTurn');
        // Pequeña pausa dramática antes de que el dealer voltee su carta
        setTimeout(() => runDealerLogic(), 600);
    };

    const doubleDown = async () => {
        if (user.coins < bet) return;

        // Cobrar apuesta extra
        const newBalance = user.coins - bet;
        setUser({ coins: newBalance });
        api.post('/users/reward', { coins: -bet }).catch(e => console.error(e));

        const newDeck = [...deck];
        const card = newDeck.pop();
        const newHand = [...playerHand, card];
        setDeck(newDeck);
        setPlayerHand(newHand);

        if (calculateScore(newHand) > 21) {
            handleGameOver(newHand, dealerHand, 'dealer', bet * 2, newBalance);
        } else {
            setGameState('dealerTurn');
            setTimeout(() => runDealerLogic(newHand, bet * 2, newBalance), 800);
        }
    };

    const runDealerLogic = async (pHand = playerHand, currentBet = bet, currentBalance = user.coins) => {
        let dHand = [...dealerHand];
        let dScore = calculateScore(dHand);
        let currentDeck = [...deck];

        // Función recursiva con delay para simular "pensar"
        const playLoop = () => {
            if (dScore < 17) {
                setTimeout(() => {
                    const card = currentDeck.pop();
                    dHand = [...dHand, card];
                    dScore = calculateScore(dHand);
                    setDealerHand(dHand);
                    setDeck(currentDeck);
                    playLoop(); // Siguiente carta
                }, 800); // 800ms entre cartas del dealer
            } else {
                setTimeout(() => {
                    determineWinner(pHand, dHand, currentBet, currentBalance);
                }, 500);
            }
        };

        playLoop();
    };

    const determineWinner = (pHand, dHand, currentBet, currentBalance) => {
        const pScore = calculateScore(pHand);
        const dScore = calculateScore(dHand);

        if (dScore > 21) handleGameOver(pHand, dHand, 'player', currentBet, currentBalance);
        else if (pScore > dScore) handleGameOver(pHand, dHand, 'player', currentBet, currentBalance);
        else if (dScore > pScore) handleGameOver(pHand, dHand, 'dealer', currentBet, currentBalance);
        else handleGameOver(pHand, dHand, 'push', currentBet, currentBalance);
    };

    const handleGameOver = async (pHand, dHand, result, finalBet = bet, currentBalance = user.coins) => {
        setGameState('ended');
        setWinner(result);
        let winnings = 0;
        let msg = '';

        if (result === 'player') {
            winnings = finalBet * 2;
            msg = `¡GANASTE! (+${finalBet})`;
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } else if (result === 'blackjack') {
            winnings = finalBet * 2.5;
            msg = `¡BLACKJACK! (+${finalBet * 1.5})`;
            confetti({ particleCount: 250, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700'] });
        } else if (result === 'push') {
            winnings = finalBet;
            msg = 'EMPATE';
        } else {
            msg = 'LA BANCA GANA';
        }

        setMessage(msg);

        if (winnings > 0) {
            // Pasamos el balance base (ya restado) + premios
            setUser({ coins: currentBalance + winnings });
            try {
                await api.post('/users/reward', { coins: winnings });
            } catch (e) { console.error("Error pagando", e); }
        }
    };

    // --- COMPONENTE CARTA CON EFECTO FLIP 3D ---
    const Card = ({ card, hidden, index, isDealer }) => {
        if (!card) return null;
        const isRed = card.suit === '♥' || card.suit === '♦';

        // Lógica de Flip: Si es crupier, índice 1 y estamos jugando, forzamos "hidden" visual
        // Pero usamos CSS para rotarlo.
        const shouldShowBack = hidden;

        return (
            <div
                className="absolute w-24 h-36 sm:w-28 sm:h-40 transition-all duration-500 ease-out"
                style={{
                    left: `${index * 30}px`, // Solapamiento
                    top: `${index * -5}px`,
                    transform: `rotate(${index * 5 - 5}deg)`, // Leve rotación natural
                    zIndex: index,
                    perspective: '1000px', // Necesario para el efecto 3D
                }}
            >
                {/* Contenedor Interior que gira */}
                <div
                    className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${shouldShowBack ? 'rotate-y-180' : 'rotate-y-0'}`}
                    style={{ transformStyle: 'preserve-3d', transform: shouldShowBack ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* CARA FRONTAL (Visible) */}
                    <div className={`
                        absolute inset-0 w-full h-full rounded-xl shadow-xl border border-gray-300 bg-white 
                        flex flex-col justify-between p-2 select-none backface-hidden
                    `} style={{ backfaceVisibility: 'hidden' }}>
                        <div className={`text-2xl font-black ${isRed ? 'text-red-600' : 'text-black'}`}>{card.value}</div>
                        <div className={`absolute inset-0 flex items-center justify-center text-6xl opacity-20 ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
                        <div className={`text-2xl font-black self-end ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
                    </div>

                    {/* CARA TRASERA (Reverso) */}
                    <div className={`
                        absolute inset-0 w-full h-full rounded-xl border-2 border-white/20 bg-blue-900 shadow-xl
                        flex items-center justify-center backface-hidden
                    `}
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            backgroundImage: `url('https://www.transparenttextures.com/patterns/diagmonds-light.png')`
                        }}>
                        <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-blue-950">
                            <span className="text-white/30 text-2xl">♠</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const HandArea = ({ cards, title, score, isDealer }) => {
        // Calculamos score visible. Si es crupier y juega, solo mostramos valor carta 1
        const visibleScore = isDealer && gameState === 'playing'
            ? calculateScore([cards[0]]) // Solo carta 1
            : score;

        return (
            <div className="flex flex-col items-center relative z-10 w-full">
                <div className="flex items-center gap-3 mb-16 sm:mb-20 bg-black/40 px-5 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                    <span className="text-gray-300 font-bold uppercase tracking-widest text-xs">{title}</span>
                    <div className={`px-2 py-0.5 rounded-md font-black text-sm transition-colors duration-300 ${score > 21 ? 'text-red-500' : 'text-yellow-400'
                        }`}>
                        {visibleScore}
                    </div>
                </div>

                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                    {cards.map((card, i) => (
                        <div key={card.id || i} className="animate-in slide-in-from-bottom-10 fade-in duration-500 fill-mode-forwards">
                            <Card
                                card={card}
                                index={i}
                                // Ocultar si es Dealer, es la carta 2 (índice 1) y estamos jugando
                                hidden={isDealer && i === 1 && gameState === 'playing'}
                                isDealer={isDealer}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-screen relative left-[calc(-50vw+50%)] min-h-[calc(100vh-140px)] -my-4 flex flex-col bg-[#1b3a28] text-white select-none overflow-hidden font-sans">

            {/* FONDO VERDE TAPETE */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d5a3f_0%,_#1b3a28_80%,_#0d1f14_100%)] pointer-events-none"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none mix-blend-overlay"></div>

            {/* --- FLECHA ATRÁS --- */}
            <Link
                to="/games"
                className="absolute top-4 left-4 z-50 p-3 bg-black/30 text-white/80 hover:text-white rounded-full backdrop-blur-md border border-white/10 active:scale-95 transition-all hover:bg-black/50"
            >
                <ChevronLeft size={24} />
            </Link>

            {/* --- MESA DE JUEGO --- */}
            <div className="flex-grow flex flex-col items-center justify-center w-full px-4 relative z-10 py-6 gap-8">

                {/* ÁREA CRUPIER */}
                <HandArea cards={dealerHand} title="Crupier" score={calculateScore(dealerHand)} isDealer />

                {/* MENSAJE CENTRAL (RESULTADO) */}
                {gameState === 'ended' && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <div className={`
                            px-10 py-8 rounded-3xl shadow-2xl border-4 text-center backdrop-blur-xl animate-in zoom-in duration-300 pointer-events-auto transform scale-110
                            ${winner === 'player' || winner === 'blackjack' ? 'bg-green-600/90 border-green-400 shadow-green-500/50' : ''}
                            ${winner === 'dealer' ? 'bg-red-600/90 border-red-400 shadow-red-500/50' : ''}
                            ${winner === 'push' ? 'bg-gray-600/90 border-gray-400' : ''}
                        `}>
                            <h2 className="text-5xl font-black text-white uppercase drop-shadow-lg whitespace-nowrap tracking-tighter">
                                {winner === 'player' ? 'VICTORIA' : winner === 'dealer' ? 'DERROTA' : winner === 'blackjack' ? 'BLACKJACK' : 'EMPATE'}
                            </h2>
                            <p className="text-white font-bold mt-2 text-xl tracking-wide">{message}</p>
                        </div>
                    </div>
                )}

                {/* ÁREA JUGADOR */}
                <HandArea cards={playerHand} title="Tu Mano" score={calculateScore(playerHand)} />

            </div>

            {/* --- CONTROLES INFERIORES --- */}
            <div className="w-full p-4 z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-10 pt-10">
                <div className="max-w-md mx-auto w-full min-h-[100px] flex items-end justify-center">

                    {gameState === 'betting' || gameState === 'ended' ? (
                        <div className="flex flex-col gap-6 w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
                            {/* Fichas */}
                            <div className="flex justify-center gap-3 sm:gap-5">
                                {[10, 50, 100, 500].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => placeBet(val)}
                                        disabled={user.coins < val}
                                        className={`
                                            w-16 h-16 rounded-full border-[4px] border-dashed font-black text-sm shadow-xl transition-all active:scale-90 flex items-center justify-center relative
                                            ${bet === val ? 'scale-110 -translate-y-2 ring-4 ring-yellow-400 border-solid z-10 bg-yellow-600 text-white shadow-yellow-500/30' : 'opacity-80 hover:opacity-100 bg-gray-800 text-gray-300'}
                                            ${user.coins < val ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                            ${val === 10 ? 'border-blue-400' : ''}
                                            ${val === 50 ? 'border-green-400' : ''}
                                            ${val === 100 ? 'border-purple-400' : ''}
                                            ${val === 500 ? 'border-yellow-500 text-yellow-500' : ''}
                                        `}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={dealGame}
                                disabled={user.coins < bet}
                                className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {gameState === 'ended' ? <RefreshCcw size={28} /> : <Play size={28} fill="currentColor" />}
                                {gameState === 'ended' ? 'OTRA MANO' : 'REPARTIR'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 w-full animate-in slide-in-from-bottom-10 fade-in duration-300">
                            <button
                                onClick={hit}
                                disabled={gameState !== 'playing'}
                                className="py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-lg border-b-[6px] border-green-800 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center disabled:opacity-50 disabled:border-none disabled:translate-y-1"
                            >
                                <span className="text-xl tracking-wider">PEDIR</span>
                            </button>

                            <button
                                onClick={stand}
                                disabled={gameState !== 'playing'}
                                className="py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-lg border-b-[6px] border-red-800 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center disabled:opacity-50 disabled:border-none disabled:translate-y-1"
                            >
                                <span className="text-xl tracking-wider">PLANTARSE</span>
                            </button>

                            {playerHand.length === 2 && (
                                <button
                                    onClick={doubleDown}
                                    disabled={gameState !== 'playing' || user.coins < bet}
                                    className="col-span-2 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg border-b-[6px] border-blue-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:border-none disabled:translate-y-1"
                                >
                                    <Layers size={22} /> DOBLAR APUESTA (x2)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}