const express = require('express');
const router = express.Router();
const dataCtrl = require('../controllers/dataController');
const auth = require('../middleware/auth');

// Authenticated routes
router.post('/data', auth, dataCtrl.postData);
router.get('/latest', auth, dataCtrl.getLatest);
router.get('/history', auth, dataCtrl.getHistory);

// ESP32 unauthenticated endpoint
router.post('/data/esp32', dataCtrl.postData);

module.exports = router;
