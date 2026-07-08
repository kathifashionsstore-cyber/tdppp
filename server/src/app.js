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

// Catch-all 404 handler for API routes to avoid HTML responses
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global 404 handler for any other unhandled routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, _next) => {
  const status = error.status || error.statusCode || 500;
  
  // Custom response format for PDF upload route failures (e.g. multer file size errors)
  if (req.path === '/api/pdf/upload' || req.originalUrl === '/api/pdf/upload') {
    return res.status(status).json({
      success: false,
      message: 'PDF upload failed',
      error: error.message || 'Server error'
    });
  }

  res.status(status).json({
    success: false,
    error: error.message || 'Server error'
  });
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
