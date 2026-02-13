const { User } = require('./Model/userRoleModel');
const { verifyToken, AUTH_TOKEN_COOKIE } = require('./util/jwtHelper');

const auth_middleware = (role) => {
  const roles = Array.isArray(role) ? role : [role];
  return async (req, res, next) => {
    const wantsJSON =
      req.headers.accept?.includes("application/json") ||
      req.headers.accept === "*/*" ||
      req.headers["content-type"] === "application/json" ||
      req.xhr ||
      req.originalUrl.startsWith("/api/");

    let user = null;

    // 1) Session valid (exists and not expired) → use session
    if (req.session.username) {
      const sessionExpired = req.session.cookie?._expires && new Date(req.session.cookie._expires) <= new Date();
      if (!sessionExpired) {
        user = await User.findOne({ username: req.session.username });
      }
    }

    // 2) Session missing or expired: check JWT in cookie (must not be expired)
    if (!user && req.cookies?.[AUTH_TOKEN_COOKIE]) {
      const payload = verifyToken(req.cookies[AUTH_TOKEN_COOKIE]);
      if (payload?.username) {
        user = await User.findOne({ username: payload.username });
      }
    }

    if (!user) {
      if (wantsJSON) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      return res.redirect("/loginPage");
    }

    req.user = user;

    if (roles.includes(user.role)) {
      return next();
    }

    if (!wantsJSON) {
      return res.redirect("/loginPage");
    }
    return res.status(403).json({ error: "Forbidden" });
  };
};

module.exports = auth_middleware;
