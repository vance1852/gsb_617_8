const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/:code', async (req, res, next) => {
  try {
    const code = req.params.code;
    const link = await prisma.shortLink.findUnique({ where: { code } });
    if (!link) {
      return res.status(404).type('text/plain').send('Short link not found');
    }
    if (!link.enabled) {
      return res.status(410).type('text/plain').send('Short link disabled');
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return res.status(410).type('text/plain').send('Short link expired');
    }
    if (link.maxClicks != null && link.clickCount >= link.maxClicks) {
      return res.status(410).type('text/plain').send('Short link click limit reached');
    }

    const referer = req.headers.referer || req.headers.referrer || null;
    const userAgent = req.headers['user-agent'] || null;
    const ip =
      (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      null;

    await prisma.$transaction([
      prisma.shortLink.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      }),
      prisma.clickLog.create({
        data: {
          linkId: link.id,
          referer: referer ? String(referer).slice(0, 1000) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 1000) : null,
          ip: ip ? String(ip).slice(0, 64) : null,
        },
      }),
    ]);

    res.redirect(302, link.targetUrl);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
