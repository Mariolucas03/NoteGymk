// ARCHIVO: frontend/src/index.js
// (Este es el arranque de la web visual)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tus estilos
import App from './App'; // Tu componente principal

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);