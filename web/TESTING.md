# Testing Guide

This document describes the testing setup and how to run tests for the LLM-JIRA web application.

## Testing Framework

We use [Vitest](https://vitest.dev/) along with [React Testing Library](https://testing-library.com/react) for testing.

### Dependencies

- `vitest` - Testing framework (similar to Jest but optimized for Vite)
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM assertions
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for Node.js

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Files

### 1. API Service Tests ([src/services/api.test.ts](src/services/api.test.ts))

Tests for API client functions:

- **issuesApi**
  - Fetch all issues
  - Fetch issue by ID
  - Create new issue
  - Update issue

- **tasksApi**
  - Execute task
  - Get task status
  - Cancel task

- **releasesApi**
  - Fetch all releases
  - Create new release

### 2. Board Component Tests ([src/pages/Board.test.tsx](src/pages/Board.test.tsx))

Tests for the main Kanban board:

- Rendering issues in correct columns
- **Search functionality**
  - Filter by title
  - Filter by description
- **Filter functionality**
  - Filter by priority (HIGH, MEDIUM, LOW)
  - Combine search and priority filters
  - Reset filters
- **Hide done tasks** toggle
- Column issue counts

### 3. TaskExecutor Component Tests ([src/components/TaskExecutor.test.tsx](src/components/TaskExecutor.test.tsx))

Tests for terminal execution UI:

- Rendering command input and buttons
- Readonly mode (no rendering when readonly=true)
- Display execution results (stdout)
- Display execution errors (stderr)
- Show cancel button when running
- Disable input when task is running
- Show status badges (RUNNING, SUCCESS, FAILED)

## Writing New Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YourComponent from './YourComponent';

// Mock dependencies if needed
vi.mock('../services/api', () => ({
  someApi: {
    someMethod: vi.fn(),
  },
}));

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', async () => {
    render(<YourComponent />);

    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### Best Practices

1. **Use `waitFor` for async operations**: When components fetch data or update asynchronously, wrap assertions in `waitFor`.

2. **Mock external dependencies**: Mock API calls, timers, and other external dependencies to make tests predictable.

3. **Test user behavior, not implementation**: Focus on what users see and do, not internal component state.

4. **Use accessible queries**: Prefer queries like `getByRole`, `getByLabelText` over `getByTestId`.

5. **Clean up after tests**: Use `beforeEach` to reset mocks and clear any test state.

## Configuration

### Vitest Config ([vitest.config.ts](vitest.config.ts))

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

### Test Setup ([src/test/setup.ts](src/test/setup.ts))

Global test setup that runs before all tests:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});
```

## Coverage

To generate a test coverage report:

```bash
npm run test:coverage
```

This will create a coverage report showing:
- Lines covered
- Functions covered
- Branches covered
- Statements covered

## CI/CD Integration

Tests run automatically in CI/CD pipelines. To run tests in CI mode (no watch, single run):

```bash
npm test -- --run
```

## Troubleshooting

### Common Issues

**Issue: "Cannot find module" errors**
- Solution: Make sure all test files import from correct paths
- Check that mocks are set up before imports

**Issue: "Test timeout" errors**
- Solution: Increase timeout in test config or specific test
- Check for infinite loops or missing await statements

**Issue: "Act warnings" in tests**
- Solution: Wrap state updates in `waitFor` or use `act` from React Testing Library
- These warnings can usually be ignored if tests pass

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
