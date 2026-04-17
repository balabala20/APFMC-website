const EnergyData = require('../models/EnergyData');
const AIInsight = require('../models/AIInsight');

async function generateAndSave(io) {
  // compute weekly PF avg
  const oneWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekly = await EnergyData.aggregate([
    { $match: { timestamp: { $gte: oneWeek } } },
    { $group: { _id: null, avgPf: { $avg: '$pf_value' } } }
  ]);
  let weeklyPfAvg = (weekly[0] && weekly[0].avgPf) || null;

  // helper deterministic pseudo-random based on date
  const seedValue = (dateStr) => {
    const t = new Date(dateStr).getTime() / 86400000.0;
    return Math.abs(Math.sin(t * 12.9898) * 43758.5453) % 1;
  };

  // if no real weekly data, build a deterministic dummy 7-day pf average
  if (weeklyPfAvg === null) {
    const days = [];
    for (let i = 7; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const s = d.toISOString().slice(0,10);
      const v = seedValue(s);
      days.push(0.92 + v * 0.06);
    }
    weeklyPfAvg = days.reduce((s, x) => s + x, 0) / days.length;
  }

  // detect PF drop pattern
  const pfAlerts = [];
  if (weeklyPfAvg !== null && weeklyPfAvg < 0.85) pfAlerts.push('Weekly PF below 0.85');

  // peak current hour
  const peak = await EnergyData.aggregate([
    { $group: { _id: { $hour: '$timestamp' }, avgCurrent: { $avg: '$current' } } },
    { $sort: { avgCurrent: -1 } },
    { $limit: 1 }
  ]);
  let peakCurrentHour = (peak[0] && peak[0]._id) !== undefined ? `${peak[0]._id}:00` : null;
  // if no real peak info, synthesize from dummy distribution
  if (!peakCurrentHour) {
    // build a simple deterministic hourly list and pick the max
    const hours = Array.from({ length: 24 }, (_, h) => {
      const day = new Date();
      const key = `${day.toISOString().slice(0,10)}T${String(h).padStart(2,'0')}:00:00Z`;
      const v = seedValue(key);
      return { h, avgCurrent: 5 + v * 20 };
    });
    const best = hours.reduce((a,b)=> a.avgCurrent>b.avgCurrent?a:b);
    peakCurrentHour = `${best.h}:00`;
  }

  // simple monthly prediction: average daily energy * 30
  const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const daily = await EnergyData.aggregate([
    { $match: { timestamp: { $gte: thirtyDays } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, total: { $sum: '$energy' } } }
  ]);
  let avgDaily = daily.length ? daily.reduce((s, d) => s + d.total, 0) / daily.length : 0;
  // if no daily data, synthesize deterministic dummy daily energies for 30 days
  if (!avgDaily) {
    const vals = [];
    for (let i = 30; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const s = d.toISOString().slice(0,10);
      const v = seedValue(s);
      vals.push(10 + v * 40);
    }
    avgDaily = vals.reduce((s,x)=>s+x,0) / vals.length;
  }
  const monthlyPredictionKWh = avgDaily * 30;

  // abnormal spikes
  const spikes = await EnergyData.find({ power: { $gt: 10000 } }).limit(5);
  const abnormalSpikes = spikes.map(s => `Spike at ${s.timestamp} - ${s.power}W`);

  // if no spikes found and DB is empty, optionally add a synthesized spike sometimes
  if (abnormalSpikes.length === 0) {
    // deterministic chance based on today's seed
    const v = seedValue(new Date().toISOString().slice(0,10));
    if (v > 0.9) {
      abnormalSpikes.push(`Simulated spike at ${new Date().toISOString()} - ${12000 + Math.floor(v*3000)}W`);
    }
  }

  const insight = await AIInsight.create({ weeklyPfAvg, pfAlerts, peakCurrentHour, monthlyPredictionKWh, abnormalSpikes });
  io && io.emit('ai-insight', insight);
  return insight;
}

module.exports = { generateAndSave };
