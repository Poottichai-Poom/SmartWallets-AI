import api from './axios';
import type { PDFStatement, Transaction } from '../types/api';

export const pdfApi = {
  list: () => api.get<{ pdfs: PDFStatement[] }>('/pdf'),

  upload: (file: File, month?: string) => {
    const form = new FormData();
    form.append('pdf', file);
    if (month) form.append('month', month);
    return api.post<{ pdf: PDFStatement; sessionToken: string; expiresAt: string }>('/pdf', form, {
      headers: { 'Content-Type': undefined },
    });
  },

  analyze: (id: string, sessionToken: string, bankPassword?: string) =>
    api.post<{ transactionsImported: number; transactions: Transaction[] }>(
      `/pdf/${id}/analyze`,
      bankPassword ? { bankPassword } : {},
      { headers: { 'x-pdf-session': sessionToken } }
    ),

  delete: (id: string) => api.delete(`/pdf/${id}`),
};
