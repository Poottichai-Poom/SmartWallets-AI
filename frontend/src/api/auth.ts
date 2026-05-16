import api from './axios';
import type { AuthResponse, User } from '../types/api';

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post<{ user: User }>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () => api.get<User>('/auth/me'),
};
