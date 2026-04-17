const LoadControl = require('../models/LoadControl');

exports.manualOverride = async (req, res) => {
  try {
    const { correctedPf, note } = req.body;
    // preserve existing capacitor state when overriding
    const last = await LoadControl.findOne().sort({createdAt:-1});
    const cap = last ? last.capacitor : true;
    const rec = await LoadControl.create({ load1: false, load2: false, capacitor: cap, note: `Manual PF override: ${correctedPf} ${note||''}` });
    if (req.app && req.app.get('io')) req.app.get('io').emit('pf-override', { correctedPf, note, createdAt: rec.createdAt });
    res.json({ ok: true, data: rec });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
