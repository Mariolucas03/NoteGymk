import { useState, useEffect } from 'react';
import { Activity, Zap, Maximize2 } from 'lucide-react'; // Añadido icono
import api from '../../services/api';

export default function RPGBody({ mini = false, onClick }) {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBody = async () => {
            try {
                const res = await api.get('/gym/body-status');
                setStats(res.data);
            } catch (error) {
                console.error("Error body stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBody();
    }, []);

    const getMuscleStyle = (sets) => {
        if (!sets || sets === 0) return { fill: "transparent", stroke: "#374151", strokeWidth: "0.8", filter: "none" };
        if (sets < 10) return { fill: "rgba(59, 130, 246, 0.3)", stroke: "#60a5fa", strokeWidth: "1", filter: "url(#glow-blue)" };
        if (sets < 25) return { fill: "rgba(168, 85, 247, 0.4)", stroke: "#c084fc", strokeWidth: "1.2", filter: "url(#glow-purple)" };
        return { fill: "rgba(234, 179, 8, 0.5)", stroke: "#facc15", strokeWidth: "1.5", filter: "url(#glow-gold)" };
    };

    const Muscle = ({ name, paths }) => {
        const style = getMuscleStyle(stats[name]);
        return (
            <g className="transition-all duration-500">
                {paths.map((d, i) => (
                    <path key={i} d={d} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} filter={style.filter} strokeLinecap="round" strokeLinejoin="round" />
                ))}
            </g>
        );
    };

    // --- RENDERIZADO MINI (WIDGET) ---
    if (mini) {
        return (
            <div onClick={onClick} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-40 relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={48} />
                </div>

                <div className="flex justify-between items-start z-10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                        <Activity size={12} /> Mapa Muscular
                    </h3>
                    <Maximize2 size={12} className="text-gray-600 group-hover:text-blue-400" />
                </div>

                <div className="flex-1 flex items-center justify-center relative -mb-4">
                    {/* Miniatura simplificada del SVG */}
                    {loading ? <div className="animate-spin w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent" /> : (
                        <svg viewBox="0 0 500 450" className="h-28 w-full overflow-visible opacity-80 group-hover:scale-110 transition-transform duration-500">
                            <defs>
                                <filter id="glow-blue"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                <filter id="glow-purple"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                <filter id="glow-gold"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            <g transform="translate(100, 20) scale(0.8)"> {/* Solo vista frontal centrada */}
                                {/* Silueta Base Simplificada */}
                                <path d="M125,20 C135,20 145,30 145,45 C145,60 135,75 125,75 C115,75 105,60 105,45 C105,30 115,20 125,20 Z" fill="#1f2937" stroke="#374151" />
                                <Muscle name="Pecho" paths={["M125,115 L125,175 Q100,170 90,150 Q85,130 105,120 Z", "M125,115 L125,175 Q150,170 160,150 Q165,130 145,120 Z"]} />
                                <Muscle name="Abdomen" paths={["M125,175 L125,240 Q105,235 100,210 Q100,185 125,175 Z", "M100,170 Q90,200 95,230 L105,240 L115,210 Z", "M150,170 Q160,200 155,230 L145,240 L135,210 Z"]} />
                                <Muscle name="Pierna" paths={["M105,240 Q90,280 95,330 Q100,360 115,370 L120,330 Q115,280 125,240 Z", "M145,240 Q160,280 155,330 Q150,360 135,370 L130,330 Q135,280 125,240 Z"]} />
                                <Muscle name="Hombro" paths={["M95,105 C80,110 70,125 75,150 C80,165 90,175 100,160 L105,130 Z", "M155,105 C170,110 180,125 175,150 C170,165 160,175 150,160 L145,130 Z"]} />
                                <Muscle name="Bíceps" paths={["M75,150 C70,170 65,190 70,210 L85,205 C90,185 85,165 80,150 Z", "M175,150 C180,170 185,190 180,210 L165,205 C160,185 165,165 170,150 Z"]} />
                            </g>
                        </svg>
                    )}
                </div>

                <p className="text-[10px] text-gray-500 z-10 text-center">Toca para ver detalle</p>
            </div>
        );
    }

    // --- RENDERIZADO COMPLETO (MODAL) ---
    // (Este es el código original que tenías, envuelto en el div principal)
    return (
        <div className="w-full h-full bg-gray-900/50 p-2 relative overflow-hidden flex flex-col items-center">
            {/* ... (Aquí va tu código SVG completo original, copiado abajo para referencia) ... */}

            <div className="relative w-full h-full flex-shrink-0 animate-in fade-in zoom-in duration-500">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center"><Zap className="text-blue-500 animate-bounce" /></div>
                ) : (
                    <svg viewBox="0 0 500 450" className="w-full h-full overflow-visible drop-shadow-xl">
                        <defs>
                            <filter id="glow-blue"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            <filter id="glow-purple"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            <filter id="glow-gold"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        {/* VISTA FRONTAL */}
                        <g transform="translate(20, 0)">
                            <path d="M125,20 C135,20 145,30 145,45 C145,60 135,75 125,75 C115,75 105,60 105,45 C105,30 115,20 125,20 Z" fill="#1f2937" stroke="#374151" />
                            <path d="M125,75 L125,90 M115,85 L105,95 M135,85 L145,95" stroke="#374151" strokeWidth="2" />
                            <Muscle name="Hombro" paths={["M105,95 Q125,85 145,95 L155,105 L125,115 L95,105 Z", "M95,105 C80,110 70,125 75,150 C80,165 90,175 100,160 L105,130 Z", "M155,105 C170,110 180,125 175,150 C170,165 160,175 150,160 L145,130 Z"]} />
                            <Muscle name="Pecho" paths={["M125,115 L125,175 Q100,170 90,150 Q85,130 105,120 Z M100,135 L120,140 M95,150 L120,155", "M125,115 L125,175 Q150,170 160,150 Q165,130 145,120 Z M150,135 L130,140 M155,150 L130,155"]} />
                            <Muscle name="Bíceps" paths={["M75,150 C70,170 65,190 70,210 L85,205 C90,185 85,165 80,150 Z", "M175,150 C180,170 185,190 180,210 L165,205 C160,185 165,165 170,150 Z"]} />
                            <Muscle name="Abdomen" paths={["M125,175 L125,240 Q105,235 100,210 Q100,185 125,175 Z M110,190 L140,190 M110,210 L140,210 M115,225 L135,225", "M100,170 Q90,200 95,230 L105,240 L115,210 Z", "M150,170 Q160,200 155,230 L145,240 L135,210 Z"]} />
                            <Muscle name="Pierna" paths={["M105,240 Q90,280 95,330 Q100,360 115,370 L120,330 Q115,280 125,240 Z M105,280 L115,320", "M145,240 Q160,280 155,330 Q150,360 135,370 L130,330 Q135,280 125,240 Z M145,280 L135,320", "M115,370 L110,420 L100,440 L130,440 L125,420 L135,370 Z"]} />
                        </g>
                        {/* VISTA TRASERA */}
                        <g transform="translate(270, 0)">
                            <path d="M125,20 C135,20 145,30 145,45 C145,60 135,75 125,75 C115,75 105,60 105,45 C105,30 115,20 125,20 Z" fill="#1f2937" stroke="#374151" />
                            <path d="M125,75 L125,100 M105,95 L145,95" stroke="#374151" strokeWidth="2" />
                            <Muscle name="Espalda" paths={["M125,90 L105,105 L125,160 L145,105 Z", "M105,105 L80,140 L95,200 L120,230 L125,160 Z M90,150 L115,170", "M145,105 L170,140 L155,200 L130,230 L125,160 Z M160,150 L135,170", "M120,230 L115,250 L135,250 L130,230 Z"]} />
                            <Muscle name="Hombro" paths={["M105,105 L80,115 L90,140 L110,125 Z", "M145,105 L170,115 L160,140 L140,125 Z"]} />
                            <Muscle name="Tríceps" paths={["M80,140 C75,160 80,180 85,200 L100,190 C95,170 90,150 95,135 Z", "M170,140 C175,160 170,180 165,200 L150,190 C155,170 160,150 155,135 Z"]} />
                            <Muscle name="Pierna" paths={["M115,230 Q95,240 95,270 Q105,290 125,280 Z", "M135,230 Q155,240 155,270 Q145,290 125,280 Z", "M105,290 Q95,320 100,360 L120,370 L125,340 L115,290 Z", "M145,290 Q155,320 150,360 L130,370 L125,340 L135,290 Z", "M100,360 Q85,390 95,420 L115,430 L120,390 Z M105,380 L115,400", "M150,360 Q165,390 155,420 L135,430 L130,390 Z M145,380 L135,400"]} />
                        </g>
                        <text x="125" y="470" textAnchor="middle" fill="#6b7280" fontSize="10" fontWeight="bold" letterSpacing="2">FRONTAL</text>
                        <text x="395" y="470" textAnchor="middle" fill="#6b7280" fontSize="10" fontWeight="bold" letterSpacing="2">TRASERA</text>
                    </svg>
                )}
            </div>

            {/* Leyenda solo en modo Full */}
            <div className="flex gap-4 mt-4 bg-black/40 p-2 rounded-xl">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] text-gray-300">Activo</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-[9px] text-gray-300">Intenso</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-[9px] text-gray-300">Máx</span></div>
            </div>
        </div>
    );
}