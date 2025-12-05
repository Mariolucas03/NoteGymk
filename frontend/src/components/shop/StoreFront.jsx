import React from 'react';
import { Gift, User, Dog, Zap, Box, Plus, Coins } from 'lucide-react';

export default function StoreFront({ items, userRewards, onBuy, onCreateReward }) {

    // Helper to render a section
    const renderSection = (title, itemList, icon) => (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-slate-400 font-bold uppercase text-xs tracking-wider">
                {icon} {title}
            </div>
            <div className="grid grid-cols-3 gap-3">
                {itemList.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => onBuy(item)}
                        className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col items-center gap-2 relative overflow-hidden group cursor-pointer hover:border-violet-500 transition-all active:scale-95"
                    >
                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{item.icon}</div>
                        <h3 className="font-bold text-slate-200 text-center text-[10px] leading-tight">{item.name}</h3>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded-full">
                            <Coins size={10} fill="currentColor" />
                            {item.cost}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative animate-in fade-in duration-300">
            {/* 1. Tickets (Custom Rewards) */}
            {renderSection("Tus Recompensas", userRewards, <Gift size={14} />)}



            {/* 4. Consumables */}
            {renderSection("Consumibles", items.consumables, <Zap size={14} />)}

            {/* 5. Chests */}
            {renderSection("Cofres", items.chests, <Box size={14} />)}


        </div>
    );
}
