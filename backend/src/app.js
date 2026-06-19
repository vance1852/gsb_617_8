const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const linksRoutes = require('./routes/links');
const statsRoutes = require('./routes/stats');
const redirectRoutes = require('./routes/redirect');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/stats', statsRoutes);
app.use('/', redirectRoutes);

app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
