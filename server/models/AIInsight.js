const mongoose = require('mongoose');

const AIInsightSchema = new mongoose.Schema({
  weeklyPfAvg: Number,
  pfAlerts: [String],
  peakCurrentHour: String,
  monthlyPredictionKWh: Number,
  abnormalSpikes: [String],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AIInsight', AIInsightSchema);
