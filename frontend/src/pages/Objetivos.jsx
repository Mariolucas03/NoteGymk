import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function Objetivos() {
    const { user, addXp } = useUser();
    const [objectives, setObjectives] = useState([]);
    
    // Usamos las claves en inglés para coincidir con la base de datos: 
    // 'weekly' (semanal), 'monthly' (mensual), 'yearly' (anual)
    const [tab, setTab] = useState('weekly'); 
    const [newObj, setNewObj] = useState('');

    // 1. CARGAR OBJETIVOS AL ENTRAR
    useEffect(() => {
        if (!user?.id) return;

        fetch(`${API_BASE_URL}/user/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.objectives && Array.isArray(data.objectives)) {
                    setObjectives(data.objectives);
                }
            })
            .catch(err => console.error("Error cargando objetivos", err));
    }, [user]);

    // Función auxiliar: GUARDAR EN LA NUBE
    const saveToCloud = (updatedList) => {
        if (!user?.id) return;
        fetch(`${API_BASE_URL}/user/${user.id}/objectives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ objectives: updatedList })
        }).catch(e => console.error(e));
    };

    // COMPLETAR / DESMARCAR
    const toggleComplete = (id) => {
        const updated = objectives.map(obj => {
            if (obj.id === id) {
                const isCompleting = !obj.completed;
                
                // Si completamos, damos XP según la dificultad del objetivo
                if (isCompleting) {
                    let xpReward = 50; // Por defecto (Semanal)
                    if (obj.type === 'monthly') xpReward = 100;
                    if (obj.type === 'yearly') xpReward = 500;

                    addXp(xpReward, { action: `Objetivo: ${obj.title}`, type: 'objetivo' });
                }
                return { ...obj, completed: isCompleting };
            }
            return obj;
        });
        
        setObjectives(updated); // Actualiza pantalla
        saveToCloud(updated);   // Guarda en nube
    };

    // AÑADIR OBJETIVO NUEVO
    const addObjective = () => {
        if (!newObj.trim()) return;
        
        // Usamos la fecha como ID para que sea único
        const newId = Date.now().toString(); 
        
        const newItem = {
            id: newId,
            title: newObj,
            type: tab,      // Se guarda en la pestaña que tengas abierta
            isFixed: false, // Las manuales NO son fijas (se borran al acabar el periodo)
            completed: false
        };

        const updated = [...objectives, newItem];
        setObjectives(updated);
        setNewObj('');
        saveToCloud(updated);
    };

    // Filtramos la lista para mostrar solo lo de la pestaña actual
    const currentList = objectives.filter(o => o.type === tab);

    return (
        <section>
            <h3 className="font-bold text-xl mb-4">🎯 Objetivos a Largo Plazo</h3>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="flex bg-gray-200 p-1 rounded-lg mb-4">
                <button 
                    onClick={() => setTab('weekly')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${tab === 'weekly' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Semanal
                </button>
                <button 
                    onClick={() => setTab('monthly')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${tab === 'monthly' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Mensual
                </button>
                <button 
                    onClick={() => setTab('yearly')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${tab === 'yearly' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Anual
                </button>
            </div>

            {/* LISTA DE OBJETIVOS */}
            <div className="space-y-3 min-h-[200px]">
                {currentList.length === 0 && (
                    <p className="text-gray-400 text-center py-6 text-sm">
                        No tienes objetivos para este periodo. ¡Añade uno!
                    </p>
                )}
                
                {currentList.map(obj => (
                    <div 
                        key={obj.id} 
                        className={`flex items-center justify-between p-3 rounded border transition-colors ${obj.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <button 
                                onClick={() => toggleComplete(obj.id)}
                                className={`w-6 h-6 min-w-[24px] rounded border flex items-center justify-center font-bold transition-all
                                    ${obj.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 text-transparent hover:text-gray-300'}`}
                            >
                                ✓
                            </button>
                            
                            <div className={`truncate ${obj.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {obj.title}
                                {obj.isFixed && (
                                    <span className="ml-2 text-[10px] bg-gray-100 border px-1.5 py-0.5 rounded text-gray-500 font-medium">
                                        Fijo
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Etiqueta de XP si está completado */}
                        {obj.completed && (
                            <span className="text-xs font-bold text-green-600 whitespace-nowrap ml-2">
                                {obj.type === 'weekly' ? '+50 XP' : obj.type === 'monthly' ? '+100 XP' : '+500 XP'}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* INPUT PARA AÑADIR */}
            <div className="mt-6 flex gap-2">
                <input 
                    className="flex-1 p-3 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={newObj}
                    onChange={e => setNewObj(e.target.value)}
                    placeholder={`Añadir objetivo ${tab === 'weekly' ? 'semanal' : tab === 'monthly' ? 'mensual' : 'anual'}...`}
                    onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                />
                <button 
                    onClick={addObjective}
                    className={`px-4 rounded text-white font-bold shadow-md transition-colors 
                        ${tab === 'weekly' ? 'bg-blue-600 hover:bg-blue-700' : 
                          tab === 'monthly' ? 'bg-purple-600 hover:bg-purple-700' : 
                          'bg-orange-600 hover:bg-orange-700'}`}
                >
                    +
                </button>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-4 px-4">
                Los objetivos manuales se borran al acabar el periodo. Los fijos se reinician.
            </p>
        </section>
    );
}