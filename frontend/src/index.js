import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <--- 1. IMPORTANTE: Importamos esto
import App from './App';
import { UserProvider } from './context/UserContext';
import './index.css'; 

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter> {/* <--- 2. IMPORTANTE: Envolvemos la App aquí */}
            <UserProvider>
                <App />
            </UserProvider>
        </BrowserRouter>
    </React.StrictMode>
);