const express = require('express');
const prisma = require('../prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

router.get('/overview', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [totalLinks, totalClicks, todayClicks, activeLinks] = await Promise.all([
      prisma.shortLink.count(),
      prisma.clickLog.count(),
      prisma.clickLog.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.shortLink.count({ where: { enabled: true } }),
    ]);
    res.json({ totalLinks, totalClicks, todayClicks, activeLinks });
  } catch (e) {
    next(e);
  }
});

router.get('/top', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const items = await prisma.shortLink.findMany({
      orderBy: { clickCount: 'desc' },
      take: limit,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/trend', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || '7', 10), 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const logs = await prisma.clickLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const trendMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = 0;
    }
    for (const l of logs) {
      const key = l.createdAt.toISOString().slice(0, 10);
      if (key in trendMap) trendMap[key]++;
    }
    const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));
    res.json({ trend });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
