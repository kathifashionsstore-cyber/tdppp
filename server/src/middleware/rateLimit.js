import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'GET' && req.path === '/pdf/current',
  standardHeaders: true,
  legacyHeaders: false
});
