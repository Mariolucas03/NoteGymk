// src/api.js
import { API_BASE_URL } from './config'; // Importamos la URL inteligente (Local/Render)

export const apiCall = async (endpoint, method = 'GET', body = null) => {

    // Configuración básica sin Tokens ni Auth
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null
    };

    try {
        // Hacemos la petición a la URL base + el endpoint que pidas
        const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!res.ok) {
            throw new Error(`Error en la petición: ${res.status}`);
        }

        // Verificamos si la respuesta es JSON o Texto
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        } else {
            return await res.text();
        }

    } catch (error) {
        console.error("Error en apiCall:", error);
        throw error;
    }
};