const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/:code', (req, res) => {
  const { code } = req.params;

  const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get(code);

  if (!link) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>短链不存在</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 100px;">
        <h1>404</h1><p>该短链接不存在</p>
      </body></html>
    `);
  }

  if (!link.is_active) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>短链已停用</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 100px;">
        <h1>410 Gone</h1><p>该短链接已被停用</p>
      </body></html>
    `);
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>短链已过期</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 100px;">
        <h1>410 Gone</h1><p>该短链接已过期</p>
      </body></html>
    `);
  }

  if (link.max_clicks !== null && link.clicks >= link.max_clicks) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>短链已失效</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 100px;">
        <h1>410 Gone</h1><p>该短链接访问次数已达上限</p>
      </body></html>
    `);
  }

  const referer = req.headers['referer'] || req.headers['referrer'] || null;
  const userAgent = req.headers['user-agent'] || null;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;

  db.prepare('INSERT INTO visits (link_id, referer, user_agent, ip) VALUES (?, ?, ?, ?)')
    .run(link.id, referer, userAgent, ip);

  db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').run(link.id);

  res.redirect(302, link.long_url);
});

module.exports = router;
