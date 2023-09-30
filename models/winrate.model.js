const mongoose = require("mongoose");

const winrateSchema = new mongoose.Schema({
    phone: { default: null, type: String },
    min: Number,
    max: Number,
    rate: Number,
}, { timestamps: true })

module.exports = mongoose.model('winrate', winrateSchema);