const express = require("express");
const { nanoid } = require("nanoid");
const Sequelize = require("sequelize");
const { Op, fn, col, literal } = Sequelize;
const { ShortUrl, ClickLog, sequelize } = require("../models");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || "";

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { shortCode: { [Op.like]: `%${keyword}%` } },
        { longUrl: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { count, rows } = await ShortUrl.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    res.json({
      total: count,
      page,
      pageSize,
      list: rows,
    });
  } catch (error) {
    console.error("Get shorturls error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { shortCode, longUrl, expiresAt, maxClicks, remark } = req.body;

    if (!longUrl) {
      return res.status(400).json({ message: "目标 URL 不能为空" });
    }

    let code = shortCode;
    if (!code) {
      code = nanoid(6);
    } else {
      const exists = await ShortUrl.findOne({ where: { shortCode: code } });
      if (exists) {
        return res
          .status(400)
          .json({ message: "该短码已存在，请使用其他短码" });
      }
    }

    const shortUrl = await ShortUrl.create({
      shortCode: code,
      longUrl,
      expiresAt: expiresAt || null,
      maxClicks: maxClicks || null,
      remark: remark || null,
    });

    res.json(shortUrl);
  } catch (error) {
    console.error("Create shorturl error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findByPk(req.params.id);
    if (!shortUrl) {
      return res.status(404).json({ message: "短链接不存在" });
    }
    res.json(shortUrl);
  } catch (error) {
    console.error("Get shorturl error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { longUrl, expiresAt, maxClicks, remark, isActive } = req.body;
    const shortUrl = await ShortUrl.findByPk(req.params.id);

    if (!shortUrl) {
      return res.status(404).json({ message: "短链接不存在" });
    }

    await shortUrl.update({
      longUrl: longUrl || shortUrl.longUrl,
      expiresAt: expiresAt !== undefined ? expiresAt : shortUrl.expiresAt,
      maxClicks: maxClicks !== undefined ? maxClicks : shortUrl.maxClicks,
      remark: remark !== undefined ? remark : shortUrl.remark,
      isActive: isActive !== undefined ? isActive : shortUrl.isActive,
    });

    res.json(shortUrl);
  } catch (error) {
    console.error("Update shorturl error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findByPk(req.params.id);
    if (!shortUrl) {
      return res.status(404).json({ message: "短链接不存在" });
    }

    await ClickLog.destroy({ where: { shortUrlId: req.params.id } });
    await shortUrl.destroy();

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete shorturl error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.post("/:id/toggle", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findByPk(req.params.id);
    if (!shortUrl) {
      return res.status(404).json({ message: "短链接不存在" });
    }

    shortUrl.isActive = !shortUrl.isActive;
    await shortUrl.save();

    res.json(shortUrl);
  } catch (error) {
    console.error("Toggle shorturl error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.get("/:id/stats", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findByPk(req.params.id);
    if (!shortUrl) {
      return res.status(404).json({ message: "短链接不存在" });
    }

    const dateExpr = fn("DATE", col("createdAt"));
    const dailyStats = await ClickLog.findAll({
      attributes: [
        [dateExpr, "date"],
        [fn("COUNT", "*"), "count"],
      ],
      where: { shortUrlId: req.params.id },
      group: [dateExpr],
      order: [[dateExpr, "ASC"]],
    });

    const recentLogs = await ClickLog.findAll({
      where: { shortUrlId: req.params.id },
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    res.json({
      shortUrl,
      dailyStats: dailyStats.map((s) => ({
        date: s.get("date"),
        count: parseInt(s.get("count")),
      })),
      recentLogs,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

module.exports = router;
