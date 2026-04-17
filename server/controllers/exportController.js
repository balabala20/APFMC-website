const EnergyData = require('../models/EnergyData');

exports.exportData = async (req, res) => {
  try {
    const range = req.query.range || 'weekly';
    const now = new Date();
    let start;
    if (range === 'monthly') start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    else if (range === 'all') start = new Date(0);
    else start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const rows = await EnergyData.find({ timestamp: { $gte: start } }).sort({ timestamp: 1 }).lean();
    const header = ['timestamp','voltage','current','power','pf_value','energy','frequency'];
    const csv = [header.join(',')];
    data.forEach(r => {
      csv.push([r.timestamp.toISOString(), r.voltage, r.current, r.power, r.pf_value, r.energy, r.frequency].join(','));
    });
    const out = csv.join('\n');
    res.setHeader('Content-disposition', `attachment; filename=energy_${range}.csv`);
    res.set('Content-Type', 'text/csv');
    res.send(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
