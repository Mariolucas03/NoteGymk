const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // CAMBIO 1: Permitimos que el ID sea un texto simple (para usar "user_1")
    _id: { type: String, required: true },

    name: { type: String, required: true },
    
    // CAMBIO 2: Quitamos "required: true" para que no sea obligatorio tener email/pass
    email: { type: String, required: false },
    password: { type: String, required: false },

    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    lives: { type: Number, default: 3 },
    events: { type: Array, default: [] },
    level: { type: Number, default: 1 }
}, { 
    timestamps: true,
    _id: false // IMPORTANTE: Le decimos a Mongo que no intente crear su propio ID raro
});

module.exports = mongoose.model('User', UserSchema);