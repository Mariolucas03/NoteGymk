import { useState, useRef, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, Dices } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export default function DiceGame() {
    const { user, setUser } = useOutletContext();

    const [betAmount, setBetAmount] = useState(20);
    const [rolling, setRolling] = useState(false);

    // Estados para controlar quién está girando visualmente
    const [playerRolling, setPlayerRolling] = useState(false);
    const [houseRolling, setHouseRolling] = useState(false);

    // Valores de los dados
    const [pDice1, setPDice1] = useState(1);
    const [pDice2, setPDice2] = useState(1);
    const [hDice1, setHDice1] = useState(1);
    const [hDice2, setHDice2] = useState(1);

    const [message, setMessage] = useState("¡Supera a la banca!");

    // Refs para controlar la animación dentro del intervalo sin problemas de clausura
    const intervalRef = useRef(null);
    const playerLockedRef = useRef(false);
    const houseLockedRef = useRef(false);

    // Limpieza al salir
    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    const rollDie = () => Math.floor(Math.random() * 6) + 1;

    const handleRoll = () => {
        if (rolling) return;
        if (user.coins < betAmount) {
            alert("No tienes suficientes monedas");
            return;
        }

        // 1. INICIO
        setRolling(true);
        setPlayerRolling(true);
        setHouseRolling(true);
        setMessage("🎲 Los dados están girando...");

        // Reseteamos bloqueos
        playerLockedRef.current = false;
        houseLockedRef.current = false;

        // Cobrar visualmente
        setUser({ ...user, coins: user.coins - betAmount });

        // 2. DECIDIR RESULTADOS (Ya sabemos qué va a salir, pero animamos)
        const finalP1 = rollDie();
        const finalP2 = rollDie();
        const finalH1 = rollDie();
        const finalH2 = rollDie();

        // 3. ANIMACIÓN DE GIRO
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            // Si el jugador NO está bloqueado, genera números aleatorios visuales
            if (!playerLockedRef.current) {
                setPDice1(rollDie());
                setPDice2(rollDie());
            }

            // Si la banca NO está bloqueada, genera números aleatorios visuales
            if (!houseLockedRef.current) {
                setHDice1(rollDie());
                setHDice2(rollDie());
            }
        }, 80); // Velocidad de cambio de números

        // 4. SECUENCIA DE PARADA

        // A los 1500ms -> PARAS TÚ
        setTimeout(() => {
            playerLockedRef.current = true; // Bloquea actualización aleatoria
            setPDice1(finalP1);             // Pone el valor real
            setPDice2(finalP2);
            setPlayerRolling(false);        // Quita efecto visual de giro
        }, 1500);

        // A los 2500ms (1 segundo después) -> PARA LA BANCA
        setTimeout(() => {
            houseLockedRef.current = true;
            setHDice1(finalH1);
            setHDice2(finalH2);
            setHouseRolling(false);

            clearInterval(intervalRef.current); // Fin animación

            finishGame(finalP1, finalP2, finalH1, finalH2);
        }, 2500);
    };

    const finishGame = async (p1, p2, h1, h2) => {
        const playerSum = p1 + p2;
        const houseSum = h1 + h2;
        let profit = 0;

        if (playerSum > houseSum) {
            profit = betAmount * 2;
            setMessage(`¡GANASTE! (+${profit} 💰)`);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } else if (playerSum < houseSum) {
            setMessage("La banca gana... 😢");
        } else {
            profit = betAmount;
            setMessage("¡Empate! Te devuelvo lo apostado.");
        }

        if (profit > 0) {
            try {
                const { data } = await api.post('/users/reward', { coins: profit, xp: 5 });
                setUser(data.user);
            } catch (error) {
                console.error("Error guardando dados:", error);
            }
        }
        setRolling(false);
    };

    // --- COMPONENTE VISUAL: PANEL DE PUNTUACIÓN ---
    const ScorePanel = ({ label, d1, d2, isPlayer, isSpinning }) => {
        const sum = d1 + d2;

        // Estilos dinámicos según si es Jugador o Banca
        const borderColor = isPlayer ? 'border-blue-500' : 'border-red-500';
        const textColor = isPlayer ? 'text-blue-100' : 'text-red-100';
        const labelColor = isPlayer ? 'text-blue-400' : 'text-red-400';

        // Gradiente: Si está girando, un poco más opaco/vibrante, si paró, sólido.
        const bgGradient = isPlayer
            ? (isSpinning ? 'from-blue-500 to-blue-700' : 'from-blue-600 to-blue-800')
            : (isSpinning ? 'from-red-500 to-red-700' : 'from-red-600 to-red-800');

        // Efecto de "Giro" en el número grande
        const spinEffect = isSpinning ? 'animate-pulse scale-105 opacity-80' : 'scale-100';

        return (
            <div className={`
                flex flex-col items-center bg-gray-900/80 p-4 rounded-3xl border-2 ${borderColor} w-full shadow-xl 
                transition-all duration-300
                ${isSpinning ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white/20' : ''}
            `}>

                {/* Título */}
                <span className={`text-xs font-bold tracking-widest uppercase mb-2 ${labelColor}`}>
                    {label}
                </span>

                {/* SUMA GIGANTE (PROTAGONISTA) */}
                <div className={`
                    w-24 h-24 rounded-full flex items-center justify-center 
                    bg-gradient-to-br ${bgGradient} shadow-inner mb-4
                    border-4 border-gray-800 transition-all duration-200
                    ${spinEffect}
                `}>
                    <span className="text-5xl font-black text-white drop-shadow-md">
                        {sum}
                    </span>
                </div>

                {/* Dados Pequeños (Detalle) */}
                <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl">
                    <DieSmall value={d1} />
                    <span className="text-gray-500 text-xs font-bold">+</span>
                    <DieSmall value={d2} />
                </div>
            </div>
        );
    };

    // Dado pequeño
    const DieSmall = ({ value }) => (
        <div className="w-8 h-8 bg-gray-800 rounded-md border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-300 shadow-sm">
            {value}
        </div>
    );

    return (
        <div className="flex flex-col items-center min-h-[80vh] animate-in fade-in select-none pb-20">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-6">
                <Link to="/games" className="bg-gray-900 p-2 rounded-xl text-gray-400 hover:text-white">
                    <ChevronLeft size={24} />
                </Link>
                <div className="bg-gray-900 px-4 py-2 rounded-full border border-blue-500/30 flex items-center gap-2">
                    <span className="text-blue-400 font-bold">{user.coins}</span>
                    <span className="text-xs">💰</span>
                </div>
            </div>

            <h1 className="text-3xl font-black text-white flex items-center gap-2 mb-2">
                <Dices className="text-blue-500" /> DADOS
            </h1>

            <div className={`
                text-sm font-bold mb-6 px-6 py-2 rounded-full transition-all duration-300
                ${message.includes('GANASTE') ? 'bg-green-500 text-black scale-105' : 'bg-gray-800 text-gray-300'}
            `}>
                {message}
            </div>

            {/* --- ZONA DE JUEGO (VERSUS) --- */}
            <div className="flex items-stretch justify-center gap-4 w-full px-2 mb-8">
                {/* Panel Jugador */}
                <ScorePanel
                    label="TÚ"
                    d1={pDice1}
                    d2={pDice2}
                    isPlayer={true}
                    isSpinning={playerRolling}
                />

                {/* VS Separador */}
                <div className="flex flex-col justify-center items-center opacity-40">
                    <div className="w-[2px] h-full bg-gray-700 rounded-full"></div>
                </div>

                {/* Panel Banca */}
                <ScorePanel
                    label="BANCA"
                    d1={hDice1}
                    d2={hDice2}
                    isPlayer={false}
                    isSpinning={houseRolling}
                />
            </div>

            {/* --- CONTROLES --- */}
            <div className="w-full max-w-xs bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6 bg-black/40 p-2 rounded-xl">
                    <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors">-</button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Apuesta</span>
                        <div className="font-bold text-xl text-blue-400">{betAmount} 💰</div>
                    </div>
                    <button onClick={() => setBetAmount(Math.min(user.coins, betAmount + 10))} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors">+</button>
                </div>

                <button
                    onClick={handleRoll}
                    disabled={rolling || user.coins < betAmount}
                    className={`
                        w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg
                        ${rolling || user.coins < betAmount
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-95 shadow-blue-900/20'
                        }
                    `}
                >
                    {rolling ? 'GIRANDO...' : 'TIRAR DADOS'}
                </button>
            </div>
        </div>
    );
}