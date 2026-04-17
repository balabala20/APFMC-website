const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const dotenv = require('dotenv');
dotenv.config();

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/subscribe', auth, authCtrl.subscribePush);

router.get('/vapid-public', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

module.exports = router;
