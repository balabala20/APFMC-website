const EnergyData = require('../models/EnergyData');
const { checkProtection } = require('../utils/protection');

exports.postData = async (req, res) => {
  try {
    const payload = req.body;
    const saved = await EnergyData.create(payload);
    // emit via socket
    if (req.app && req.app.get('io')) req.app.get('io').emit('sensor-data', saved);
    // protection checks
    await checkProtection(payload, req.app.get('io'));
    res.json({ ok: true, data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.getLatest = async (req, res) => {
  try {
    const latest = await EnergyData.findOne().sort({ timestamp: -1 });
    res.json({ ok: true, data: latest });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const range = req.query.range || 'weekly';
    const now = new Date();
    let start;
    if (range === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    const agg = await EnergyData.aggregate([
      { $match: { timestamp: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          avgPfValue: { $avg: "$pf_value" },
          totalEnergy: { $sum: "$energy" },
          avgPower: { $avg: "$power" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // helper to produce deterministic pseudo-random values per date
    const seedValue = (dateStr) => {
      const t = new Date(dateStr).getTime() / 86400000.0; // days
      // deterministic pseudo-random in [0,1)
      const v = Math.abs(Math.sin(t * 12.9898) * 43758.5453) % 1;
      return v;
    };

    // build full list of dates between start and today (inclusive)
    const dates = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0,10));
      cur.setDate(cur.getDate() + 1);
    }

    // map aggregated real entries
    const map = {};
    agg.forEach(a => { map[a._id] = a; });

    // determine first real date (if any)
    const realDates = agg.map(a => a._id).sort();
    const firstReal = realDates.length ? realDates[0] : null;

    const out = dates.map(d => {
      if (map[d]) return map[d];
      // if there is some real data, only inject dummy for dates before firstReal
      // otherwise (no real data) inject dummy for all dates
      if (firstReal && d >= firstReal) return null;
      const v = seedValue(d);
      // generate plausible dummy stats
      return {
        _id: d,
        avgPfValue: +(0.92 + v * 0.06).toFixed(3),
        totalEnergy: +(10 + v * 40).toFixed(2),
        avgPower: +(500 + v * 1500).toFixed(1)
      };
    }).filter(Boolean);

    // merge real entries that fall on/after firstReal as well
    // if there are real entries within dates, include them in order
    const final = [];
    dates.forEach(d => {
      if (map[d]) final.push(map[d]);
      else {
        if (!firstReal) {
          // no real data at all, we already generated dummy for all dates in out
          const found = out.find(x=>x._id===d);
          if(found) final.push(found);
        } else if (d < firstReal) {
          const found = out.find(x=>x._id===d);
          if(found) final.push(found);
        }
      }
    });

    res.json({ ok: true, data: final });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
