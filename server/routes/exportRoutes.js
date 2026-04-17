const express = require('express');
const router = express.Router();
const exportCtrl = require('../controllers/exportController');
const auth = require('../middleware/auth');

router.get('/export', auth, exportCtrl.exportData);

module.exports = router;
