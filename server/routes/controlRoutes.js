const express = require('express');
const router = express.Router();
const controlCtrl = require('../controllers/controlController');
const auth = require('../middleware/auth');

router.post('/control', auth, controlCtrl.postControl);

// provide web clients a way to query current state
router.get('/control', auth, controlCtrl.getControl);

// ESP32 unauthenticated endpoint (same logic, used by device firmware)
router.get('/control/esp32', controlCtrl.getControl);

module.exports = router;
