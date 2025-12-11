import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShoppingBag, Backpack, Plus, X, Coins, Heart, Zap, Package, Sparkles } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

export default function Shop() {
    const { user, setUser } = useOutletContext(); // Necesitamos 'user' para ver el inventario
    const [activeTab, setActiveTab] = useState('shop'); // 'shop' o 'inventory'
    const [category, setCategory] = useState('reward'); // 'reward', 'consumable', 'chest'

    const [shopItems, setShopItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Estados para Modales
    const [selectedItem, setSelectedItem] = useState(null); // Para el detalle (Sheet)
    const [showCreator, setShowCreator] = useState(false); // Para crear recompensa
    const [newReward, setNewReward] = useState({ name: '', price: '' });

    // Animación de Cofre
    const [chestOpening, setChestOpening] = useState(false);

    useEffect(() => {
        fetchShop();
    }, []);

    const fetchShop = async () => {
        try {
            await api.post('/shop/seed'); // Asegurar items básicos
            const res = await api.get('/shop');
            setShopItems(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    // --- ACCIONES ---

    const handleCreate = async () => {
        if (!newReward.name || !newReward.price) return showToast("Faltan datos", "error");
        try {
            const res = await api.post('/shop/create', newReward);
            setShopItems([...shopItems, res.data]);
            setShowCreator(false);
            setNewReward({ name: '', price: '' });
            showToast("Recompensa creada");
        } catch (error) { showToast("Error creando", "error"); }
    };

    const handleBuy = async () => {
        if (!selectedItem) return;
        try {
            const res = await api.post('/shop/buy', { itemId: selectedItem._id });
            setUser(res.data.user); // Actualizar monedas e inventario global
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setSelectedItem(null); // Cerrar modal
            showToast(res.data.message);
        } catch (error) { showToast(error.response?.data?.message || "Error compra", "error"); }
    };

    const handleUse = async () => {
        if (!selectedItem) return;

        // Si es cofre, activamos animación visual antes de la llamada
        if (selectedItem.category === 'chest') {
            setSelectedItem(null); // Cerrar modal detalle
            setChestOpening(true); // Abrir animación

            setTimeout(async () => {
                try {
                    const res = await api.post('/shop/use', { itemId: selectedItem._id });
                    setUser(res.data.user);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    setChestOpening(false);
                    showToast(res.data.message, "success"); // Mensaje de qué tocó
                } catch (error) {
                    setChestOpening(false);
                    showToast("Error al abrir", "error");
                }
            }, 2000); // 2 segundos de suspense
        } else {
            // Uso normal (Pociones / Recompensas)
            try {
                const res = await api.post('/shop/use', { itemId: selectedItem._id });
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setSelectedItem(null);
                showToast(res.data.message);
            } catch (error) { showToast("Error usando objeto", "error"); }
        }
    };

    // --- FILTRADO ---

    // 1. Items de la Tienda (Filtrados por categoría)
    const filteredShopItems = shopItems.filter(item => item.category === category);

    // 2. Items del Inventario (Extraídos del user.inventory y filtrados)
    // El inventario guarda { item: {...datos}, quantity: 5 }
    const inventoryList = user?.inventory?.filter(slot => slot.item && slot.item.category === category) || [];

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen animate-in fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER TABS (TIENDA / INVENTARIO) */}
            <div className="flex bg-gray-900 p-1 rounded-2xl mb-4 border border-gray-800">
                <button
                    onClick={() => { setActiveTab('shop'); setCategory('reward'); }}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'shop' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <ShoppingBag size={18} /> Tienda
                </button>
                <button
                    onClick={() => { setActiveTab('inventory'); setCategory('reward'); }}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Backpack size={18} /> Inventario
                </button>
            </div>

            {/* SUB-CATEGORÍAS */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                {[
                    { id: 'reward', label: 'Mis Recompensas', icon: '🎟️' },
                    { id: 'consumable', label: 'Consumibles', icon: '🧪' },
                    { id: 'chest', label: 'Cofres', icon: '📦' }
                ].map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-2
                    ${category === cat.id
                                ? (activeTab === 'shop' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-purple-900/30 text-purple-400 border-purple-500/50')
                                : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700'}
                `}
                    >
                        <span>{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="grid grid-cols-2 gap-3">

                {/* BOTÓN CREAR (Solo en Tienda -> Recompensas) */}
                {activeTab === 'shop' && category === 'reward' && (
                    <div
                        onClick={() => setShowCreator(true)}
                        className="bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800 transition-all min-h-[140px]"
                    >
                        <div className="bg-gray-800 p-3 rounded-full text-blue-500"><Plus size={24} /></div>
                        <span className="text-xs font-bold text-gray-400">Crear Nueva</span>
                    </div>
                )}

                {/* LISTA DE ITEMS */}
                {activeTab === 'shop' ? (
                    // VISTA TIENDA
                    filteredShopItems.map(item => (
                        <div
                            key={item._id}
                            onClick={() => setSelectedItem(item)}
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer hover:border-blue-500/50 transition-all relative group"
                        >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h3 className="text-sm font-bold text-white leading-tight mb-1">{item.name}</h3>
                            <div className="mt-auto pt-2">
                                <span className="text-xs font-bold text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-900/30">
                                    {item.price} 💰
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    // VISTA INVENTARIO
                    inventoryList.length === 0 ? (
                        <div className="col-span-2 text-center py-10 text-gray-500 text-sm">
                            Mochila vacía. ¡Ve a la tienda!
                        </div>
                    ) : (
                        inventoryList.map(slot => (
                            <div
                                key={slot.item._id}
                                onClick={() => setSelectedItem(slot.item)} // Usamos item definition para el modal
                                className="bg-gray-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer hover:border-purple-500 transition-all relative"
                            >
                                {/* Badge Cantidad */}
                                <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg">
                                    x{slot.quantity}
                                </div>

                                <div className="text-4xl mb-3">{slot.item.icon}</div>
                                <h3 className="text-sm font-bold text-white leading-tight mb-1">{slot.item.name}</h3>
                                <p className="text-[10px] text-gray-500 mt-auto uppercase font-bold tracking-wider">En posesión</p>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* --- MODAL DETALLE (SHEET) --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-4 animate-in fade-in">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-800 p-6 animate-in slide-in-from-bottom duration-300 relative">

                        {/* Icono Gigante Flotante */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-full border-4 border-gray-900 shadow-2xl">
                            <span className="text-6xl">{selectedItem.icon}</span>
                        </div>

                        <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-gray-400"><X size={20} /></button>

                        <div className="mt-10 text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h2>

                            {/* Descripción según tipo */}
                            <p className="text-sm text-gray-400 mb-6">
                                {selectedItem.category === 'reward' && "Recompensa personalizada para disfrutar en la vida real."}
                                {selectedItem.category === 'consumable' && selectedItem.effectType === 'heal' && `Recupera +${selectedItem.effectValue} Puntos de Vida.`}
                                {selectedItem.category === 'consumable' && selectedItem.effectType === 'xp' && `Otorga +${selectedItem.effectValue} Puntos de Experiencia.`}
                                {selectedItem.category === 'chest' && "Contiene monedas, XP o vida aleatoria."}
                            </p>

                            {activeTab === 'shop' ? (
                                // MODO COMPRAR
                                <button
                                    onClick={handleBuy}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <Coins size={20} /> COMPRAR POR {selectedItem.price}
                                </button>
                            ) : (
                                // MODO USAR
                                <button
                                    onClick={handleUse}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    {selectedItem.category === 'chest' ? <Package size={20} /> : <Zap size={20} />}
                                    {selectedItem.category === 'chest' ? 'ABRIR AHORA' : 'USAR OBJETO'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CREAR RECOMPENSA --- */}
            {showCreator && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Nueva Recompensa</h3>
                            <button onClick={() => setShowCreator(false)}><X className="text-gray-400" /></button>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nombre (ej: Ver Serie)"
                            value={newReward.name}
                            onChange={e => setNewReward({ ...newReward, name: e.target.value })}
                            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 mb-3 focus:outline-none focus:border-blue-500"
                        />
                        <input
                            type="number"
                            placeholder="Precio (ej: 100)"
                            value={newReward.price}
                            onChange={e => setNewReward({ ...newReward, price: e.target.value })}
                            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 mb-4 focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={handleCreate} className="w-full bg-blue-600 py-3 rounded-xl text-white font-bold">Crear</button>
                    </div>
                </div>
            )}

            {/* --- ANIMACIÓN COFRE --- */}
            {chestOpening && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="text-9xl animate-bounce">📦</div>
                        <Sparkles className="absolute top-0 right-0 text-yellow-400 animate-spin w-16 h-16" />
                        <Sparkles className="absolute bottom-0 left-0 text-purple-400 animate-pulse w-12 h-12" />
                    </div>
                    <h2 className="text-white text-2xl font-bold mt-8 animate-pulse">Abriendo...</h2>
                </div>
            )}

        </div>
    );
}