const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler } = require('./middlewares/error');
const authRouter = require('./routes/auth');
const linksRouter = require('./routes/links');
const statsRouter = require('./routes/stats');
const redirectRouter = require('./routes/redirect');
const { ensureAdmin } = require('./seed');
const prisma = require('./prisma');

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/links', linksRouter);
app.use('/api/stats', statsRouter);

app.use('/r', redirectRouter);

app.use(errorHandler);

async function bootstrap() {
  let attempts = 0;
  while (attempts < 30) {
    try {
      await prisma.$connect();
      break;
    } catch (e) {
      attempts++;
      console.log(`[boot] DB not ready, retry ${attempts}/30 in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await ensureAdmin();
  app.listen(config.port, () => {
    console.log(`[boot] Backend listening on port ${config.port}`);
  });
}

bootstrap().catch((e) => {
  console.error('[boot] Failed to start:', e);
  process.exit(1);
});
