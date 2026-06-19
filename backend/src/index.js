require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, User } = require('./models');

const authRoutes = require('./routes/auth');
const shortUrlRoutes = require('./routes/shorturls');
const statsRoutes = require('./routes/stats');
const redirectRoutes = require('./routes/redirect');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.set('trust proxy', true);

app.use('/api/auth', authRoutes);
app.use('/api/shorturls', shortUrlRoutes);
app.use('/api/stats', statsRoutes);
app.use('/s', redirectRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function initAdminUser() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingUser = await User.findOne({ where: { username } });
    if (!existingUser) {
      await User.create({ username, password });
      console.log(`Admin user '${username}' created successfully`);
    } else {
      console.log(`Admin user '${username}' already exists`);
    }
  } catch (error) {
    console.error('Failed to init admin user:', error);
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    await sequelize.sync();
    console.log('Database synchronized');

    await initAdminUser();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
