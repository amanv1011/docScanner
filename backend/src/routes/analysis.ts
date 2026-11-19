import { Router, Request, Response } from 'express';
import { runAnalysis, getAnalysisHistory, getAnalysisById, deleteAnalysis } from '../services/analysisService.js';

export const analysisRouter = Router();

/**
 * POST /api/analysis
 * Run multi-document intelligence analysis.
 */
analysisRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentIds, prompt } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      res.status(400).json({ error: 'documentIds array is required and must contain at least one ID.' });
      return;
    }

    const record = await runAnalysis(documentIds, prompt || '');
    res.json(record);
  } catch (err: any) {
    console.error('[Analysis Error]', err);
    res.status(500).json({ error: err.message || 'Internal server error during document analysis.' });
  }
});

/**
 * GET /api/analysis/history
 * List past analyses saved in SQLite.
 */
analysisRouter.get('/history', (_req: Request, res: Response): void => {
  try {
    const history = getAnalysisHistory();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch history: ${err.message}` });
  }
});

/**
 * GET /api/analysis/:id
 * Retrieve specific analysis record.
 */
analysisRouter.get('/:id', (req: Request, res: Response): void => {
  const analysis = getAnalysisById(req.params.id);
  if (!analysis) {
    res.status(404).json({ error: `Analysis record ${req.params.id} not found.` });
    return;
  }
  res.json(analysis);
});

/**
 * DELETE /api/analysis/:id
 * Delete specific analysis record.
 */
analysisRouter.delete('/:id', (req: Request, res: Response): void => {
  const success = deleteAnalysis(req.params.id);
  res.json({ success, id: req.params.id });
});
