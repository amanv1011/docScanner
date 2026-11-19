import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { documentsRouter } from './routes/documents.js';
import { analysisRouter } from './routes/analysis.js';
import { UnsupportedFileTypeError, FileParsingError } from './services/documentParser.js';

dotenv.config();

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
  res.json({
    status: 'ok',
    service: 'Multi-Document Intelligence Workbench Backend',
    timestamp: new Date().toISOString(),
    aiMode: process.env.OPENAI_API_KEY ? 'OpenAI Configured' : 'Dynamic Mock Fallback Active',
  });
});

// Routes
app.use('/api/documents', documentsRouter);
app.use('/api/analysis', analysisRouter);

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
