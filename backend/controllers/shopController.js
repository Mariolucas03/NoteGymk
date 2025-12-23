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

        // CORRECCIÓN: Usar user.coins directo
        if ((user.coins || 0) < item.price) return res.status(400).json({ message: 'Sin saldo' });

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
        // Populate para acceder a los datos del item dentro del inventario
        const user = await User.findById(req.user._id).populate('inventory.item');

        const index = user.inventory.findIndex(i => i.item && i.item._id.toString() === itemId);
        if (index === -1) return res.status(400).json({ message: 'No tienes este objeto' });

        const entry = user.inventory[index];
        const item = entry.item;
        let msg = `Usado: ${item.name}`;

        // --- LÓGICA POR CATEGORÍA ---

        // 1. PREMIOS PERSONALIZADOS (Solo se consumen y dan un mensaje bonito)
        if (item.category === 'reward') {
            msg = `¡Disfruta tu recompensa: "${item.name}"! 🎉`;
        }

        // 2. CONSUMIBLES (Lógica existente)
        if (item.category === 'consumable') {
            if (item.effectType === 'heal') {
                const currentHp = user.hp || 0;
                const maxHp = user.maxHp || 100;
                user.hp = Math.min(maxHp, currentHp + item.effectValue);
                user.lives = user.hp; // Sincro
                msg = `¡Recuperaste ${item.effectValue} HP!`;
            }
            if (item.effectType === 'xp') {
                user.currentXP = (user.currentXP || 0) + item.effectValue;
                msg = `¡Ganaste ${item.effectValue} XP!`;
            }
        }

        // 3. COFRES (Lógica existente)
        if (item.category === 'chest') {
            const roll = Math.random();
            if (roll < 0.6) {
                const coins = Math.floor(Math.random() * 100) + 50;
                user.coins = (user.coins || 0) + coins;
                msg = `¡El cofre tenía ${coins} Monedas!`;
            } else {
                const xp = Math.floor(Math.random() * 300) + 100;
                user.currentXP = (user.currentXP || 0) + xp;
                msg = `¡El cofre tenía ${xp} XP!`;
            }
        }

        // --- CONSUMIR EL OBJETO ---
        // Reducimos cantidad o eliminamos del array
        if (entry.quantity > 1) {
            entry.quantity--;
        } else {
            user.inventory.splice(index, 1);
        }

        await user.save();

        // Devolvemos usuario actualizado con populate para refrescar el inventario en frontend
        const updatedUser = await User.findById(user._id).populate('inventory.item');

        res.json({ message: msg, user: updatedUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error usando objeto' });
    }
};

const exchangeCurrency = async (req, res) => {
    try {
        const { amountGameCoins } = req.body;

        if (!amountGameCoins || amountGameCoins <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida' });
        }

        const user = await User.findById(req.user._id);

        // CORRECCIÓN: Usar user.gameCoins directo
        if ((user.gameCoins || 0) < amountGameCoins) {
            return res.status(400).json({ message: 'No tienes suficientes fichas' });
        }

        // Ratio: 10 Fichas = 1 Moneda
        const coinsToReceive = Math.floor(amountGameCoins / 10);

        if (coinsToReceive < 1) {
            return res.status(400).json({ message: 'Mínimo 10 fichas para cambiar.' });
        }

        user.gameCoins -= amountGameCoins;
        user.coins = (user.coins || 0) + coinsToReceive;

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

// @desc    RESETEAR TIENDA (Modo Limpieza)
const seedShop = async (req, res) => {
    try {
        // 1. Borramos TODOS los objetos que no sean recompensas personalizadas del usuario
        // (Mantenemos las recompensas que tú hayas creado manualmente, si las hay)
        await ShopItem.deleteMany({ category: { $ne: 'reward' } });

        res.json({ message: '🧹 Tienda vaciada correctamente. Lista para construir.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error limpiando tienda' });
    }
};

module.exports = { getShopItems, createCustomReward, buyItem, useItem, seedShop, exchangeCurrency };