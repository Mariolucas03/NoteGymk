import React from 'react';
import { Home, Target, Utensils, Dumbbell, ShoppingBag } from 'lucide-react';

export default function FooterNav({ activeTab, onTabChange }) {
    const navItems = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'goals', icon: Target, label: 'Objetivos' },
        { id: 'food', icon: Utensils, label: 'Comida' },
        { id: 'gym', icon: Dumbbell, label: 'Gym' },
        { id: 'shop', icon: ShoppingBag, label: 'Tienda' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-white/10 z-50 pb-safe">
            <div className="flex justify-around items-center max-w-md mx-auto h-16 px-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${isActive ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <item.icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
