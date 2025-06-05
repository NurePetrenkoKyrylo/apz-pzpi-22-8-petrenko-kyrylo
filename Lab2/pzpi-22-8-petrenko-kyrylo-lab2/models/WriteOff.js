const mongoose = require('mongoose');

const writeOffSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medication: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WriteOff', writeOffSchema);