import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchDashboardData } from '../services/missionService';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [missions, setMissions] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            refreshUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const refreshUser = async () => {
        try {
            const data = await fetchDashboardData();
            setUser(data.user);
            setMissions(data.missions);
        } catch (error) {
            console.error("Error refreshing user data:", error);
            // Optional: logout if error is 401?
        } finally {
            setLoading(false);
        }
    };

    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        refreshUser(); // Fetch missions
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setMissions([]);
    };

    return (
        <UserContext.Provider value={{
            user,
            missions,
            token,
            loading,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </UserContext.Provider>
    );
};
