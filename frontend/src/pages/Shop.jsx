import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Plus, X, ArrowLeft, RefreshCw, ArrowRightLeft, Gamepad2,
    Ticket, Heart, User, ScanFace, Palette, Package, PawPrint, Crown,
    ShoppingBag, Backpack, Coins, Save
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

// Categorías Visuales
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

    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState('shop'); // 'shop' o 'inventory'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [shopItems, setShopItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Exchange (Canje)
    const [showExchange, setShowExchange] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(50);

    // Item Selection & Creation
    const [selectedItem, setSelectedItem] = useState(null);
    const [showCreator, setShowCreator] = useState(false);
    const [newReward, setNewReward] = useState({ name: '', price: '' });

    // --- CARGA INICIAL ---
    useEffect(() => {
        fetchShop();
    }, []);

    // Resetear categoría al cambiar de pestaña
    useEffect(() => {
        setSelectedCategory(null);
    }, [activeTab]);

    const fetchShop = async () => {
        setLoading(true);
        try {
            const res = await api.get('/shop');
            setShopItems(res.data);
        } catch (error) {
            console.error("Error cargando tienda:", error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    // --- ACCIONES DE TIENDA ---

    // 1. Limpiar Tienda (Admin)
    const handleResetShop = async () => {
        if (!window.confirm("⚠️ ¿Vaciar toda la tienda? Esto borrará todos los productos.")) return;
        try {
            await api.post('/shop/seed');
            fetchShop();
            showToast("Tienda vaciada correctamente", "info");
        } catch (error) {
            showToast("Error al vaciar tienda", "error");
        }
    };

    // 2. Canjear Fichas por Monedas
    const handleExchange = async () => {
        try {
            const res = await api.post('/shop/exchange', { amountGameCoins: parseInt(exchangeAmount) });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            showToast(res.data.message);
            setShowExchange(false);
        } catch (error) {
            showToast(error.response?.data?.message || "Error en canje", "error");
        }
    };

    // 3. Crear Recompensa Personalizada
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newReward.name || !newReward.price) return showToast("Faltan datos", "error");

        try {
            const res = await api.post('/shop/create', {
                name: newReward.name,
                price: parseInt(newReward.price)
            });
            // Añadimos el nuevo item a la lista local para no tener que recargar todo
            setShopItems([res.data, ...shopItems]);
            setShowCreator(false);
            setNewReward({ name: '', price: '' });
            showToast("Recompensa creada");
        } catch (error) {
            showToast("Error creando recompensa", "error");
        }
    };

    // 4. Comprar Objeto
    const handleBuy = async () => {
        if (!selectedItem) return;
        try {
            const res = await api.post('/shop/buy', { itemId: selectedItem._id });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setSelectedItem(null);
            showToast(res.data.message);
        } catch (error) {
            showToast(error.response?.data?.message || "Saldo insuficiente", "error");
        }
    };

    // 5. Usar Objeto
    const handleUse = async () => {
        if (!selectedItem) return;
        try {
            const res = await api.post('/shop/use', { itemId: selectedItem._id });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setSelectedItem(null);
            showToast(res.data.message); // Muestra "Disfruta tu premio..."
        } catch (error) {
            showToast(error.response?.data?.message || "Error al usar", "error");
        }
    };

    // --- FILTRADO DE ITEMS ---
    const getFilteredItems = () => {
        if (!selectedCategory) return [];

        if (activeTab === 'shop') {
            return shopItems.filter(item => item.category === selectedCategory);
        } else {
            return (user?.inventory || []).filter(slot => slot.item && slot.item.category === selectedCategory);
        }
    };

    const getButtonText = (cat) => {
        if (cat === 'chest') return 'ABRIR';
        if (['reward', 'consumable'].includes(cat)) return 'USAR';
        return 'EQUIPAR';
    };

    const itemsToShow = getFilteredItems();

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in select-none">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* --- HEADER --- */}
            <div className="bg-gray-900/80 p-4 rounded-3xl border border-gray-800 shadow-xl backdrop-blur-md sticky top-4 z-20 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tu Saldo</span>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-yellow-400">
                                <Coins size={18} />
                                <span className="text-xl font-black text-white">{user?.coins || 0}</span>
                            </div>
                            <div className="w-[1px] h-6 bg-gray-700"></div>
                            <div className="flex items-center gap-1.5 text-purple-400">
                                <Gamepad2 size={18} />
                                <span className="text-xl font-black text-white">{user?.stats?.gameCoins || 0}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleResetShop} className="bg-gray-800 p-2 rounded-xl text-gray-500 hover:text-red-400 transition-colors border border-gray-700">
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Toggle Tienda / Mochila */}
                <div className="flex bg-gray-950 p-1 rounded-2xl relative">
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gray-700 rounded-xl transition-all duration-300 ease-out ${activeTab === 'inventory' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
                    <button onClick={() => setActiveTab('shop')} className={`flex-1 z-10 font-bold text-xs flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${activeTab === 'shop' ? 'text-white' : 'text-gray-500'}`}>
                        <ShoppingBag size={16} /> TIENDA
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`flex-1 z-10 font-bold text-xs flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${activeTab === 'inventory' ? 'text-white' : 'text-gray-500'}`}>
                        <Backpack size={16} /> MOCHILA
                    </button>
                </div>
            </div>

            {/* --- BARRA DE CANJE --- */}
            {activeTab === 'shop' && !selectedCategory && (
                <div className="mb-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-full text-white"><ArrowRightLeft size={20} /></div>
                        <div>
                            <p className="text-xs text-purple-200 font-bold uppercase">Casa de Cambio</p>
                            <p className="text-[10px] text-gray-400">Fichas ➔ Monedas</p>
                        </div>
                    </div>
                    <button onClick={() => setShowExchange(true)} className="bg-purple-600 px-4 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-purple-500 transition-transform active:scale-95 text-white">
                        CANJEAR
                    </button>
                </div>
            )}

            {/* --- GRID DE CATEGORÍAS --- */}
            {!selectedCategory ? (
                <div className="grid grid-cols-2 gap-3 pb-8 animate-in fade-in slide-in-from-bottom-4">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="aspect-[4/3] bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 cursor-pointer group relative overflow-hidden shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/0 to-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-gray-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 relative z-10">{cat.icon}</div>
                            <span className="font-black text-[10px] text-gray-500 group-hover:text-white tracking-widest relative z-10 uppercase">{cat.label}</span>
                        </div>
                    ))}
                </div>
            ) : (
                /* --- VISTA DE PRODUCTOS --- */
                <div className="animate-in fade-in slide-in-from-right-8 pb-20">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setSelectedCategory(null)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 active:scale-90 transition-transform text-white border border-gray-700"><ArrowLeft size={20} /></button>
                        <h2 className="text-xl font-black uppercase tracking-wide text-white">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 animate-pulse">Cargando stock...</div>
                    ) : itemsToShow.length === 0 && activeTab === 'inventory' ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-50 border-2 border-dashed border-gray-800 rounded-3xl">
                            <div className="mb-4"><Backpack size={48} /></div>
                            <p className="text-sm font-bold uppercase tracking-wide">Mochila vacía</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {/* Botón Crear Propio (Solo en Premios de Tienda) */}
                            {activeTab === 'shop' && selectedCategory === 'reward' && (
                                <div onClick={() => setShowCreator(true)} className="aspect-square border-2 border-dashed border-gray-700 bg-transparent rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-gray-500 hover:bg-gray-900 transition-all cursor-pointer group">
                                    <div className="bg-gray-800 p-3 rounded-full text-gray-400 group-hover:text-white transition-colors"><Plus size={24} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-white">Crear Nuevo</span>
                                </div>
                            )}

                            {/* Lista de Items */}
                            {itemsToShow.map(slotOrItem => {
                                const item = activeTab === 'shop' ? slotOrItem : slotOrItem.item;
                                return (
                                    <div key={item._id} onClick={() => setSelectedItem(item)} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-between relative hover:border-gray-600 transition-all cursor-pointer group min-h-[160px] shadow-lg">
                                        <div className="text-4xl mt-2 mb-2 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">{item.icon || '📦'}</div>
                                        <div className="text-center w-full">
                                            <h3 className="text-xs font-bold text-white truncate w-full mb-1 uppercase">{item.name}</h3>
                                            <p className="text-[9px] text-gray-500 line-clamp-2 leading-tight px-1 mb-2 h-6 overflow-hidden">{item.description}</p>
                                            {activeTab === 'shop' && (
                                                <div className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded inline-block border border-yellow-500/20 font-bold">
                                                    {item.price} $
                                                </div>
                                            )}
                                            {activeTab === 'inventory' && (
                                                <div className="text-[9px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded inline-block">
                                                    x{slotOrItem.quantity}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* --- MODALES --- */}

            {/* Modal Detalle / Compra / Uso */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95">
                    <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-8 relative flex flex-col items-center text-center shadow-2xl">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-800 p-2 rounded-full"><X size={20} /></button>

                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-gray-700">
                            <div className="text-6xl animate-bounce-slow filter drop-shadow-lg">{selectedItem.icon}</div>
                        </div>

                        <h2 className="text-2xl font-black uppercase text-white mb-2 leading-tight">{selectedItem.name}</h2>
                        <p className="text-sm text-gray-400 mb-6">{selectedItem.description || "Recompensa personalizada"}</p>

                        <button
                            onClick={activeTab === 'shop' ? handleBuy : handleUse}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg transition-transform active:scale-95 ${activeTab === 'shop' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                        >
                            {activeTab === 'shop' ? `COMPRAR • ${selectedItem.price}` : getButtonText(selectedItem.category)}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Crear Recompensa */}
            {showCreator && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95">
                    <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-6 relative shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Ticket className="text-yellow-500" /> Nuevo Premio</h3>
                            <button onClick={() => setShowCreator(false)} className="text-gray-500 hover:text-white bg-gray-800 p-2 rounded-full"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre</label>
                                <input type="text" placeholder="Ej: 1h Videojuegos" autoFocus value={newReward.name} onChange={e => setNewReward({ ...newReward, name: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Precio (Monedas)</label>
                                <input type="number" placeholder="Ej: 100" value={newReward.price} onChange={e => setNewReward({ ...newReward, price: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none mt-1" />
                            </div>
                            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-xl mt-2 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Save size={18} /> CREAR PREMIO
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Canje */}
            {showExchange && (
                <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-gray-700 p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><ArrowRightLeft className="text-purple-500" /> Casa de Cambio</h3>
                            <button onClick={() => setShowExchange(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="flex items-center justify-between mb-6 bg-black/40 p-4 rounded-2xl border border-gray-800">
                            <div className="text-center">
                                <span className="block text-2xl font-black text-purple-400">{exchangeAmount}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Fichas</span>
                            </div>
                            <div className="text-gray-600"><ArrowRightLeft size={24} /></div>
                            <div className="text-center">
                                <span className="block text-2xl font-black text-yellow-400">{Math.floor(exchangeAmount / 10)}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Monedas</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block ml-1">Cantidad a cambiar (Mín 10)</label>
                            <input
                                type="number"
                                step="10"
                                min="10"
                                value={exchangeAmount}
                                onChange={e => setExchangeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white font-bold text-center text-xl focus:border-purple-500 outline-none transition-colors"
                            />
                            <div className="flex justify-between mt-2 gap-2">
                                <button onClick={() => setExchangeAmount(10)} className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white border border-gray-700">Mínimo</button>
                                <button onClick={() => setExchangeAmount(user?.stats?.gameCoins || 0)} className="text-xs bg-purple-900/30 px-3 py-1.5 rounded-lg text-purple-400 hover:text-purple-300 border border-purple-500/30">Máximo</button>
                            </div>
                        </div>

                        <button onClick={handleExchange} className="w-full py-4 bg-purple-600 text-white rounded-xl font-black shadow-lg hover:bg-purple-500 active:scale-95 transition-all">
                            CONFIRMAR CANJE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}