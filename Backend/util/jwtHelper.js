const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'session';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d'; // match session maxAge (30 days)
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
