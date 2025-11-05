import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TaskExecutor from './TaskExecutor';
import * as api from '../services/api';
import type { Issue } from '../types';

// Mock the API
vi.mock('../services/api', () => ({
  tasksApi: {
    execute: vi.fn(),
    getStatus: vi.fn(),
    cancel: vi.fn(),
  },
}));

const mockIssue: Issue = {
  id: 'test-issue-id',
  title: 'Test Issue',
  description: 'Test description',
  status: 'TODO',
  priority: 'MEDIUM',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TaskExecutor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render command input and execute button', async () => {
    vi.mocked(api.tasksApi.getStatus).mockResolvedValue({
      isRunning: false,
      latestExecution: null,
    });

    render(<TaskExecutor issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('예: npm test')).toBeInTheDocument();
      expect(screen.getByText('실행')).toBeInTheDocument();
    });
  });

  it('should not render when readonly is true', () => {
    const { container } = render(<TaskExecutor issue={mockIssue} readonly={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display execution results when available', async () => {
    vi.mocked(api.tasksApi.getStatus).mockResolvedValue({
      isRunning: false,
      latestExecution: {
        status: 'SUCCESS',
        startedAt: new Date().toISOString(),
        llmResponse: 'Test passed successfully',
        error: null,
      },
    });

    render(<TaskExecutor issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByText('Test passed successfully')).toBeInTheDocument();
      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    });
  });

  it('should display execution errors when available', async () => {
    vi.mocked(api.tasksApi.getStatus).mockResolvedValue({
      isRunning: false,
      latestExecution: {
        status: 'FAILED',
        startedAt: new Date().toISOString(),
        llmResponse: null,
        error: 'Test failed with error',
      },
    });

    render(<TaskExecutor issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByText('Test failed with error')).toBeInTheDocument();
      expect(screen.getByText('FAILED')).toBeInTheDocument();
    });
  });

  it('should show cancel button when task is running', async () => {
    vi.mocked(api.tasksApi.getStatus).mockResolvedValue({
      isRunning: true,
      latestExecution: {
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        llmResponse: null,
        error: null,
      },
    });

    render(<TaskExecutor issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByText('취소')).toBeInTheDocument();
    });
  });

  it('should disable input when task is running', async () => {
    vi.mocked(api.tasksApi.getStatus).mockResolvedValue({
      isRunning: true,
      latestExecution: {
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        llmResponse: null,
        error: null,
      },
    });

    render(<TaskExecutor issue={mockIssue} />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('예: npm test');
      expect(input).toBeDisabled();
    });
  });

  it('should show RUNNING status badge correctly', async () => {
    vi.mocked(api.tasksApi.getStatus).mockResolvedValue({
      isRunning: true,
      latestExecution: {
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        llmResponse: null,
        error: null,
      },
    });

    render(<TaskExecutor issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
    });
  });
});
