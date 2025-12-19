import { useState, useRef, useEffect } from 'react';
import { Heart, AlertTriangle, Save, Lock, Skull, ArrowUp } from 'lucide-react'; // Añadido ArrowUp
import api from '../../services/api';

export default function HealthWidget({ user, setUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [missionInput, setMissionInput] = useState('');
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    // 1. ESTADO DE LA MISIÓN
    const [confirmedMission, setConfirmedMission] = useState(() => {
        if (user?.redemptionMission) return user.redemptionMission;
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try { return JSON.parse(savedUser).redemptionMission || null; } catch (e) { return null; }
        }
        return null;
    });

    // 2. SINCRONIZACIÓN
    useEffect(() => {
        if (user?.redemptionMission) {
            setConfirmedMission(user.redemptionMission);
        }
    }, [user]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSaveMission = async () => {
        if (!missionInput.trim()) return;

        setLoading(true);
        try {
            const res = await api.post('/users/set-redemption-mission', { mission: missionInput });
            setConfirmedMission(res.data.user.redemptionMission);
            if (setUser) setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (error) {
            console.error("Error guardando misión", error);
            if (error.response && error.response.status === 400) {
                try {
                    const refreshRes = await api.get('/users');
                    const freshUser = refreshRes.data;
                    if (setUser) setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    setConfirmedMission(freshUser.redemptionMission);
                } catch (refreshError) {
                    setConfirmedMission(user?.redemptionMission || missionInput);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDamageTest = async () => {
        if (!user) return;
        const current = user.stats?.hp || 100;
        const newHp = Math.max(0, current - 10);
        try {
            const res = await api.put('/users/update-stats', { hp: newHp });
            if (setUser) setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
            console.error("Error restando vida", error);
        }
    };

    // --- LÓGICA DE VISUALIZACIÓN ---
    const stats = user?.stats || {};
    const currentHp = stats.hp ?? 100;
    const maxHp = stats.maxHp || 100;

    // ¿Tiene misión establecida?
    const hasMissionSet = confirmedMission && confirmedMission.toString().trim().length > 0;

    // ¿Debemos mostrar el tutorial? (Solo si NO hay misión y el menú está cerrado)
    const showTutorial = !hasMissionSet && !isOpen;

    return (
        <div className="relative z-50" ref={containerRef}>

            {/* TOOLTIP DE TUTORIAL (Solo aparece si no hay misión) */}
            {showTutorial && (
                <div className="absolute top-12 right-0 w-48 z-50 pointer-events-none animate-bounce">
                    <div className="bg-red-600 text-white text-xs font-bold p-2 rounded-lg shadow-lg border border-white text-center relative">
                        {/* Triangulito hacia arriba */}
                        <div className="absolute -top-1 right-6 w-3 h-3 bg-red-600 rotate-45 border-t border-l border-white"></div>
                        <p>¡IMPORTANTE!</p>
                        <p className="font-normal">Haz clic aquí para definir tu "Misión de Salvación".</p>
                    </div>
                </div>
            )}

            {/* BOTÓN DE VIDA */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 border px-3 py-1.5 rounded-full transition-all group relative
                    ${showTutorial
                        ? 'bg-blue-900/50 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' // Estilo destacado si falta misión
                        : 'bg-gray-900 border-gray-700 hover:border-red-500'
                    }
                `}
            >
                {/* Si falta la misión, añadimos un puntito rojo de notificación */}
                {showTutorial && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}

                <Heart
                    size={20}
                    className={`
                        ${currentHp < 30 ? 'animate-pulse text-red-500 fill-red-500' : ''} 
                        ${showTutorial ? 'text-blue-300 animate-pulse' : 'text-red-500 fill-red-500'}
                    `}
                />
                <span className="font-bold text-white text-sm">
                    {currentHp}/{maxHp}
                </span>
            </button>

            {/* DESPLEGABLE (Igual que antes) */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-black border-2 border-red-900/50 rounded-xl shadow-[0_0_40px_rgba(220,38,38,0.2)] p-4 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                    <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-red-500">
                            <AlertTriangle size={20} />
                            <h3 className="font-bold uppercase text-xs tracking-widest">Advertencia Crítica</h3>
                        </div>

                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                            Cuidado. Si te quedas a <b className="text-white">0 de vida</b> se te bloqueará el acceso a esta aplicación a no ser...
                        </p>

                        {!hasMissionSet ? (
                            /* --- ESTADO 1: INPUT --- */
                            <div className="bg-gray-900/80 p-3 rounded-lg border border-red-500/30 mb-4 animate-pulse border-blue-500">
                                <label htmlFor="mission-input" className="block text-[10px] text-blue-400 uppercase font-bold mb-2">
                                    Define tu Misión de Salvación:
                                </label>
                                <textarea
                                    id="mission-input"
                                    autoFocus
                                    rows={2}
                                    placeholder="Ej: Salir a correr 30 min..."
                                    value={missionInput}
                                    onChange={(e) => setMissionInput(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none resize-none mb-2"
                                />
                                <button
                                    onClick={handleSaveMission}
                                    disabled={loading || !missionInput}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : <><Save size={14} /> CONFIRMAR PACTO</>}
                                </button>
                                <p className="text-[9px] text-blue-300/70 mt-2 text-center italic">
                                    * Configura esto para quitar el aviso.
                                </p>
                            </div>
                        ) : (
                            /* --- ESTADO 2: BLOQUEADO --- */
                            <div className="bg-red-950/30 p-4 rounded-lg border border-red-500/50 text-center animate-in zoom-in-95 mb-4">
                                <p className="text-xs text-red-300 mb-1 uppercase font-bold">Que hagas esta misión:</p>
                                <p className="text-white font-black text-lg italic tracking-wide break-words">"{confirmedMission}"</p>
                                <div className="mt-4 flex items-center justify-center gap-2 text-red-500/60">
                                    <Lock size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Pacto Sellado</span>
                                </div>
                            </div>
                        )}

                        {/* --- ZONA DE PRUEBAS --- */}
                        <div className="border-t border-gray-800 pt-3 mt-2">
                            <button
                                onClick={handleDamageTest}
                                className="w-full bg-gray-900 hover:bg-red-950 text-red-400 hover:text-red-200 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-dashed border-gray-700 hover:border-red-500/50"
                            >
                                <Skull size={14} />
                                TEST: RESTAR 10 HP
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}