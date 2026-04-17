const mongoose = require('mongoose');

const DailyEnergySchema = new mongoose.Schema({
  date: { type: String },
  totalEnergy: Number,
  cost: Number,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DailyEnergy', DailyEnergySchema);
