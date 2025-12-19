import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Plus, X, ArrowLeft, RefreshCw, ArrowRightLeft, Gamepad2,
    Ticket, Heart, User, ScanFace, Palette, Package, PawPrint, Crown
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

const CATEGORIES = [
    { id: 'reward', label: 'PREMIOS', icon: <Ticket size={32} /> },
    { id: 'consumable', label: 'POCIONES', icon: <Heart size={32} /> },
    { id: 'avatar', label: 'AVATAR', icon: <User size={32} /> },
    { id: 'frame', label: 'MARCOS', icon: <ScanFace size={32} /> },
    { id: 'theme', label: 'TEMAS', icon: <Palette size={32} /> },
    { id: 'chest', label: 'COFRES', icon: <Package size={32} /> },
    { id: 'pet', label: 'MASCOTAS', icon: <PawPrint size={32} /> },
    { id: 'title', label: 'TÍTULOS', icon: <Crown size={32} /> },
];

export default function Shop() {
    const { user, setUser } = useOutletContext();
    const [activeTab, setActiveTab] = useState('shop');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [shopItems, setShopItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Exchange States
    const [showExchange, setShowExchange] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(50);

    const [selectedItem, setSelectedItem] = useState(null);
    const [showCreator, setShowCreator] = useState(false);
    const [newReward, setNewReward] = useState({ name: '', price: '' });
    const [chestOpening, setChestOpening] = useState(false);

    useEffect(() => { fetchShop(); }, []);
    useEffect(() => { setSelectedCategory(null); }, [activeTab]);

    const fetchShop = async () => {
        try {
            const res = await api.get('/shop');
            setShopItems(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    const handleExchange = async () => {
        try {
            const res = await api.post('/shop/exchange', { amountGameCoins: parseInt(exchangeAmount) });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            showToast(res.data.message);
            setShowExchange(false);
        } catch (error) {
            showToast(error.response?.data?.message || "Error", "error");
        }
    };

    // ... (handleForceReset, handleCreate, handleBuy, handleUse, getFilteredItems, getButtonText igual que antes)
    // Para ahorrar espacio, asumo que copias esas funciones que no han cambiado.
    const handleForceReset = async () => { /* ... */ };
    const handleCreate = async () => { /* ... */ };
    const handleBuy = async () => {
        if (!selectedItem) return;
        try {
            const res = await api.post('/shop/buy', { itemId: selectedItem._id });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setSelectedItem(null);
            showToast(res.data.message);
        } catch (error) { showToast(error.response?.data?.message || "Error compra", "error"); }
    };
    const handleUse = async () => { /* ... */ };
    const getFilteredItems = () => {
        if (!selectedCategory) return [];
        if (activeTab === 'shop') return shopItems.filter(item => item.category === selectedCategory);
        return (user?.inventory || []).filter(slot => slot.item && slot.item.category === selectedCategory);
    };
    const getButtonText = (cat) => {
        if (cat === 'chest') return 'ABRIR';
        if (['reward', 'consumable'].includes(cat)) return 'USAR';
        return 'EQUIPAR';
    };

    const itemsToShow = getFilteredItems();

    return (
        <div className="pb-24 pt-2 px-4 min-h-screen bg-black text-white font-sans animate-in fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* TOGGLE */}
            <div className="flex w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6 h-12 relative p-1 mt-2">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gray-700 rounded-lg transition-all duration-300 ease-out ${activeTab === 'inventory' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
                <button onClick={() => setActiveTab('shop')} className={`flex-1 z-10 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'shop' ? 'text-white' : 'text-gray-500'}`}>TIENDA</button>
                <button onClick={() => setActiveTab('inventory')} className={`flex-1 z-10 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'inventory' ? 'text-white' : 'text-gray-500'}`}>MOCHILA</button>
            </div>

            {/* 🔥 BARRA DE INTERCAMBIO (NUEVO) */}
            {activeTab === 'shop' && !selectedCategory && (
                <div className="mb-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-purple-300 font-bold uppercase mb-1">Tu saldo de juego</p>
                        <div className="flex items-center gap-2">
                            <Gamepad2 size={20} className="text-purple-400" />
                            <span className="text-2xl font-black text-white">{user?.stats?.gameCoins || 0}</span>
                            <span className="text-xs text-gray-400">Fichas</span>
                        </div>
                    </div>
                    <button onClick={() => setShowExchange(true)} className="bg-purple-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-purple-500 transition-transform active:scale-95 text-white">
                        <ArrowRightLeft size={16} /> CANJEAR
                    </button>
                </div>
            )}

            {/* CATEGORÍAS (Igual que antes) */}
            {!selectedCategory ? (
                <div className="grid grid-cols-2 gap-3 pb-8">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="aspect-[4/3] bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 cursor-pointer group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/0 to-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-gray-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 relative z-10">{cat.icon}</div>
                            <span className="font-bold text-[10px] sm:text-xs text-gray-400 group-hover:text-white tracking-wider relative z-10 uppercase truncate w-full text-center px-1">{cat.label}</span>
                        </div>
                    ))}
                </div>
            ) : (
                /* ITEMS */
                <div className="animate-in fade-in slide-in-from-right-4 pb-20">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setSelectedCategory(null)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 active:scale-90 transition-transform"><ArrowLeft size={20} /></button>
                        <h2 className="text-xl font-bold uppercase tracking-wide text-gray-200">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {activeTab === 'shop' && selectedCategory === 'reward' && (
                            <div onClick={() => setShowCreator(true)} className="aspect-square border-2 border-dashed border-gray-800 bg-transparent rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-gray-600 hover:bg-gray-900 transition-all cursor-pointer">
                                <div className="bg-gray-800 p-2 rounded-full"><Plus size={24} /></div>
                                <span className="text-xs font-bold text-gray-500 uppercase">Crear</span>
                            </div>
                        )}
                        {itemsToShow.map(slotOrItem => {
                            const item = activeTab === 'shop' ? slotOrItem : slotOrItem.item;
                            return (
                                <div key={item._id} onClick={() => setSelectedItem(item)} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-between relative hover:border-gray-600 transition-all cursor-pointer group min-h-[160px]">
                                    <div className="text-4xl mt-2 mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon || '📦'}</div>
                                    <div className="text-center w-full">
                                        <h3 className="text-xs font-bold text-white truncate w-full mb-1">{item.name}</h3>
                                        <p className="text-[9px] text-gray-500 line-clamp-2 leading-tight px-1 mb-2 h-6 overflow-hidden">{item.description}</p>
                                        {activeTab === 'shop' && <div className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded inline-block">{item.price} $</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL DETALLE (Igual que antes) */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95">
                    <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-6 relative flex flex-col items-center text-center shadow-2xl">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={24} /></button>
                        <div className="text-6xl mb-4 animate-bounce-slow">{selectedItem.icon}</div>
                        <h2 className="text-2xl font-black uppercase text-white mb-2">{selectedItem.name}</h2>
                        <button onClick={activeTab === 'shop' ? handleBuy : handleUse} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-white text-black hover:bg-gray-200 mt-6">
                            {activeTab === 'shop' ? `COMPRAR • ${selectedItem.price}` : getButtonText(selectedItem.category)}
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 MODAL DE CAMBIO */}
            {showExchange && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-gray-700 p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ArrowRightLeft /> Casa de Cambio</h3>

                        <div className="flex items-center justify-between mb-6 bg-black/40 p-4 rounded-2xl">
                            <div className="text-center">
                                <span className="block text-2xl font-black text-purple-400">{exchangeAmount}</span>
                                <span className="text-[10px] text-gray-500 uppercase">Fichas</span>
                            </div>
                            <div className="text-gray-600">➔</div>
                            <div className="text-center">
                                <span className="block text-2xl font-black text-yellow-400">{Math.floor(exchangeAmount / 10)}</span>
                                <span className="text-[10px] text-gray-500 uppercase">Monedas</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Cantidad a cambiar</label>
                            <input
                                type="number"
                                step="10"
                                min="10"
                                value={exchangeAmount}
                                onChange={e => setExchangeAmount(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white font-bold text-center focus:border-purple-500 outline-none"
                            />
                            <div className="flex justify-between mt-2">
                                <button onClick={() => setExchangeAmount(10)} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 hover:text-white">Min</button>
                                <button onClick={() => setExchangeAmount(user?.stats?.gameCoins || 0)} className="text-xs bg-gray-800 px-2 py-1 rounded text-purple-400 hover:text-purple-300">Max</button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowExchange(false)} className="flex-1 py-3 bg-gray-800 rounded-xl font-bold text-gray-400 hover:text-white">Cancelar</button>
                            <button onClick={handleExchange} className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}