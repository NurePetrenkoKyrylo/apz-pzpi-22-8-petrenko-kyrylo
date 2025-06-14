const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'pharmacist', 'customer'], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bonusPoints: { type: Number }
});

module.exports = mongoose.model('User', userSchema);
