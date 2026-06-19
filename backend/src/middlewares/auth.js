const jwt = require("jsonwebtoken");
const config = require("../config");

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "未登录或登录已失效" });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "登录态无效，请重新登录" });
  }
}

module.exports = { authRequired };
