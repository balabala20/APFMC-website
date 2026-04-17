const AIInsight = require('../models/AIInsight');
const aiService = require('../services/aiService');

exports.getInsights = async (req, res) => {
  try {
    const insights = await AIInsight.find().sort({ generatedAt: -1 }).limit(10);
    res.json({ ok: true, data: insights });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.generateInsights = async (req, res) => {
  try {
    const result = await aiService.generateAndSave(req.app.get('io'));
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
