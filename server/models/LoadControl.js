const mongoose = require('mongoose');

const LoadControlSchema = new mongoose.Schema({
  load1: { type: Boolean, default: false },
  load2: { type: Boolean, default: false },
  // whether the capacitor bank is currently enabled/active
  capacitor: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  disableReason: { type: String, default: '' },
  note: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LoadControl', LoadControlSchema);
