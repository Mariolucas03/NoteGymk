const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Datos Físicos
    physicalStats: {
        age: { type: Number },
        height: { type: Number }, // cm
        gender: { type: String, enum: ['male', 'female'] }
    },

    // --- ESTADÍSTICAS RPG (Unificadas en la raíz para acceso rápido) ---
    level: { type: Number, default: 1 },
    currentXP: { type: Number, default: 0 },
    nextLevelXP: { type: Number, default: 100 },
    coins: { type: Number, default: 50 },      // Moneda Principal
    gameCoins: { type: Number, default: 500 }, // Fichas Casino

    // Salud / Vidas
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    lives: { type: Number, default: 100 }, // NOTA: ¿Usas 'hp' o 'lives'? Decide una. Sugiero 'hp'.

    // Configuración Nutricional
    macros: {
        calories: { type: Number, default: 2100 },
        protein: { type: Number, default: 150 },
        carbs: { type: Number, default: 200 },
        fat: { type: Number, default: 70 },
        fiber: { type: Number, default: 30 }
    },

    // Inventario (Referencia)
    inventory: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
        quantity: { type: Number, default: 1 }
    }],

    // Sistema de Racha
    streak: {
        current: { type: Number, default: 1 },
        lastLogDate: { type: Date, default: Date.now }
    },

    // Recompensas Diarias
    dailyRewards: {
        claimedDays: { type: [Number], default: [] },
        lastClaimDate: { type: Date }
    },

    // Castigo/Redención
    redemptionMission: { type: String, default: null },

}, {
    timestamps: true,
    toJSON: { virtuals: true }, // Para que el frontend reciba id y _id si es necesario
    toObject: { virtuals: true }
});

// Virtual para compatibilidad si el frontend busca user.stats.coins
userSchema.virtual('stats').get(function () {
    return {
        level: this.level,
        currentXP: this.currentXP,
        nextLevelXP: this.nextLevelXP,
        coins: this.coins,
        gameCoins: this.gameCoins,
        hp: this.hp,
        maxHp: this.maxHp
    };
});

module.exports = mongoose.model('User', userSchema);