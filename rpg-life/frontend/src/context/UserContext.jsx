import React, { createContext, useContext, useState } from 'react';

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

    // addXp helper (updates state; persists to backend)
    const addXp = async (amount, meta = {}) => {
        if (typeof amount !== 'number' || isNaN(amount)) return;
        setUser(prev => ({ ...prev, xp: Math.max(0, prev.xp + amount) }));
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api'}/user/${user.id}/xp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, meta, timestamp: new Date().toISOString() })
            });
        } catch (e) {
            console.error('Failed to persist XP', e);
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
