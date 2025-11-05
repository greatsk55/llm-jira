import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Issue, CreateIssueDto, UpdateIssueDto } from '../types';

// Create mock axios instance
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

// Mock axios module
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('API Services', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reimport to get fresh instances with cleared mocks
    vi.resetModules();
  });

  describe('issuesApi', () => {
    it('should fetch all issues', async () => {
      const mockIssues: Issue[] = [
        {
          id: '1',
          title: 'Test Issue',
          description: 'Test Description',
          status: 'TODO',
          priority: 'HIGH',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockIssues });

      const { issuesApi } = await import('./api');
      const result = await issuesApi.getAll();
      expect(result).toEqual(mockIssues);
    });

    it('should fetch issue by id', async () => {
      const mockIssue: Issue = {
        id: '1',
        title: 'Test Issue',
        description: 'Test Description',
        status: 'TODO',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockIssue });

      const { issuesApi } = await import('./api');
      const result = await issuesApi.getById('1');
      expect(result).toEqual(mockIssue);
    });

    it('should create a new issue', async () => {
      const newIssue: CreateIssueDto = {
        title: 'New Issue',
        description: 'New Description',
        priority: 'MEDIUM',
      };

      const mockCreatedIssue: Issue = {
        id: '2',
        ...newIssue,
        description: newIssue.description!,
        status: 'TODO',
        priority: 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockCreatedIssue });

      const { issuesApi } = await import('./api');
      const result = await issuesApi.create(newIssue);
      expect(result).toEqual(mockCreatedIssue);
    });

    it('should update an issue', async () => {
      const updateData: UpdateIssueDto = {
        title: 'Updated Issue',
        status: 'ING',
      };

      const mockUpdatedIssue: Issue = {
        id: '1',
        title: 'Updated Issue',
        description: 'Test Description',
        status: 'ING',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAxiosInstance.patch.mockResolvedValue({ data: mockUpdatedIssue });

      const { issuesApi } = await import('./api');
      const result = await issuesApi.update('1', updateData);
      expect(result).toEqual(mockUpdatedIssue);
    });
  });

  describe('tasksApi', () => {
    it('should execute a task', async () => {
      const mockResponse = { success: true };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const { tasksApi } = await import('./api');
      const result = await tasksApi.execute('1', 'npm test');
      expect(result).toEqual(mockResponse);
    });

    it('should get task status', async () => {
      const mockStatus = {
        isRunning: true,
        latestExecution: {
          status: 'RUNNING',
          startedAt: new Date().toISOString(),
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockStatus });

      const { tasksApi } = await import('./api');
      const result = await tasksApi.getStatus('1');
      expect(result).toEqual(mockStatus);
    });

    it('should cancel a task', async () => {
      const mockResponse = { success: true };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const { tasksApi } = await import('./api');
      const result = await tasksApi.cancel('1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('releasesApi', () => {
    it('should fetch all releases', async () => {
      const mockReleases = [
        {
          id: '1',
          version: 'v1.0.0',
          gitCommitHash: 'abc123',
          gitTag: 'v1.0.0',
          snapshot: '[]',
          createdAt: new Date().toISOString(),
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockReleases });

      const { releasesApi } = await import('./api');
      const result = await releasesApi.getAll();
      expect(result).toEqual(mockReleases);
    });

    it('should create a new release', async () => {
      const mockRelease = {
        id: '2',
        version: 'v1.1.0',
        gitCommitHash: 'def456',
        gitTag: 'v1.1.0',
        snapshot: '[]',
        createdAt: new Date().toISOString(),
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockRelease });

      const { releasesApi } = await import('./api');
      const result = await releasesApi.create('v1.1.0');
      expect(result).toEqual(mockRelease);
    });
  });
});
