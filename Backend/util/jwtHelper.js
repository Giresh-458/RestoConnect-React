const jwt = require('jsonwebtoken');
const config = require('../config/env');

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRY = config.jwtExpiry;
const AUTH_TOKEN_COOKIE = 'authToken';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken, AUTH_TOKEN_COOKIE, JWT_EXPIRY };
