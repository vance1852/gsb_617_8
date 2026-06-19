const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', (req, res) => {
  const totalLinks = db.prepare('SELECT COUNT(*) as count FROM links').get().count;
  const totalClicks = db.prepare('SELECT COALESCE(SUM(clicks), 0) as count FROM links').get().count;
  
  const today = new Date().toISOString().split('T')[0];
  const todayClicks = db.prepare(`
    SELECT COUNT(*) as count FROM visits 
    WHERE DATE(visited_at) = ?
  `).get(today).count;

  const activeLinks = db.prepare('SELECT COUNT(*) as count FROM links WHERE is_active = 1').get().count;

  const topLinks = db.prepare(`
    SELECT id, short_code, long_url, note, clicks, is_active, expires_at, max_clicks, created_at
    FROM links 
    ORDER BY clicks DESC 
    LIMIT 10
  `).all();

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = dateStr + ' 00:00:00';
    const dayEnd = dateStr + ' 23:59:59';
    
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM visits 
      WHERE visited_at >= ? AND visited_at <= ?
    `).get(dayStart, dayEnd).count;

    last7Days.push({ date: dateStr, count });
  }

  res.json({
    totalLinks,
    totalClicks,
    todayClicks,
    activeLinks,
    topLinks,
    last7Days
  });
});

module.exports = router;
