"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshTokens = refreshTokens;
exports.logout = logout;
exports.getUserById = getUserById;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const store_1 = require("../db/store");
const jwt_utils_1 = require("../utils/jwt.utils");
const SALT_ROUNDS = 12;
async function register(email, password, name) {
    if (store_1.db.findUserByEmail(email)) {
        throw Object.assign(new Error('Email already registered'), { status: 409 });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    const user = store_1.db.createUser({ email, passwordHash, name, role: 'USER' });
    const { passwordHash: _, ...safe } = user;
    return safe;
}
async function login(email, password) {
    const user = store_1.db.findUserByEmail(email);
    if (!user)
        throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    store_1.db.createRefreshToken(user.id, refreshToken, expiresAt);
    return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
}
async function refreshTokens(rawRefreshToken) {
    const stored = store_1.db.findRefreshToken(rawRefreshToken);
    if (!stored || new Date(stored.expiresAt) < new Date()) {
        throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
    }
    const { id } = (0, jwt_utils_1.verifyRefreshToken)(rawRefreshToken);
    const user = store_1.db.findUserById(id);
    if (!user)
        throw Object.assign(new Error('User not found'), { status: 401 });
    store_1.db.deleteRefreshToken(rawRefreshToken);
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const newRefresh = (0, jwt_utils_1.generateRefreshToken)(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    store_1.db.createRefreshToken(user.id, newRefresh, expiresAt);
    return { accessToken, refreshToken: newRefresh };
}
function logout(refreshToken) {
    store_1.db.deleteRefreshToken(refreshToken);
}
function getUserById(id) {
    const user = store_1.db.findUserById(id);
    if (!user)
        throw Object.assign(new Error('User not found'), { status: 404 });
    const { passwordHash: _, ...safe } = user;
    return safe;
}
async function hashPassword(plain) {
    return bcryptjs_1.default.hash(plain, SALT_ROUNDS);
}
async function verifyPassword(plain, hash) {
    return bcryptjs_1.default.compare(plain, hash);
}
