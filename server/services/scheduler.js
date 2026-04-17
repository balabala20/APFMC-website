const cron = require('node-cron');
const EnergyData = require('../models/EnergyData');
const DailyEnergy = require('../models/DailyEnergy');
const dotenv = require('dotenv');
const pushService = require('./pushService');
dotenv.config();

function scheduleDaily(io) {
  // run every day at 00:05
  cron.schedule('5 0 * * *', async () => {
    try {
      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const agg = await EnergyData.aggregate([
        { $match: { timestamp: { $gte: start, $lt: end } } },
        { $group: { _id: null, totalEnergy: { $sum: '$energy' } } }
      ]);
      const totalEnergy = agg[0] ? agg[0].totalEnergy : 0;
      const tariff = parseFloat(process.env.TARIFF_PER_UNIT || '7.5');
      const cost = +(totalEnergy * tariff).toFixed(2);
      const rec = await DailyEnergy.create({ date: start.toISOString().slice(0,10), totalEnergy, cost });
      // push broadcast
      await pushService.broadcast(null, { title: "Today's Energy Usage", body: `Usage: ${totalEnergy} kWh | Cost: ₹${cost}` });
      io && io.emit('daily-summary', rec);
    } catch (err) {
      console.error('Daily scheduler error', err.message);
    }
  });
}

function scheduleAI(io) {
  // generate AI insights every hour at minute 10
  cron.schedule('10 * * * *', async () => {
    try {
      const aiService = require('./aiService');
      await aiService.generateAndSave(io);
    } catch (err) {
      console.error('AI scheduler error', err.message);
    }
  });
  // also run once immediately on startup so there is at least one insight
  (async () => {
    try {
      const aiService = require('./aiService');
      await aiService.generateAndSave(io);
    } catch (err) {
      console.error('AI initial generation error', err.message);
    }
  })();
}

module.exports = { scheduleDaily, scheduleAI };
