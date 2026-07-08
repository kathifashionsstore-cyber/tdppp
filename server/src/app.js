import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import contentRoutes from './routes/content.js';
import uploadRoutes from './routes/upload.js';
import chatbotRoutes from './routes/chatbot.js';
import analyticsRoutes from './routes/analytics.js';
import pdfRoutes from './routes/pdf.js';
import { corsMiddleware } from './middleware/cors.js';
import { apiLimiter } from './middleware/rateLimit.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));
app.use(corsMiddleware);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/api/', apiLimiter);

app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((error, _req, res, _next) => {
  res.status(error.status || 500).json({ error: error.message || 'Server error' });
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`TDP Narasaraopet API running on ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the old server or set PORT=3002 in server/.env.`);
    process.exit(1);
  }
  throw error;
});
