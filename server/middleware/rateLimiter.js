const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests, please try again later.'
});

module.exports = apiLimiter;
