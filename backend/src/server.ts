import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const aiMode = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'mock'
  ? `Gemini Live (${process.env.GEMINI_MODEL || 'gemini-3.5-flash'})`
  : process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock'
  ? `OpenAI Live (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})`
  : 'Dynamic Mock Fallback';

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Multi-Document Intelligence Workbench Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   AI Mode: ${aiMode}`);
  console.log(`=======================================================`);
});
