import api from './axios';
import type { Goal } from '../types/api';

export const goalApi = {
  list: () => api.get<{ goals: Goal[] }>('/goals'),

  create: (data: Omit<Goal, 'id' | 'createdAt'>) =>
    api.post<Goal>('/goals', data),

  update: (id: string, data: Partial<Omit<Goal, 'id' | 'createdAt'>>) =>
    api.put<Goal>(`/goals/${id}`, data),

  delete: (id: string) => api.delete(`/goals/${id}`),
};
