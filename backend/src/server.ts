import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Multi-Document Intelligence Workbench Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   AI Mode: ${process.env.OPENAI_API_KEY ? 'OpenAI Live' : 'Dynamic Mock Fallback'}`);
  console.log(`=======================================================`);
});
