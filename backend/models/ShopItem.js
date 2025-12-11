const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Si es null, es un objeto del sistema (global)
    name: { type: String, required: true },
    price: { type: Number, required: true },

    // Categoría: 'reward' (personalizada), 'consumable' (pociones), 'chest' (cofres)
    category: {
        type: String,
        enum: ['reward', 'consumable', 'chest'],
        required: true
    },

    // Efecto (Solo para consumibles del sistema)
    // 'heal' (vida), 'xp' (experiencia), 'none' (recompensa real)
    effectType: { type: String, default: 'none' },
    effectValue: { type: Number, default: 0 }, // Cuánta vida/xp da

    icon: { type: String, default: '🎁' }
});

module.exports = mongoose.model('ShopItem', shopItemSchema);