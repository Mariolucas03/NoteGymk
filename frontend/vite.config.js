import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // 🔥 ESTO ES LA CLAVE: Permite acceso desde la red (IP)
        port: 3000, // Fijamos el puerto para no volvernos locos
    },
});