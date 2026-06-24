const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve HTML screener
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Universal CORS proxy — решает проблему блокировок без VPN
// Пример: GET /api-proxy?url=https://www.okx.com/api/v5/public/open-interest?instType=SWAP
app.get('/api-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url param' });

  // Whitelist allowed domains (безопасность)
  const allowed = [
    'api.mexc.com', 'contract.mexc.com',
    'www.okx.com',
    'open-api.bingx.com',
    'api.bybit.com',
    'fapi.binance.com',
  ];
  const isAllowed = allowed.some(d => targetUrl.includes(d));
  if (!isAllowed) return res.status(403).json({ error: 'Domain not allowed' });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });
    const data = await response.json();
    res.set('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`POLEVOY SCREENER running on port ${PORT}`));
