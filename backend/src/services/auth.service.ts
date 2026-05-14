import bcrypt from 'bcryptjs';
import { db } from '../db/store';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { AuthPayload } from '../types';

const SALT_ROUNDS = 12;

export async function register(email: string, password: string, name?: string) {
  if (db.findUserByEmail(email)) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = db.createUser({ email, passwordHash, name, role: 'USER' });
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function login(email: string, password: string) {
  const user = db.findUserByEmail(email);
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const payload: AuthPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.createRefreshToken(user.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function refreshTokens(rawRefreshToken: string) {
  const stored = db.findRefreshToken(rawRefreshToken);
  if (!stored || new Date(stored.expiresAt) < new Date()) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const { id } = verifyRefreshToken(rawRefreshToken);
  const user = db.findUserById(id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 401 });

  db.deleteRefreshToken(rawRefreshToken);

  const payload: AuthPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const newRefresh = generateRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.createRefreshToken(user.id, newRefresh, expiresAt);

  return { accessToken, refreshToken: newRefresh };
}

export function logout(refreshToken: string) {
  db.deleteRefreshToken(refreshToken);
}

export function getUserById(id: string) {
  const user = db.findUserById(id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
