import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, Coins, X, Plus } from 'lucide-react';
import { apiCall } from '../utils/api';
import StoreFront from '../components/shop/StoreFront';
import Inventory from '../components/shop/Inventory';
import { useUser } from '../context/UserContext';
import RewardPopup from '../components/shop/RewardPopup';

// Static Items Configuration
const STATIC_ITEMS = {
    consumables: [
        { name: "Pack 5 Vidas", cost: 100, icon: "❤️", category: "consumable", type: "static" },
        { name: "Botella 100 XP", cost: 150, icon: "🧪", category: "consumable", type: "static" },
    ],
    chests: [
        { name: "Cofre Bronce", cost: 100, icon: "📦", category: "chest", type: "static" },
        { name: "Cofre Plata", cost: 250, icon: "🗳️", category: "chest", type: "static" },
        { name: "Cofre Oro", cost: 500, icon: "⚱️", category: "chest", type: "static" },
    ]
};

export default function Shop() {
    const { user, refreshUser } = useUser();
    const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'inventory'
    const [tickets, setTickets] = useState([]); // User created rewards
    const [isLoading, setIsLoading] = useState(false);
    const [rewardMessage, setRewardMessage] = useState(null); // Reward Popup State

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // For Detail Modal

    // Create Item Form State
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');

    useEffect(() => {
        if (activeTab === 'buy') {
            fetchTickets();
        }
    }, [activeTab]);

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const data = await apiCall('/shop'); // Fetches user created rewards
            setTickets(data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyItem = async () => {
        if (!selectedItem) return;

        try {
            // We pass the full item object as requested
            await apiCall('/shop/buy', 'POST', selectedItem);
            refreshUser();
            setSelectedItem(null); // Close modal

        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            const newItem = {
                name: newItemName,
                cost: parseInt(newItemCost),
            };
            const createdItem = await apiCall('/shop', 'POST', newItem);
            setTickets(prev => [...prev, createdItem]);
            setIsCreateModalOpen(false);
            setNewItemName('');
            setNewItemCost('');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUseItem = async (item) => {
        try {
            const data = await apiCall(`/shop/use/${item._id}`, 'POST');
            refreshUser();
            setRewardMessage(data.message); // Show Popup instead of Alert
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="pb-24">
            {/* Header / Tabs */}
            {/* Header / Tabs */}
            <div className="flex items-center justify-between gap-4 mb-6 px-4">
                <div className="flex items-center gap-4 mx-auto">
                    <button
                        onClick={() => setActiveTab('buy')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'buy'
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <ShoppingBag size={18} />
                        Tienda
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'inventory'
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Package size={18} />
                        Inventario
                    </button>
                </div>

                {activeTab === 'buy' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-full shadow-lg shadow-violet-900/20 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {activeTab === 'buy' && (
                    <StoreFront
                        items={STATIC_ITEMS}
                        userRewards={tickets}
                        onBuy={setSelectedItem}
                        onCreateReward={() => setIsCreateModalOpen(true)}
                    />
                )}
                {activeTab === 'inventory' && (
                    <Inventory
                        items={user?.inventory}
                        onUse={handleUseItem}
                    />
                )}
            </div>

            {/* Create Item Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Crear Recompensa</h2>
                        <form onSubmit={handleCreateItem} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl outline-none focus:border-violet-500"
                                    placeholder="Ej. Cena Pizza"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Coste (Monedas)</label>
                                <input
                                    type="number"
                                    value={newItemCost}
                                    onChange={(e) => setNewItemCost(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl outline-none focus:border-violet-500"
                                    placeholder="Ej. 50"
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail / Buy Modal */}
            {selectedItem && (() => {
                const canAfford = (user?.coins || 0) >= selectedItem.cost;

                return (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                        <div className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-200 relative">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div className="text-6xl">{selectedItem.icon}</div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-white">{selectedItem.name}</h2>
                                    <p className="text-slate-400 text-sm capitalize">{selectedItem.category}</p>
                                </div>
                                <div className={`flex items-center gap-2 font-bold text-xl px-4 py-2 rounded-full ${canAfford ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                    <Coins size={20} fill="currentColor" />
                                    {selectedItem.cost}
                                </div>
                            </div>

                            <button
                                onClick={handleBuyItem}
                                disabled={!canAfford}
                                className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg ${canAfford
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white active:scale-95 shadow-violet-900/20'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                                    }`}
                            >
                                {canAfford ? 'COMPRAR' : 'Saldo Insuficiente'}
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Custom Reward Popup */}
            <RewardPopup
                isOpen={!!rewardMessage}
                message={rewardMessage}
                onClose={() => setRewardMessage(null)}
            />
        </div>
    );
}
