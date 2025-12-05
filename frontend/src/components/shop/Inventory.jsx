import React from 'react';
import { Gift, Zap, Box } from 'lucide-react';

export default function Inventory({ items, onUse }) {
    // 1. Process items into categories (Flat Schema)
    const tickets = items?.filter(slot => (!slot.category || slot.category === 'ticket')) || [];
    const consumables = items?.filter(slot => slot.category === 'consumable') || [];
    const chests = items?.filter(slot => slot.category === 'chest') || [];

    // Helper to render a section
    const renderSection = (title, itemList, icon) => {
        if (!itemList || itemList.length === 0) return null;

        let buttonText = "USAR";
        let buttonClass = "bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white";

        if (title === "Mis Tickets") {
            buttonText = "Tirar";
            buttonClass = "bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white border border-red-900/50";
        } else if (title === "Mis Cofres") {
            buttonText = "Abrir";
            buttonClass = "bg-yellow-600/20 hover:bg-yellow-500 text-yellow-500 hover:text-white border border-yellow-600/40";
        } else if (title === "Mis Consumibles") {
            buttonText = "Usar";
            buttonClass = "bg-emerald-900/40 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-900/50";
        }

        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-slate-400 font-bold uppercase text-xs tracking-wider">
                    {icon} {title}
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {itemList.map((slot, idx) => (
                        <div
                            key={idx}
                            className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col items-center gap-2 relative overflow-hidden group hover:border-violet-500 transition-all"
                        >
                            <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{slot.icon || '📦'}</div>
                            <h3 className="font-bold text-slate-200 text-center text-[10px] leading-tight">{slot.name || 'Item'}</h3>

                            {/* Quantity and Use Button */}
                            <div className="w-full mt-1 flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 text-center font-bold">x{slot.quantity}</span>
                                <button
                                    onClick={() => onUse(slot)}
                                    className={`w-full py-1.5 rounded-md text-[10px] font-bold transition-colors ${buttonClass}`}
                                >
                                    {buttonText}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const hasItems = tickets.length > 0 || consumables.length > 0 || chests.length > 0;

    return (
        <div className="animate-in fade-in duration-300 min-h-[50vh]">
            {!hasItems ? (
                <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-2">
                        <Box size={40} className="opacity-20" />
                    </div>
                    <p>Tu inventario está vacío.</p>
                    <p className="text-xs text-slate-600">¡Compra recompensas en la tienda!</p>
                </div>
            ) : (
                <>
                    {/* 1. Mis Tickets */}
                    {renderSection("Mis Tickets", tickets, <Gift size={14} />)}

                    {/* 2. Mis Consumibles */}
                    {renderSection("Mis Consumibles", consumables, <Zap size={14} />)}

                    {/* 3. Mis Cofres */}
                    {renderSection("Mis Cofres", chests, <Box size={14} />)}
                </>
            )}
        </div>
    );
}
