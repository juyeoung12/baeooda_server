// utils/jwt.js
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY);
};
