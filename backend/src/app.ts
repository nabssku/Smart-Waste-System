import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import statsRoutes from './routes/stats.routes';
import mlRoutes, { acceptMlUpload } from './routes/ml.routes';
import { predictWaste, healthCheck } from './controllers/ml.controller';
import { errorHandler } from './middleware/error';
import { loadWasteModel } from './services/ml.service';

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// CORS Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request, silakan coba lagi nanti.',
  },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiLimiter);

// Static files for uploaded waste photos
const uploadsPath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health & Root Endpoints
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'Smart Waste Management System - Unified API & ML Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      reports: '/api/reports',
      users: '/api/users',
      stats: '/api/stats',
      mlPredict: '/api/ml/predict (or POST /predict)',
    },
  });
});

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Direct ML prediction endpoint alias (matches PRD Section 5C POST /predict)
app.post('/predict', acceptMlUpload, predictWaste);

// API Routes (matches PRD Section 5D)
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ml', mlRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan.',
  });
});

// Centralized Error Handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Smart Waste Unified Backend & ML Server running on http://localhost:${PORT}`);
    await loadWasteModel();
  });
}

export default app;
