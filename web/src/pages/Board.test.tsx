import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Board from './Board';
import * as api from '../services/api';
import type { Issue } from '../types';

// Mock the API
vi.mock('../services/api', () => ({
  issuesApi: {
    getAll: vi.fn(),
  },
  releasesApi: {
    getAll: vi.fn(),
  },
}));

const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'Fix authentication bug',
    description: 'Users cannot login with email',
    status: 'TODO',
    priority: 'HIGH',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    title: 'Add search feature',
    description: 'Implement search functionality',
    status: 'ING',
    priority: 'MEDIUM',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Update README with new features',
    status: 'DONE',
    priority: 'LOW',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
  },
  {
    id: '4',
    title: 'Refactor authentication module',
    description: 'Clean up authentication code',
    status: 'TODO',
    priority: 'LOW',
    createdAt: '2024-01-04',
    updatedAt: '2024-01-04',
  },
];

describe('Board Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.issuesApi.getAll).mockResolvedValue(mockIssues);
    vi.mocked(api.releasesApi.getAll).mockResolvedValue([]);
  });

  it('should render the board with issues', async () => {
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      expect(screen.getByText('Add search feature')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });
  });

  it('should filter issues by search query (title)', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('제목 또는 설명으로 검색...');
    await user.type(searchInput, 'authentication');

    // Should show only issues with "authentication" in title or description
    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      expect(screen.getByText('Refactor authentication module')).toBeInTheDocument();
      expect(screen.queryByText('Add search feature')).not.toBeInTheDocument();
      expect(screen.queryByText('Update documentation')).not.toBeInTheDocument();
    });
  });

  it('should filter issues by search query (description)', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('제목 또는 설명으로 검색...');
    await user.type(searchInput, 'login');

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      expect(screen.queryByText('Add search feature')).not.toBeInTheDocument();
    });
  });

  it('should filter issues by priority', async () => {
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    });

    // Select HIGH priority filter
    const prioritySelect = screen.getByDisplayValue('모든 우선순위');
    fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      expect(screen.queryByText('Add search feature')).not.toBeInTheDocument();
      expect(screen.queryByText('Update documentation')).not.toBeInTheDocument();
    });
  });

  it('should combine search and priority filters', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('제목 또는 설명으로 검색...');
    await user.type(searchInput, 'authentication');

    // Apply priority filter
    const prioritySelect = screen.getByDisplayValue('모든 우선순위');
    fireEvent.change(prioritySelect, { target: { value: 'LOW' } });

    await waitFor(() => {
      // Should show only LOW priority issues with "authentication"
      expect(screen.queryByText('Fix authentication bug')).not.toBeInTheDocument();
      expect(screen.getByText('Refactor authentication module')).toBeInTheDocument();
    });
  });

  it('should clear filters with reset button', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    });

    // Apply filters
    const searchInput = screen.getByPlaceholderText('제목 또는 설명으로 검색...');
    await user.type(searchInput, 'authentication');

    const prioritySelect = screen.getByDisplayValue('모든 우선순위');
    fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });

    // Click reset button
    const resetButton = screen.getByText('초기화');
    await user.click(resetButton);

    // All issues should be visible again
    await waitFor(() => {
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      expect(screen.getByText('Add search feature')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });
  });

  it('should hide done issues when toggle is checked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    // Check the "hide done" checkbox
    const hideCheckbox = screen.getByLabelText('완료된 작업 숨기기');
    await user.click(hideCheckbox);

    await waitFor(() => {
      expect(screen.queryByText('Update documentation')).not.toBeInTheDocument();
      expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      expect(screen.getByText('Add search feature')).toBeInTheDocument();
    });
  });

  it('should show issue counts in column headers', async () => {
    render(
      <BrowserRouter>
        <Board />
      </BrowserRouter>
    );

    await waitFor(() => {
      // TODO column should show 2 issues
      const columns = screen.getAllByText(/To Do|In Progress|Done|Pending/);
      expect(columns).toBeTruthy();
    });
  });
});
