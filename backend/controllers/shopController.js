const User = require('../models/User');

// POST /api/shop/buy
exports.buyItem = async (req, res) => {
    console.log("--- INTENTO DE COMPRA ---");
    console.log("Datos recibidos:", req.body);
    try {
        const { name, cost, icon, category, type } = req.body;

        // 0. Validar Datos
        if (!name) {
            return res.status(400).json({ message: "El ítem debe tener un nombre." });
        }

        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // 1. Validar Monedas
        if (user.coins < cost) {
            return res.status(400).json({ message: 'No tienes suficientes monedas' });
        }

        // 2. Restar Coste
        user.coins -= Number(cost);

        // 3. Buscar si ya existe en inventario (Flat Schema Search)
        const existingItemIndex = user.inventory.findIndex(item => item.name === name);

        if (existingItemIndex > -1) {
            // Incrementar cantidad
            user.inventory[existingItemIndex].quantity += 1;
        } else {
            // Añadir nuevo (Flat Schema Push)
            user.inventory.push({
                name: name, // Obligatorio
                cost: Number(cost) || 0,
                icon: icon || '📦',
                category: category || 'general',
                type: type || 'static',
                quantity: 1
            });
        }

        // 4. Guardar
        user.markModified('inventory'); // Fundamental para arrays mixtos
        await user.save();

        console.log("✅ Compra exitosa. Inventario actualizado.");

        // Devolver usuario actualizado (como pidió el usuario) o { message, user }
        res.json(user);

    } catch (err) {
        console.error("❌ ERROR FATAL EN COMPRA:", err);
        res.status(500).json({ message: 'Error en el servidor al comprar: ' + err.message });
    }
};

// POST /api/shop/use/:itemId
exports.useItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let inventorySlot = user.inventory.id(itemId);

        // Fallback: search by name if ID search fails (in case frontend passes name or something else)
        if (!inventorySlot) {
            return res.status(404).json({ message: 'Item no encontrado en inventario' });
        }

        const item = inventorySlot; // In flat schema, the slot IS the item
        let message = '';
        let rewardText = '';

        // --- LOGIC PER CATEGORY ---

        // 1. TICKETS (Custom Rewards) -> "Tirar"
        if (item.category === 'ticket' || !item.category) {
            message = "Ticket eliminado 🗑️";
            // No Action, just remove.
        }

        // 2. CONSUMABLES -> "Usar"
        else if (item.category === 'consumable') {
            if (item.name.includes('Vida')) {
                user.lives += 5;
                message = "+5 Vidas ❤️";
            } else if (item.name.includes('XP') || item.name.includes('Experiencia')) {
                const xpGain = 100;
                user.xp += xpGain;
                message = `+${xpGain} XP ⚡`;

                // Level Up Check
                if (user.xp >= user.nextLevelXp) {
                    user.level += 1;
                    user.xp -= user.nextLevelXp;
                    user.nextLevelXp = Math.floor(user.nextLevelXp * 1.5); // +50% Requirement
                    user.lives = 100; // Restore HP on Level Up? Optional
                    message += "\n🎉 ¡SUBISTE DE NIVEL! 🎉";
                }
            } else {
                message = "Consumible usado ✨";
            }
        }

        // 3. CHESTS (Loot Boxes) -> "Abrir"
        else if (item.category === 'chest') {
            const rng = Math.random() * 100; // 0 to 100
            let xpReward = 0;
            let coinReward = 0;
            let lifeReward = 0;

            // Chest Logic
            if (item.name.includes('Bronce') || item.name.includes('Ruinas')) {
                // Bronce: 10-50 XP OR 10-50 Coins. Small chance of 1 Life.
                if (rng < 45) { // 45% XP
                    xpReward = Math.floor(Math.random() * 41) + 10;
                } else if (rng < 90) { // 45% Coins
                    coinReward = Math.floor(Math.random() * 41) + 10;
                } else { // 10% Life
                    lifeReward = 1;
                }
            } else if (item.name.includes('Plata') || item.name.includes('Rey')) {
                // Plata: 100-300 XP OR 100-300 Coins. Medium chance of 1 Life.
                if (rng < 40) {
                    xpReward = Math.floor(Math.random() * 201) + 100;
                } else if (rng < 80) {
                    coinReward = Math.floor(Math.random() * 201) + 100;
                } else { // 20% Life
                    lifeReward = 1;
                }
            } else if (item.name.includes('Oro') || item.name.includes('Místico')) {
                // Oro: 500-1000 XP OR 500-1000 Coins. High chance of 3 Lives.
                if (rng < 35) {
                    xpReward = Math.floor(Math.random() * 501) + 500;
                } else if (rng < 70) {
                    coinReward = Math.floor(Math.random() * 501) + 500;
                } else { // 30% Lives
                    lifeReward = 3;
                }
            }

            // Apply Rewards
            if (xpReward > 0) {
                user.xp += xpReward;
                rewardText = `+${xpReward} XP ⚡`;
                // Check Level Up
                if (user.xp >= user.nextLevelXp) {
                    user.level += 1;
                    user.xp -= user.nextLevelXp;
                    user.nextLevelXp = Math.floor(user.nextLevelXp * 1.5);
                    rewardText += "\n🎉 ¡SUBISTE DE NIVEL! 🎉";
                }
            } else if (coinReward > 0) {
                user.coins += coinReward;
                rewardText = `+${coinReward} Monedas 🪙`;
            } else if (lifeReward > 0) {
                user.lives += lifeReward;
                rewardText = `+${lifeReward} Vidas ❤️`;
            }

            message = rewardText; // Direct message for popup
        } else {
            message = `Usaste ${item.name}`;
        }

        // Reduce quantity or remove
        if (inventorySlot.quantity > 1) {
            inventorySlot.quantity -= 1;
        } else {
            inventorySlot.deleteOne();
        }

        user.markModified('inventory');
        await user.save();
        res.json({ message, user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al usar objeto' });
    }
};

// GET /api/shop (Get user created rewards - "Tickets")
exports.getShopItems = async (req, res) => {
    try {
        const Reward = require('../models/Reward'); // I need to create this
        const rewards = await Reward.find({ userId: req.user.userId });
        res.json(rewards);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop items' });
    }
};

// POST /api/shop (Create new custom reward)
exports.createShopItem = async (req, res) => {
    try {
        const { name, cost } = req.body;
        const Reward = require('../models/Reward');

        const newReward = new Reward({
            userId: req.user.userId,
            name,
            cost,
            icon: '🎫', // Ticket icon
            category: 'ticket',
            type: 'custom'
        });

        await newReward.save();
        res.json(newReward);
    } catch (error) {
        res.status(500).json({ message: 'Error creating reward' });
    }
};
