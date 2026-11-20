import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseDocument, UnsupportedFileTypeError, FileParsingError } from '../services/documentParser.js';
import { documentRepo } from '../db/database.js';
import { DocumentRecord } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const documentsRouter = Router();

// Configure Multer in-memory storage for safe parsing without filesystem littering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit per file
    files: 10, // Max 10 files at once
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.txt', '.csv', '.md', '.json'];
    const allowedMimes = ['application/pdf', 'text/plain', 'text/csv', 'application/json', 'text/markdown'];

    if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new UnsupportedFileTypeError(`Unsupported file extension "${ext}". Only PDF, TXT, and CSV are allowed.`));
    }
  },
});

/**
 * POST /api/documents/upload
 * Accepts multiple files (PDF, TXT, CSV), parses each separately, stores in SQLite.
 */
documentsRouter.post('/upload', upload.array('files', 10), async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files were uploaded. Please attach at least one PDF, TXT, or CSV file.' });
    return;
  }

  const processedDocs: DocumentRecord[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      const parsed = await parseDocument(file.buffer, file.originalname, file.mimetype);
      const docId = `doc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      const docRecord: DocumentRecord = {
        id: docId,
        filename: `${docId}-${file.originalname}`,
        originalName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        fileSize: file.size,
        charCount: parsed.charCount,
        tokenEstimate: parsed.tokenEstimate,
        extractedText: parsed.text,
        createdAt: new Date().toISOString(),
      };

      documentRepo.save(docRecord);
      processedDocs.push(docRecord);
    } catch (err: any) {
      errors.push({
        file: file.originalname,
        error: err.message || 'Parsing error',
      });
    }
  }

  if (processedDocs.length === 0 && errors.length > 0) {
    res.status(422).json({
      error: 'All uploaded files failed parsing or validation.',
      details: errors,
    });
    return;
  }

  res.status(201).json({
    message: `Successfully processed ${processedDocs.length} document(s).`,
    documents: processedDocs,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * GET /api/documents
 * List all uploaded documents.
 */
documentsRouter.get('/', (_req: Request, res: Response): void => {
  const docs = documentRepo.getAll();
  // Return metadata, omitting huge text blobs for lightweight list views
  const list = docs.map(({ extractedText, ...meta }) => ({
    ...meta,
    preview: extractedText.slice(0, 160).replace(/\n/g, ' ') + '...',
  }));
  res.json(list);
});

/**
 * GET /api/documents/:id
 * Retrieve specific document details and its extracted text.
 */
documentsRouter.get('/:id', (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const doc = documentRepo.getById(id);
  if (!doc) {
    res.status(404).json({ error: `Document not found with ID ${id}` });
    return;
  }
  res.json(doc);
});

/**
 * DELETE /api/documents/:id
 * Delete a document from SQLite.
 */
documentsRouter.delete('/:id', (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = documentRepo.delete(id);
  res.json({ success, id });
});

/**
 * POST /api/documents/load-samples
 * Quick seed endpoint to populate synthetic sample documents into the system.
 */
documentsRouter.post('/load-samples', async (_req: Request, res: Response): Promise<void> => {
  try {
    const samplesDir = path.resolve(__dirname, '../../../samples');
    if (!fs.existsSync(samplesDir)) {
      res.status(404).json({ error: 'Samples directory not found.' });
      return;
    }

    const sampleFiles = fs.readdirSync(samplesDir).filter((f) => !f.startsWith('.'));
    const loadedDocs: DocumentRecord[] = [];

    for (const filename of sampleFiles) {
      const filePath = path.join(samplesDir, filename);
      const buffer = fs.readFileSync(filePath);
      const parsed = await parseDocument(buffer, filename);
      const docId = `sample-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      const docRecord: DocumentRecord = {
        id: docId,
        filename: `${docId}-${filename}`,
        originalName: filename,
        mimeType: filename.endsWith('.csv') ? 'text/csv' : 'text/plain',
        fileSize: buffer.length,
        charCount: parsed.charCount,
        tokenEstimate: parsed.tokenEstimate,
        extractedText: parsed.text,
        createdAt: new Date().toISOString(),
      };

      documentRepo.save(docRecord);
      loadedDocs.push(docRecord);
    }

    res.json({
      message: `Loaded ${loadedDocs.length} synthetic sample document(s).`,
      documents: loadedDocs,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load samples: ${err.message}` });
  }
});
