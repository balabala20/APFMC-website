const express = require('express');
const router = express.Router();
const overrideCtrl = require('../controllers/overrideController');
const auth = require('../middleware/auth');

router.post('/override', auth, overrideCtrl.manualOverride);

module.exports = router;
