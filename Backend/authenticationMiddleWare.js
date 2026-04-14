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

    // 1) Stateless auth: try JWT from HTTP-only cookie first
    if (req.cookies?.[AUTH_TOKEN_COOKIE]) {
      const payload = verifyToken(req.cookies[AUTH_TOKEN_COOKIE]);
      if (payload?.username) {
        user = await User.findOne({ username: payload.username });
      }
    }

    // 2) Legacy fallback: session-based auth (kept only for compatibility / csurf)
    if (!user && req.session?.username) {
      const sessionExpired =
        req.session.cookie?._expires &&
        new Date(req.session.cookie._expires) <= new Date();
      if (!sessionExpired) {
        user = await User.findOne({ username: req.session.username });
      }
    }

    if (!user) {
      if (wantsJSON) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      return res.redirect("/loginPage");
    }

    // Attach full user + lightweight auth context to the request
    req.user = user;
    req.auth = {
      username: user.username,
      role: user.role,
      rest_id: user.rest_id || null,
    };

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
