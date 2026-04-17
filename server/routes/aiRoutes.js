const express = require('express');
const router = express.Router();
const aiCtrl = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.get('/ai-insights', auth, aiCtrl.getInsights);
router.post('/ai-insights/generate', auth, aiCtrl.generateInsights);

module.exports = router;
