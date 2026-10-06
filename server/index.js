import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Load env vars from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { supabase } from './config/supabase.js';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. Strict CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://fashion-e-comm.vercel.app',
  'https://fashion-e-comm.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}));

// 3. Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  }
});
app.use('/api', globalLimiter);

// Specific Auth & Payment Rate Limiter
const sensitiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30, // 30 attempts per 5 mins
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts. Please try again after 5 minutes.'
    }
  }
});
app.use('/api/auth', sensitiveLimiter);
app.use('/api/payments', sensitiveLimiter);

// 4. Request ID & Body Parsers
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static assets if any
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Health Checks
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Aanya Fashion API',
    uptime: process.uptime()
  });
});

app.get('/api/health/ready', async (req, res) => {
  try {
    // Test Supabase connection
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (error) throw error;

    res.status(200).json({
      status: 'ready',
      database: 'connected',
      productsCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (dbErr) {
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: dbErr.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root ping
app.get('/', (req, res) => {
  res.send('Aanya Fashion Supabase API v1.0.0 is running...');
});

// 6. Mount Routers
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// 7. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found.`
    },
    requestId: req.id
  });
});

// 8. Centralized Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.'
    },
    requestId: req.id,
    stack: isProd ? undefined : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Aanya Fashion API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
