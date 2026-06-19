const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * pageSize;

  let whereClause = '';
  let params = [];

  if (search) {
    whereClause = 'WHERE short_code LIKE ? OR long_url LIKE ? OR note LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const countResult = db.prepare(`SELECT COUNT(*) as total FROM links ${whereClause}`).get(...params);
  const total = countResult.total;

  const links = db.prepare(`
    SELECT * FROM links ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  res.json({
    list: links,
    total,
    page,
    pageSize
  });
});

router.get('/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) {
    return res.status(404).json({ error: '短链不存在' });
  }

  const dailyStats = db.prepare(`
    SELECT 
      DATE(visited_at) as date,
      COUNT(*) as count
    FROM visits 
    WHERE link_id = ?
    GROUP BY DATE(visited_at)
    ORDER BY date DESC
    LIMIT 30
  `).all(link.id);

  const recentVisits = db.prepare(`
    SELECT * FROM visits 
    WHERE link_id = ?
    ORDER BY visited_at DESC
    LIMIT 20
  `).all(link.id);

  res.json({
    ...link,
    dailyStats: dailyStats.reverse(),
    recentVisits
  });
});

router.post('/', (req, res) => {
  let { shortCode, longUrl, note, expiresAt, maxClicks } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: '目标URL不能为空' });
  }

  try {
    new URL(longUrl);
  } catch (e) {
    return res.status(400).json({ error: '请输入有效的URL地址' });
  }

  if (!shortCode) {
    shortCode = nanoid(6);
  } else {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(shortCode)) {
      return res.status(400).json({ error: '自定义短码只能包含字母、数字、下划线和连字符，长度3-20位' });
    }
  }

  const existing = db.prepare('SELECT id FROM links WHERE short_code = ?').get(shortCode);
  if (existing) {
    return res.status(400).json({ error: '该短码已存在' });
  }

  const result = db.prepare(`
    INSERT INTO links (short_code, long_url, note, expires_at, max_clicks)
    VALUES (?, ?, ?, ?, ?)
  `).run(shortCode, longUrl, note || null, expiresAt || null, maxClicks || null);

  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
  res.json(link);
});

router.put('/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) {
    return res.status(404).json({ error: '短链不存在' });
  }

  let { shortCode, longUrl, note, expiresAt, maxClicks, isActive } = req.body;

  if (shortCode && shortCode !== link.short_code) {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(shortCode)) {
      return res.status(400).json({ error: '自定义短码只能包含字母、数字、下划线和连字符，长度3-20位' });
    }
    const existing = db.prepare('SELECT id FROM links WHERE short_code = ? AND id != ?').get(shortCode, req.params.id);
    if (existing) {
      return res.status(400).json({ error: '该短码已存在' });
    }
  }

  db.prepare(`
    UPDATE links 
    SET short_code = COALESCE(?, short_code),
        long_url = COALESCE(?, long_url),
        note = COALESCE(?, note),
        expires_at = ?,
        max_clicks = ?,
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    shortCode || null,
    longUrl || null,
    note !== undefined ? note : null,
    expiresAt !== undefined ? (expiresAt || null) : link.expires_at,
    maxClicks !== undefined ? (maxClicks || null) : link.max_clicks,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );

  const updatedLink = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  res.json(updatedLink);
});

router.patch('/:id/toggle', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) {
    return res.status(404).json({ error: '短链不存在' });
  }

  db.prepare('UPDATE links SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(link.is_active ? 0 : 1, req.params.id);

  const updatedLink = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  res.json(updatedLink);
});

router.delete('/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) {
    return res.status(404).json({ error: '短链不存在' });
  }

  db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
