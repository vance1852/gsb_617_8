const bcrypt = require("bcryptjs");
const prisma = require("./prisma");
const config = require("./config");

async function ensureAdmin() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("[seed] Users already exist, skip seeding admin.");
    return;
  }
  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await prisma.user.create({
    data: {
      username: config.adminUsername,
      passwordHash,
    },
  });
  console.log(
    `[seed] Default admin created: username="${config.adminUsername}", password="${config.adminPassword}"`,
  );
}

module.exports = { ensureAdmin };
