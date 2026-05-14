import api from './axios';
import type { IncomeSource } from '../types/api';

export const incomeApi = {
  list: () => api.get<{ incomeSources: IncomeSource[] }>('/income'),

  create: (data: Omit<IncomeSource, 'id' | 'createdAt'>) =>
    api.post<IncomeSource>('/income', data),

  update: (id: string, data: Partial<Omit<IncomeSource, 'id' | 'createdAt'>>) =>
    api.put<IncomeSource>(`/income/${id}`, data),

  delete: (id: string) => api.delete(`/income/${id}`),
};
