import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { documentsRouter } from './routes/documents.js';
import { analysisRouter } from './routes/analysis.js';
import { UnsupportedFileTypeError, FileParsingError } from './services/documentParser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  let aiMode = 'Dynamic Mock Fallback Active';
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'mock') {
    aiMode = `Gemini Live (${process.env.GEMINI_MODEL || 'gemini-3.5-flash'})`;
  } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock') {
    aiMode = `OpenAI Live (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})`;
  }

  res.json({
    status: 'ok',
    service: 'Multi-Document Intelligence Workbench Backend',
    timestamp: new Date().toISOString(),
    aiMode,
  });
});

// Routes
app.use('/api/documents', documentsRouter);
app.use('/api/analysis', analysisRouter);

// Serve frontend static build in production (Single Web Service on Render)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const altFrontendDist = path.resolve(__dirname, '../../../frontend/dist');
const activeDist = fs.existsSync(frontendDist)
  ? frontendDist
  : fs.existsSync(altFrontendDist)
  ? altFrontendDist
  : null;

if (activeDist) {
  app.use(express.static(activeDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(activeDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[App Error]', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File size exceeds limit. Maximum allowed size is 15 MB per file.' });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }

  if (err instanceof UnsupportedFileTypeError) {
    res.status(415).json({ error: err.message });
    return;
  }

  if (err instanceof FileParsingError) {
    res.status(422).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: err.message || 'Internal server error.' });
});
