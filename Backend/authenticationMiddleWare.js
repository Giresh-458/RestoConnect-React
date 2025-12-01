const session = require('express-session');
const { User } = require('./Model/userRoleModel');

const auth_middleware = (role) => {
  return async (req, res, next) => {
    
    const wantsJSON =
      req.headers.accept?.includes("application/json") ||
      req.headers.accept === "*/*" ||
      req.headers["content-type"] === "application/json" ||
      req.xhr ||
      req.originalUrl.startsWith("/api/");

    if (!req.session.username) {
      if (wantsJSON) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      return res.redirect("/loginPage");
    }

    const user = await User.findOne({ username: req.session.username });

    if (!user) {
      if (!wantsJSON) {
        return res.redirect("/loginPage");
      }
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = user;

    if (user.role === role) {
    
      return next();
    }

    if (!wantsJSON) {
      return res.redirect("/loginPage");
    }
    return res.status(403).json({ error: "Forbidden" });
  };
};

module.exports = auth_middleware;
