import axios from 'axios';
import type { Issue, CreateIssueDto, UpdateIssueDto, Execution, Release } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Issues API
export const issuesApi = {
  getAll: async (params?: { status?: string; priority?: string }) => {
    const response = await api.get<Issue[]>('/issues', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Issue>(`/issues/${id}`);
    return response.data;
  },

  create: async (data: CreateIssueDto) => {
    const response = await api.post<Issue>('/issues', data);
    return response.data;
  },

  update: async (id: string, data: UpdateIssueDto) => {
    const response = await api.patch<Issue>(`/issues/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/issues/${id}`);
  },
};

// Attachments API
export const attachmentsApi = {
  upload: async (issueId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('issueId', issueId);

    const response = await api.post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  download: async (id: string) => {
    const response = await api.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/attachments/${id}`);
  },
};

// Executions API
export const executionsApi = {
  getAll: async (issueId?: string) => {
    const response = await api.get<Execution[]>('/executions', {
      params: issueId ? { issueId } : undefined,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Execution>(`/executions/${id}`);
    return response.data;
  },

  getStatus: async (id: string) => {
    const response = await api.get<Execution>(`/executions/${id}/status`);
    return response.data;
  },
};

// Releases API
export const releasesApi = {
  getAll: async () => {
    const response = await api.get<Release[]>('/releases');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Release>(`/releases/${id}`);
    return response.data;
  },

  create: async (version: string) => {
    const response = await api.post<Release>('/releases', { version });
    return response.data;
  },

  checkout: async (id: string) => {
    const response = await api.post(`/releases/${id}/checkout`);
    return response.data;
  },
};

export default api;
