import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config'; // Asegúrate de tener el config.js que hicimos antes

function App() {
    const [mensajeBackend, setMensajeBackend] = useState('Esperando respuesta del servidor...');

    useEffect(() => {
        // Petición simple a la raíz de tu backend
        fetch(`${API_BASE_URL}/`)
            .then(res => res.text()) // Esperamos texto simple
            .then(data => setMensajeBackend(data))
            .catch(err => {
                console.error(err);
                setMensajeBackend('Error: No se pudo conectar con el Backend');
            });
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold mb-4 text-blue-500">Proyecto Base - Full Stack</h1>

            <div className="border border-gray-700 p-6 rounded-lg bg-gray-900 max-w-md text-center">
                <p className="text-gray-400 text-sm mb-2">Estado de la conexión:</p>
                <p className="text-xl font-mono text-green-400">{mensajeBackend}</p>
            </div>

            <p className="mt-8 text-gray-500">
                Sin Login. Sin Usuarios. Solo conexión pura.
            </p>
        </div>
    );
}

export default App;