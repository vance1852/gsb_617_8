require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const linksRoutes = require('./routes/links');
const redirectRoutes = require('./routes/redirect');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/stats', statsRoutes);
app.use('/r', redirectRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Redirect endpoint: http://localhost:${PORT}/r/{shortCode}`);
});
