import api from './axios';
import type { PDFStatement, Transaction } from '../types/api';

export const pdfApi = {
  list: () => api.get<{ pdfs: PDFStatement[] }>('/pdf'),

  upload: (file: File, password: string, month?: string) => {
    const form = new FormData();
    form.append('pdf', file);
    form.append('password', password);
    if (month) form.append('month', month);
    return api.post<{ pdf: PDFStatement }>('/pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  verify: (id: string, password: string) =>
    api.post<{ sessionToken: string; expiresAt: string }>(`/pdf/${id}/verify`, { password }),

  analyze: (id: string, sessionToken: string, bankPassword?: string) =>
    api.post<{ transactionsImported: number; transactions: Transaction[] }>(
      `/pdf/${id}/analyze`,
      bankPassword ? { bankPassword } : {},
      { headers: { 'x-pdf-session': sessionToken } }
    ),

  delete: (id: string) => api.delete(`/pdf/${id}`),
};
