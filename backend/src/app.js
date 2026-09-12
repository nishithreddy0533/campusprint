import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import uploadRouter from './routes/upload.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS — allow all origins (frontend URL set per environment)
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (local storage backend)
const uploadDir = process.env.LOCAL_UPLOAD_DIR
  ? path.resolve(process.env.LOCAL_UPLOAD_DIR)
  : path.resolve(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadDir));

// API routes
app.use('/api/upload', uploadRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler — must be last
app.use(errorHandler);

export default app;
