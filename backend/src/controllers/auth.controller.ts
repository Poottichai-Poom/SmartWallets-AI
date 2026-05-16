import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/auth.service';
import { logAction } from '../services/audit.service';
import { AuthRequest } from '../types';

export const registerValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().isLength({ max: 100 }),
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const user = await authService.register(email, password, name);
    logAction('USER_REGISTERED', `user:${user.id}`, { userId: user.id, req });
    res.status(201).json({ message: 'Account created', user });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    logAction('USER_LOGIN', `user:${result.user.id}`, { userId: result.user.id, req });
    res.json(result);
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ message: 'refreshToken required' }); return; }
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) authService.logout(refreshToken);
    const authReq = req as AuthRequest;
    if (authReq.user) logAction('USER_LOGOUT', `user:${authReq.user.id}`, { userId: authReq.user.id, req });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
}

export function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = authService.getUserById(req.user!.id);
    res.json(user);
  } catch (err) { next(err); }
}
