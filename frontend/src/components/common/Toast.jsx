import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
    // Autocierre a los 3 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top fade-in duration-300">
            <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md min-w-[300px]
        ${type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100' : 'bg-red-900/80 border-red-500/50 text-red-100'}
      `}>
                {/* Icono Dinámico */}
                {type === 'success' ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}

                {/* Mensaje */}
                <p className="flex-1 text-sm font-medium">{message}</p>

                {/* Botón Cerrar */}
                <button onClick={onClose} className="opacity-70 hover:opacity-100">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}