import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from './error.js';

export function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Not authorized, no token');
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) throw new HttpError(401, 'User no longer exists');
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, 'Not authorized, invalid token'));
  }
}

export function adminOnly(req, _res, next) {
  if (!req.user?.isAdmin) return next(new HttpError(403, 'Admin access required'));
  next();
}
