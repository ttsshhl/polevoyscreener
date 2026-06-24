const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Universal CORS proxy — all external API calls go through here on production
app.get('/api-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url param' });

  const allowed = [
    'api.mexc.com', 'contract.mexc.com',
    'www.okx.com', 'open-api.bingx.com',
    'api.bybit.com', 'fapi.binance.com',
  ];
  if (!allowed.some(d => targetUrl.includes(d)))
    return res.status(403).json({ error: 'Domain not allowed' });

  try {
    // Node 18+ has native fetch — no need for node-fetch package
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    res.set('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`POLEVOY SCREENER running on port ${PORT}`));
