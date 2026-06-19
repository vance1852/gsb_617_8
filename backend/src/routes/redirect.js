const express = require('express');
const { ShortUrl, ClickLog } = require('../models');

const router = express.Router();

router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const shortUrl = await ShortUrl.findOne({ where: { shortCode } });

    if (!shortUrl) {
      return res.status(404).send(`
        <html>
          <head><meta charset="utf-8"><title>链接不存在</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;margin:0;background:#f5f5f5;">
            <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color:#ff4d4f;margin:0 0 16px;">404</h1>
              <p style="color:#666;margin:0;">该短链接不存在</p>
            </div>
          </body>
        </html>
      `);
    }

    if (!shortUrl.isActive) {
      return res.status(403).send(`
        <html>
          <head><meta charset="utf-8"><title>链接已停用</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;margin:0;background:#f5f5f5;">
            <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color:#faad14;margin:0 0 16px;">403</h1>
              <p style="color:#666;margin:0;">该短链接已被停用</p>
            </div>
          </body>
        </html>
      `);
    }

    if (shortUrl.expiresAt && new Date() > shortUrl.expiresAt) {
      return res.status(410).send(`
        <html>
          <head><meta charset="utf-8"><title>链接已过期</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;margin:0;background:#f5f5f5;">
            <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color:#faad14;margin:0 0 16px;">410</h1>
              <p style="color:#666;margin:0;">该短链接已过期</p>
            </div>
          </body>
        </html>
      `);
    }

    if (shortUrl.maxClicks && shortUrl.clickCount >= shortUrl.maxClicks) {
      return res.status(410).send(`
        <html>
          <head><meta charset="utf-8"><title>访问次数已达上限</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;margin:0;background:#f5f5f5;">
            <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color:#faad14;margin:0 0 16px;">410</h1>
              <p style="color:#666;margin:0;">该短链接访问次数已达上限</p>
            </div>
          </body>
        </html>
      `);
    }

    await ClickLog.create({
      shortUrlId: shortUrl.id,
      referer: req.headers.referer || null,
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || req.connection.remoteAddress || null
    });

    await shortUrl.increment('clickCount');

    return res.redirect(302, shortUrl.longUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send(`
      <html>
        <head><meta charset="utf-8"><title>服务器错误</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;margin:0;background:#f5f5f5;">
          <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color:#ff4d4f;margin:0 0 16px;">500</h1>
            <p style="color:#666;margin:0;">服务器内部错误</p>
          </div>
        </body>
      </html>
    `);
  }
});

module.exports = router;
