// frontend/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Creamos una instancia "inteligente" de Axios
const api = axios.create({
    baseURL: `${API_BASE_URL}/api`, // Automáticamente pone http://.../api antes de cada petición
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- INTERCEPTORES (La magia de la arquitectura profesional) ---

// 1. Interceptor de Petición: Inyecta el token automáticamente si existe
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Recuperamos el token guardado
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Se lo enviamos al backend
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Interceptor de Respuesta: Simplifica el manejo de errores
api.interceptors.response.use(
    (response) => response, // Si todo va bien, devuelve la respuesta limpia
    (error) => {
        // Si el error es 401 (No autorizado), significa que el token expiró
        if (error.response && error.response.status === 401) {
            // Aquí podríamos redirigir al Login automáticamente en el futuro
            console.warn('Sesión expirada o no válida');
        }
        return Promise.reject(error);
    }
);

export default api;