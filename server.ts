import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy API endpoint to bypass CORS and query real-time draws
  app.get('/api/wingo', async (req, res) => {
    try {
      const timeframe = req.query.timeframe === '30s' ? 'WinGo_30S' : 'WinGo_1M';
      const externalApiUrl = `https://draw.ar-lottery01.com/WinGo/${timeframe}/GetHistoryIssuePage.json?pageSize=50&pageNo=1`;
      
      const response = await fetch(externalApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from Wingo API: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy Error:', error);
      res.status(500).json({ error: error.message || 'Error proxying Wingo data' });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fusion Predictor running on http://localhost:${PORT}`);
  });
}

startServer();
