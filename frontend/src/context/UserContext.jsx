import React, { createContext, useContext, useState } from 'react';
import { API_BASE_URL } from '../config'; // Importamos la URL centralizada

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState({
        id: 'user_1',
        name: 'Ana Garcia',
        level: 1,
        xp: 0,
        coins: 200,
        lives: 3
    });

    // addXp helper (actualiza el estado local y guarda en el backend)
    const addXp = async (amount, meta = {}) => {
        if (typeof amount !== 'number' || isNaN(amount)) return;
        
        // 1. Actualización optimista: Actualizamos la pantalla al instante
        setUser(prev => ({ ...prev, xp: Math.max(0, prev.xp + amount) }));
        
        try {
            // 2. Persistencia: Enviamos los datos al servidor usando la URL de config
            await fetch(`${API_BASE_URL}/user/${user.id}/xp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, meta, timestamp: new Date().toISOString() })
            });
        } catch (e) {
            console.error('Failed to persist XP', e);
            // Aquí podrías añadir lógica para revertir el cambio si falla, 
            // pero para empezar está bien así.
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, addXp }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}