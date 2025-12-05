import React, { useState } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';

export default function Auth({ onSuccess }) {
    const { login } = useUser();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setAuthLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const body = isLogin ? { email, password } : { name, email, password };

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error');

            login(data.user, data.token);

            if (onSuccess) {
                onSuccess(data.user, data.token);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-sm bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-2 text-center">RPG Life</h1>
                <p className="text-slate-400 text-center mb-8">Gamifica tu vida</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Nombre de Héroe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-violet-500 transition-colors"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-violet-500 transition-colors"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-violet-500 transition-colors"
                        required
                    />

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl mt-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {authLoading ? 'Cargando...' : (isLogin ? 'Iniciar Aventura' : 'Crear Personaje')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
}
