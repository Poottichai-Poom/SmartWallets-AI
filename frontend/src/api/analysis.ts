import api from './axios';
import type { MonthlySummary, CategorySummary, SpendingLeak, AllocationItem } from '../types/api';

export const analysisApi = {
  summary: (month?: string) =>
    api.get<MonthlySummary>('/analysis/summary', { params: { month } }),

  categories: (month?: string) =>
    api.get<{ categories: CategorySummary[] }>('/analysis/categories', { params: { month } }),

  daily: (month?: string) =>
    api.get<{ month: string; daily: number[] }>('/analysis/daily', { params: { month } }),

  leaks: (month?: string) =>
    api.get<{ leaks: SpendingLeak[] }>('/analysis/leaks', { params: { month } }),

  recommendations: (month?: string) =>
    api.get<{ analysis: string }>('/analysis/recommendations', { params: { month } }),

  recommendedAllocation: (month?: string) =>
    api.get<{ allocations: AllocationItem[]; totalIncome: number }>('/analysis/recommended-allocation', { params: { month } }),
};
