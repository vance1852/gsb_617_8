const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/:code', async (req, res) => {
  const { code } = req.params;

  if (code.startsWith('api/')) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const linkResult = await pool.query(
      'SELECT * FROM links WHERE short_code = $1',
      [code]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>404</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>404 - 短链接不存在</h1>
          <p>您访问的短链接无效或已被删除。</p>
        </body></html>
      `);
    }

    const link = linkResult.rows[0];

    if (!link.is_active) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>410</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>410 - 短链接已停用</h1>
          <p>此短链接已被管理员停用，无法访问。</p>
        </body></html>
      `);
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>410</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>410 - 短链接已过期</h1>
          <p>此短链接已超过有效期，无法访问。</p>
        </body></html>
      `);
    }

    if (link.max_clicks !== null && link.click_count >= link.max_clicks) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>410</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>410 - 短链接访问次数已达上限</h1>
          <p>此短链接的最大访问次数已用完，无法继续访问。</p>
        </body></html>
      `);
    }

    const referer = req.headers.referer || req.headers.referrer || null;
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    await pool.query(
      'INSERT INTO clicks (link_id, referer, user_agent, ip_address) VALUES ($1, $2, $3, $4)',
      [link.id, referer, userAgent, ipAddress]
    );

    await pool.query(
      'UPDATE links SET click_count = click_count + 1 WHERE id = $1',
      [link.id]
    );

    res.redirect(302, link.long_url);
  } catch (err) {
    console.error('跳转错误:', err);
    res.status(500).send('服务器内部错误');
  }
});

module.exports = router;
