const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");
const { authRequired } = require("../middlewares/auth");
const { genCode } = require("../utils/code");

const router = express.Router();
router.use(authRequired);

const codeRegex = /^[A-Za-z0-9_-]{3,32}$/;

const createSchema = z.object({
  targetUrl: z.string().url("目标 URL 不合法"),
  code: z
    .string()
    .regex(codeRegex, "短码格式不合法")
    .optional()
    .or(z.literal("")),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  maxClicks: z.number().int().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
});

const updateSchema = z.object({
  targetUrl: z.string().url("目标 URL 不合法").optional(),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  maxClicks: z.number().int().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize || "10", 10), 1),
      100,
    );
    const keyword = (req.query.keyword || "").toString().trim();
    const status = (req.query.status || "").toString();

    const where = {};
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { targetUrl: { contains: keyword } },
        { remark: { contains: keyword } },
      ];
    }
    if (status === "enabled") where.enabled = true;
    if (status === "disabled") where.enabled = false;

    const [total, items] = await Promise.all([
      prisma.shortLink.count({ where }),
      prisma.shortLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    res.json({ total, page, pageSize, items });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    let code = (data.code || "").trim();
    if (code) {
      const exist = await prisma.shortLink.findUnique({ where: { code } });
      if (exist) return res.status(409).json({ message: "该短码已被占用" });
    } else {
      for (let i = 0; i < 5; i++) {
        const c = genCode();
        const exist = await prisma.shortLink.findUnique({ where: { code: c } });
        if (!exist) {
          code = c;
          break;
        }
      }
      if (!code)
        return res.status(500).json({ message: "生成短码失败，请重试" });
    }

    const link = await prisma.shortLink.create({
      data: {
        code,
        targetUrl: data.targetUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxClicks: data.maxClicks ?? null,
        remark: data.remark || null,
        userId: req.user.uid,
      },
    });
    res.status(201).json(link);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const link = await prisma.shortLink.findUnique({ where: { id } });
    if (!link) return res.status(404).json({ message: "短链不存在" });

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const logs = await prisma.clickLog.findMany({
      where: { linkId: id, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const trendMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = 0;
    }
    for (const l of logs) {
      const key = l.createdAt.toISOString().slice(0, 10);
      if (key in trendMap) trendMap[key]++;
    }
    const trend = Object.entries(trendMap).map(([date, count]) => ({
      date,
      count,
    }));

    const recent = await prisma.clickLog.findMany({
      where: { linkId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ link, trend, recent });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateSchema.parse(req.body);
    const link = await prisma.shortLink.findUnique({ where: { id } });
    if (!link) return res.status(404).json({ message: "短链不存在" });

    const updated = await prisma.shortLink.update({
      where: { id },
      data: {
        targetUrl: data.targetUrl ?? link.targetUrl,
        expiresAt:
          data.expiresAt === undefined
            ? link.expiresAt
            : data.expiresAt
              ? new Date(data.expiresAt)
              : null,
        maxClicks:
          data.maxClicks === undefined ? link.maxClicks : data.maxClicks,
        remark: data.remark === undefined ? link.remark : data.remark,
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const enabled = !!req.body.enabled;
    const link = await prisma.shortLink.findUnique({ where: { id } });
    if (!link) return res.status(404).json({ message: "短链不存在" });
    const updated = await prisma.shortLink.update({
      where: { id },
      data: { enabled },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.shortLink.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ message: "短链不存在" });
    next(e);
  }
});

module.exports = router;
