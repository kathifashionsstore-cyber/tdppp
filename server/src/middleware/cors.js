import cors from 'cors';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Allow any local connection (localhost or 127.0.0.1 on any port)
    const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (process.env.NODE_ENV !== 'production' || isLocal) {
      return callback(null, true);
    }
    
    const allowed = [
      process.env.CLIENT_URL,
      'https://tdpnrt.com',
      'https://www.tdpnrt.com'
    ].filter(Boolean);
    
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
});
