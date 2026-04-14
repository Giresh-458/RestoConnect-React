const config = require("../config/env");

const buildBaseCookieOptions = () => {
  const options = {
    httpOnly: true,
    path: "/",
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
  };

  if (config.cookieDomain) {
    options.domain = config.cookieDomain;
  }

  return options;
};

const getSessionCookieOptions = () => ({
  ...buildBaseCookieOptions(),
  maxAge: config.sessionMaxAgeMs,
});

const getAuthCookieOptions = () => ({
  ...buildBaseCookieOptions(),
  maxAge: config.sessionMaxAgeMs,
});

const getClearCookieOptions = () => buildBaseCookieOptions();

const getCsrfCookieOptions = () => buildBaseCookieOptions();

module.exports = {
  getAuthCookieOptions,
  getClearCookieOptions,
  getCsrfCookieOptions,
  getSessionCookieOptions,
};
