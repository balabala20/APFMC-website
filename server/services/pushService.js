const webpush = require('web-push');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

async function sendToUser(userId, payload) {
  const user = await User.findById(userId);
  if (!user || !user.pushSubscription) return;
  try {
    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
  } catch (err) {
    console.error('Push send error', err);
  }
}

async function broadcast(dbUsers, payload) {
  const users = await User.find({ pushSubscription: { $exists: true } });
  for (const u of users) {
    try {
      await webpush.sendNotification(u.pushSubscription, JSON.stringify(payload));
    } catch (err) {
      console.error('Push send error for user', u._id, err.message);
    }
  }
}

module.exports = { sendToUser, broadcast };
