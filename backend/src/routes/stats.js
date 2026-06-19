const express = require("express");
const Sequelize = require("sequelize");
const { Op, fn, col, literal } = Sequelize;
const { ShortUrl, ClickLog } = require("../models");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", async (req, res) => {
  try {
    const totalShortUrls = await ShortUrl.count();
    const totalClicks = await ClickLog.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayClicks = await ClickLog.count({
      where: {
        createdAt: { [Op.gte]: today },
      },
    });

    const topShortUrls = await ShortUrl.findAll({
      order: [["clickCount", "DESC"]],
      limit: 10,
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dateExpr = fn("DATE", col("createdAt"));
    const weeklyTrend = await ClickLog.findAll({
      attributes: [
        [dateExpr, "date"],
        [fn("COUNT", "*"), "count"],
      ],
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo },
      },
      group: [dateExpr],
      order: [[dateExpr, "ASC"]],
    });

    res.json({
      totalShortUrls,
      totalClicks,
      todayClicks,
      topShortUrls,
      weeklyTrend: weeklyTrend.map((s) => ({
        date: s.get("date"),
        count: parseInt(s.get("count")),
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

module.exports = router;
