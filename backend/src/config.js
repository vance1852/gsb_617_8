require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:8080`,
  databaseUrl: process.env.DATABASE_URL,
};

module.exports = config;
