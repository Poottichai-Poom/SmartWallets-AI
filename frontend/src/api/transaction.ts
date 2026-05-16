import api from './axios';
import type { Transaction } from '../types/api';

export const transactionApi = {
  list: (params?: { month?: string; catId?: string; page?: number; limit?: number }) =>
    api.get<{ items: Transaction[]; total: number }>('/transactions', { params }),

  create: (data: { date: string; merchant: string; amount: number; catId?: string; note?: string }) =>
    api.post<Transaction>('/transactions', data),

  update: (id: string, data: Partial<{ date: string; merchant: string; amount: number; catId: string; note: string }>) =>
    api.put<Transaction>(`/transactions/${id}`, data),

  delete: (id: string) => api.delete(`/transactions/${id}`),
};
