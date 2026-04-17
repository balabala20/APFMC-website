const mongoose = require('mongoose');

const EnergySchema = new mongoose.Schema({
  voltage: Number,
  current: Number,
  power: Number,
  pf_value: Number,
  energy: Number,
  capacitance: Number,
  frequency: Number,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('EnergyData', EnergySchema);
