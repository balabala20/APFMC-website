const LoadControl = require('../models/LoadControl');

exports.postControl = async (req, res) => {
  try {
    const { load1, load2, capacitor } = req.body;
    // check if system is disabled due to protection
    const last = await LoadControl.findOne().sort({ createdAt: -1 });
    if (last && last.disabled) {
      return res.status(423).json({ ok: false, message: 'Control disabled due to protection', reason: last.disableReason });
    }
    // merge with previous state so that toggling one item doesn't reset others
    const newState = {
      load1: load1 !== undefined ? load1 : (last ? last.load1 : false),
      load2: load2 !== undefined ? load2 : (last ? last.load2 : false),
      capacitor: capacitor !== undefined ? capacitor : (last ? last.capacitor : true)
    };
    const saved = await LoadControl.create(newState);
    // emit via socket
    if (req.app && req.app.get('io')) req.app.get('io').emit('control-update', saved);
    res.json({ ok: true, data: saved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.getControl = async (req, res) => {
  try {
    const last = await LoadControl.findOne().sort({ createdAt: -1 });
    if (!last) {
      return res.json({ ok: true, load1: false, load2: false, capacitor: true });
    }
    res.json({ ok: true, load1: last.load1, load2: last.load2, capacitor: last.capacitor });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
