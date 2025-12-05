import React from 'react';
import { Sparkles, X, Heart, Zap, Coins } from 'lucide-react';

export default function RewardPopup({ isOpen, message, onClose }) {
    if (!isOpen) return null;

    // Theme Logic based on message content
    const getTheme = (msg) => {
        if (!msg) return { color: 'yellow', border: 'border-yellow-500', shadow: 'shadow-yellow-500/20', text: 'text-yellow-400', bg: 'bg-yellow-600', icon: Coins };

        if (msg.includes('Vida') || msg.includes('❤️')) {
            return { color: 'red', border: 'border-red-500', shadow: 'shadow-red-500/20', text: 'text-red-400', bg: 'bg-red-600', icon: Heart };
        }
        if (msg.includes('XP') || msg.includes('⚡')) {
            return { color: 'violet', border: 'border-violet-500', shadow: 'shadow-violet-500/20', text: 'text-violet-400', bg: 'bg-violet-600', icon: Zap };
        }
        // Default (Coins/General)
        return { color: 'yellow', border: 'border-yellow-500', shadow: 'shadow-yellow-500/20', text: 'text-yellow-400', bg: 'bg-yellow-600', icon: Coins };
    };

    const theme = getTheme(message);
    const Icon = theme.icon;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in duration-200">
            <div className={`bg-slate-900 w-full max-w-sm p-6 rounded-2xl border ${theme.border} shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] ${theme.shadow} flex flex-col items-center gap-4 relative animate-in zoom-in-50 duration-300`}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Animated Icon */}
                <div className={`w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-2 animate-bounce`}>
                    <Icon size={40} className={theme.text} fill="currentColor" fillOpacity={0.2} />
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                        ¡Recibido!
                    </h2>
                    <p className="text-white text-3xl font-black leading-relaxed drop-shadow-lg">
                        {message}
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={onClose}
                    className={`w-full mt-4 ${theme.bg} hover:brightness-110 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95`}
                >
                    ¡Genial!
                </button>
            </div>
        </div>
    );
}
