const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: String,
  message: String,
  data: mongoose.Schema.Types.Mixed,
  severity: { type: String, default: 'warning' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
