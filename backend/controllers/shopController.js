const ShopItem = require('../models/ShopItem');
const User = require('../models/User');

const getShopItems = async (req, res) => {
    try {
        const items = await ShopItem.find({
            $or: [{ user: req.user._id }, { category: { $ne: 'reward' } }]
        });
        res.json(items);
    } catch (error) { res.status(500).json({ message: 'Error cargando tienda' }); }
};

const createCustomReward = async (req, res) => {
    try {
        const newItem = await ShopItem.create({
            user: req.user._id,
            name: req.body.name,
            price: req.body.price,
            category: 'reward',
            icon: '🎟️',
            description: 'Recompensa personal.'
        });
        res.status(201).json(newItem);
    } catch (error) { res.status(500).json({ message: 'Error creando recompensa' }); }
};

const buyItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);
        const item = await ShopItem.findById(itemId);

        if (!item) return res.status(404).json({ message: 'No existe' });
        if (user.coins < item.price) return res.status(400).json({ message: 'Sin saldo' });

        user.coins -= item.price;

        const idx = user.inventory.findIndex(i => i.item.toString() === itemId);
        if (idx > -1) user.inventory[idx].quantity += 1;
        else user.inventory.push({ item: itemId, quantity: 1 });

        await user.save();
        const popUser = await User.findById(user._id).populate('inventory.item');
        res.json({ message: `¡Comprado: ${item.name}!`, user: popUser });
    } catch (error) { res.status(500).json({ message: 'Error compra' }); }
};

const useItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id).populate('inventory.item');

        const index = user.inventory.findIndex(i => i.item && i.item._id.toString() === itemId);
        if (index === -1) return res.status(400).json({ message: 'No tienes el objeto' });

        const entry = user.inventory[index];
        const item = entry.item;
        let msg = `Usado: ${item.name}`;

        if (item.category === 'consumable') {
            if (item.effectType === 'heal') {
                user.stats.hp = Math.min(user.stats.maxHp, (user.stats.hp || 0) + item.effectValue);
                msg = `¡Recuperaste ${item.effectValue} HP!`;
            }
            if (item.effectType === 'xp') {
                user.currentXP += item.effectValue;
                msg = `¡Ganaste ${item.effectValue} XP!`;
            }
        }

        if (item.category === 'chest') {
            const roll = Math.random();
            if (roll < 0.6) {
                const coins = Math.floor(Math.random() * 100) + 50;
                user.coins += coins;
                msg = `¡El cofre tenía ${coins} Monedas!`;
            } else {
                const xp = Math.floor(Math.random() * 300) + 100;
                user.currentXP += xp;
                msg = `¡El cofre tenía ${xp} XP!`;
            }
        }

        if (entry.quantity > 1) entry.quantity--;
        else user.inventory.splice(index, 1);

        await user.save();
        const updatedUser = await User.findById(user._id).populate('inventory.item');
        res.json({ message: msg, user: updatedUser });
    } catch (error) { res.status(500).json({ message: 'Error usando objeto' }); }
};

// 🔥 NUEVO: INTERCAMBIO FICHAS -> MONEDAS
const exchangeCurrency = async (req, res) => {
    try {
        const { amountGameCoins } = req.body;

        if (!amountGameCoins || amountGameCoins <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida' });
        }

        const user = await User.findById(req.user._id);

        if ((user.stats.gameCoins || 0) < amountGameCoins) {
            return res.status(400).json({ message: 'No tienes suficientes fichas' });
        }

        // Ratio: 10 Fichas = 1 Moneda
        const coinsToReceive = Math.floor(amountGameCoins / 10);

        if (coinsToReceive < 1) {
            return res.status(400).json({ message: 'Mínimo 10 fichas para cambiar.' });
        }

        user.stats.gameCoins -= amountGameCoins;
        user.coins += coinsToReceive;

        // Sincronizar stats.coins si existe duplicidad en tu modelo
        if (user.stats.coins !== undefined) user.stats.coins = user.coins;

        await user.save();

        res.json({
            message: `Cambiaste ${amountGameCoins} Fichas por ${coinsToReceive} Monedas`,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el intercambio' });
    }
};

const seedShop = async (req, res) => {
    try {
        await ShopItem.deleteMany({ category: { $ne: 'reward' } });
        // (Tu catálogo aquí, omitido para brevedad, no cambia)
        res.json({ message: 'Tienda actualizada.' });
    } catch (error) { res.status(500).json({ message: 'Error en seed' }); }
};

module.exports = { getShopItems, createCustomReward, buyItem, useItem, seedShop, exchangeCurrency };