const ShopItem = require('../models/ShopItem');
const User = require('../models/User');

// 1. OBTENER TIENDA (Items del sistema + Mis recompensas)
const getShopItems = async (req, res) => {
    try {
        const items = await ShopItem.find({
            $or: [{ user: null }, { user: req.user._id }]
        });
        res.json(items);
    } catch (error) { res.status(500).json({ message: 'Error cargando tienda' }); }
};

// 2. CREAR RECOMPENSA PERSONALIZADA
const createCustomReward = async (req, res) => {
    try {
        const { name, price } = req.body;
        const newItem = await ShopItem.create({
            user: req.user._id,
            name,
            price,
            category: 'reward',
            icon: '🎟️'
        });
        res.status(201).json(newItem);
    } catch (error) { res.status(500).json({ message: 'Error creando recompensa' }); }
};

// 3. COMPRAR ÍTEM
const buyItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);
        const item = await ShopItem.findById(itemId);

        if (!item) return res.status(404).json({ message: 'Objeto no encontrado' });
        if (user.coins < item.price) return res.status(400).json({ message: 'No tienes suficientes monedas' });

        // Restar monedas
        user.coins -= item.price;

        // Añadir al inventario (o sumar cantidad si ya existe)
        const inventoryItem = user.inventory.find(i => i.item.toString() === itemId);
        if (inventoryItem) {
            inventoryItem.quantity += 1;
        } else {
            user.inventory.push({ item: itemId, quantity: 1 });
        }

        await user.save();

        // Devolvemos usuario actualizado para refrescar monedas e inventario
        const populatedUser = await user.populate('inventory.item');
        res.json({ message: `¡Compraste ${item.name}!`, user: populatedUser });

    } catch (error) { res.status(500).json({ message: 'Error en la compra' }); }
};

// 4. USAR ÍTEM (Consumir / Abrir Cofre)
const useItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        // Importante: Hacemos populate para acceder a los datos del objeto
        const user = await User.findById(req.user._id).populate('inventory.item');

        const inventoryIndex = user.inventory.findIndex(i => i.item._id.toString() === itemId);
        if (inventoryIndex === -1) return res.status(400).json({ message: 'No tienes este objeto' });

        const entry = user.inventory[inventoryIndex];
        const itemDef = entry.item;
        let rewardMessage = `Usaste ${itemDef.name}`;

        // LÓGICA SEGÚN TIPO
        if (itemDef.category === 'consumable') {
            if (itemDef.effectType === 'heal') user.lives = Math.min(100, user.lives + itemDef.effectValue);
            if (itemDef.effectType === 'xp') user.currentXP += itemDef.effectValue;
        }
        else if (itemDef.category === 'chest') {
            // Lógica de Cofre Aleatorio
            const roll = Math.random();
            let prize = "";

            if (roll < 0.5) {
                const coins = Math.floor(Math.random() * 50) + 10;
                user.coins += coins;
                prize = `+${coins} Monedas`;
            } else if (roll < 0.8) {
                const xp = Math.floor(Math.random() * 100) + 20;
                user.currentXP += xp;
                prize = `+${xp} XP`;
            } else {
                user.lives = Math.min(100, user.lives + 1);
                prize = "+1 Vida";
            }
            rewardMessage = `¡Cofre abierto! Ganaste: ${prize}`;
        }

        // Restar cantidad o borrar del inventario
        if (entry.quantity > 1) {
            entry.quantity -= 1;
        } else {
            user.inventory.splice(inventoryIndex, 1);
        }

        await user.save();
        res.json({ message: rewardMessage, user });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error usando objeto' });
    }
};

// 5. SEED (Llenar tienda con objetos básicos del sistema)
const seedShop = async (req, res) => {
    const count = await ShopItem.countDocuments({ user: null });
    if (count > 0) return res.json({ message: 'Tienda ya inicializada' });

    const basics = [
        { name: 'Poción de Vida', price: 50, category: 'consumable', effectType: 'heal', effectValue: 5, icon: '❤️' },
        { name: 'Poción de XP', price: 100, category: 'consumable', effectType: 'xp', effectValue: 500, icon: '🧪' },
        { name: 'Cofre Común', price: 30, category: 'chest', icon: '📦' },
        { name: 'Cofre Épico', price: 150, category: 'chest', icon: '💎' },
    ];
    await ShopItem.insertMany(basics);
    res.json({ message: 'Tienda surtida' });
};

module.exports = { getShopItems, createCustomReward, buyItem, useItem, seedShop };