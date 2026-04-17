const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'user' },
  pushSubscription: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
