import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { setupApiRoutes } from './server/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 25MB json payload for images/PDF base64
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Register Server-Side API endpoints (Gemini Invoice Analysis, etc.)
  setupApiRoutes(app);

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Serve static files from dist in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Integrate Vite in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIJIL SERVER] Running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[SIJIL SERVER] Failed to start server:', err);
  process.exit(1);
});
