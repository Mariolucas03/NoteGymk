import { useState, useRef, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, Dices } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function DiceGame() {
    const { user, setUser } = useOutletContext();

    // 🔥 USAR FICHAS
    const currentFichas = user?.stats?.gameCoins || 0;

    const [betAmount, setBetAmount] = useState(20);
    const [rolling, setRolling] = useState(false);
    const [playerRolling, setPlayerRolling] = useState(false);
    const [houseRolling, setHouseRolling] = useState(false);
    const [pDice1, setPDice1] = useState(1);
    const [pDice2, setPDice2] = useState(1);
    const [hDice1, setHDice1] = useState(1);
    const [hDice2, setHDice2] = useState(1);
    const [message, setMessage] = useState("¡Supera a la banca!");

    const intervalRef = useRef(null);
    const playerLockedRef = useRef(false);
    const houseLockedRef = useRef(false);

    useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

    const handleBetChange = (e) => {
        const val = e.target.value;
        if (val === '') setBetAmount('');
        else setBetAmount(parseInt(val) || 0);
    };

    const handleBetBlur = () => {
        let finalBet = betAmount;
        if (finalBet === '' || finalBet < 10) finalBet = 10;
        if (finalBet > currentFichas) finalBet = currentFichas;
        setBetAmount(finalBet);
    };

    const rollDie = () => Math.floor(Math.random() * 6) + 1;

    const handleRoll = async () => {
        if (rolling) return;
        if (currentFichas < betAmount) { alert("Faltan fichas"); return; }
        if (betAmount <= 0) { alert("Apuesta > 0"); return; }

        setRolling(true);
        setPlayerRolling(true);
        setHouseRolling(true);
        setMessage("🎲 Los dados están girando...");

        playerLockedRef.current = false;
        houseLockedRef.current = false;

        // COBRO VISUAL
        const newBalance = currentFichas - betAmount;
        setUser({ ...user, stats: { ...user.stats, gameCoins: newBalance } });

        // API
        try { await api.post('/users/reward', { gameCoins: -betAmount }); }
        catch (err) { console.error(err); }

        const finalP1 = rollDie();
        const finalP2 = rollDie();
        const finalH1 = rollDie();
        const finalH2 = rollDie();

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (!playerLockedRef.current) { setPDice1(rollDie()); setPDice2(rollDie()); }
            if (!houseLockedRef.current) { setHDice1(rollDie()); setHDice2(rollDie()); }
        }, 80);

        setTimeout(() => {
            playerLockedRef.current = true;
            setPDice1(finalP1); setPDice2(finalP2);
            setPlayerRolling(false);
        }, 1500);

        setTimeout(() => {
            houseLockedRef.current = true;
            setHDice1(finalH1); setHDice2(finalH2);
            setHouseRolling(false);
            clearInterval(intervalRef.current);
            finishGame(finalP1, finalP2, finalH1, finalH2);
        }, 2500);
    };

    const finishGame = async (p1, p2, h1, h2) => {
        const playerSum = p1 + p2;
        const houseSum = h1 + h2;
        let profit = 0;

        if (playerSum > houseSum) {
            profit = betAmount * 2;
            setMessage(`¡GANASTE! (+${profit} Fichas)`);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } else if (playerSum < houseSum) {
            setMessage("La banca gana... 😢");
        } else {
            profit = betAmount;
            setMessage("¡Empate! Te devuelvo lo apostado.");
        }

        if (profit > 0) {
            // Actualizar visualmente (sumando al saldo actual)
            // Ojo: currentFichas aquí tiene el valor de cuando se pulsó (menos la apuesta si ya restamos en handleRoll, pero React states...)
            // Mejor: usamos el user actualizado
            setUser(prev => ({
                ...prev,
                stats: { ...prev.stats, gameCoins: prev.stats.gameCoins + profit }
            }));

            try { await api.post('/users/reward', { gameCoins: profit }); }
            catch (error) { console.error(error); }
        }
        setRolling(false);
    };

    const ScorePanel = ({ label, d1, d2, isPlayer, isSpinning }) => {
        const sum = d1 + d2;
        const borderColor = isPlayer ? 'border-blue-500' : 'border-red-500';
        const labelColor = isPlayer ? 'text-blue-400' : 'text-red-400';
        const bgGradient = isPlayer ? (isSpinning ? 'from-blue-500 to-blue-700' : 'from-blue-600 to-blue-800') : (isSpinning ? 'from-red-500 to-red-700' : 'from-red-600 to-red-800');
        const spinEffect = isSpinning ? 'animate-pulse scale-105 opacity-80' : 'scale-100';

        return (
            <div className={`flex flex-col items-center bg-gray-900/80 p-4 rounded-3xl border-2 ${borderColor} w-full shadow-xl transition-all duration-300 ${isSpinning ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white/20' : ''}`}>
                <span className={`text-xs font-bold tracking-widest uppercase mb-2 ${labelColor}`}>{label}</span>
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br ${bgGradient} shadow-inner mb-4 border-4 border-gray-800 transition-all duration-200 ${spinEffect}`}>
                    <span className="text-5xl font-black text-white drop-shadow-md">{sum}</span>
                </div>
                <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl">
                    <DieSmall value={d1} />
                    <span className="text-gray-500 text-xs font-bold">+</span>
                    <DieSmall value={d2} />
                </div>
            </div>
        );
    };

    const DieSmall = ({ value }) => (
        <div className="w-8 h-8 bg-gray-800 rounded-md border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-300 shadow-sm">{value}</div>
    );

    return (
        <div className="flex flex-col items-center min-h-[80vh] animate-in fade-in select-none pb-20">
            {/* HEADER CON SALDO */}
            <div className="w-full flex items-center justify-between py-2 h-14 mb-4">
                <div className="flex items-center gap-3">
                    <Link to="/games" className="bg-gray-900 p-2 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Dices className="text-blue-500" size={24} /> DADOS
                    </h1>
                </div>
                <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-1.5 rounded-xl flex flex-col items-end">
                    <span className="text-lg font-black text-white leading-none">{currentFichas}</span>
                    <span className="text-purple-400 text-[10px] font-bold uppercase leading-none">Fichas</span>
                </div>
            </div>

            <div className={`text-sm font-bold mb-6 px-6 py-2 rounded-full transition-all duration-300 ${message.includes('GANASTE') ? 'bg-green-500 text-black scale-105 shadow-lg shadow-green-500/20' : 'bg-gray-800 text-gray-300'}`}>
                {message}
            </div>

            <div className="flex items-stretch justify-center gap-4 w-full px-2 mb-8">
                <ScorePanel label="TÚ" d1={pDice1} d2={pDice2} isPlayer={true} isSpinning={playerRolling} />
                <div className="flex flex-col justify-center items-center opacity-40"><div className="w-[2px] h-full bg-gray-700 rounded-full"></div></div>
                <ScorePanel label="BANCA" d1={hDice1} d2={hDice2} isPlayer={false} isSpinning={houseRolling} />
            </div>

            <div className="w-full max-w-xs bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6 bg-black/40 p-2 rounded-xl border border-gray-800">
                    <button onClick={() => setBetAmount(prev => Math.max(10, (parseInt(prev) || 0) - 10))} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors flex items-center justify-center text-xl">-</button>
                    <div className="flex flex-col items-center flex-1 mx-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Apuesta</span>
                        <div className="relative w-full flex justify-center">
                            <input type="number" value={betAmount} onChange={handleBetChange} onBlur={handleBetBlur} className="w-24 bg-transparent text-center font-bold text-xl text-blue-400 outline-none border-b border-blue-500/30 focus:border-blue-500" />
                        </div>
                    </div>
                    <button onClick={() => setBetAmount(prev => Math.min(currentFichas, (parseInt(prev) || 0) + 10))} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors flex items-center justify-center text-xl">+</button>
                </div>
                <button onClick={handleRoll} disabled={rolling || currentFichas < betAmount} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg ${rolling || currentFichas < betAmount ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-95 shadow-blue-900/20'}`}>
                    {rolling ? 'GIRANDO...' : 'TIRAR DADOS'}
                </button>
            </div>
        </div>
    );
}