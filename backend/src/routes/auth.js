const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma');
const config = require('../config');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { username: data.username } });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const token = jwt.sign(
      { uid: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    next(e);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.uid } });
    if (!user) return res.status(401).json({ message: '用户不存在' });
    res.json({ id: user.id, username: user.username });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
