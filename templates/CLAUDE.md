# LLM-JIRA Project Rules for Claude

This project uses LLM-JIRA, a local task management system with API integration.

## Project Structure

- **Database**: SQLite database at `.llm-jira/prisma/dev.db`
- **API Server**: Running at `http://localhost:3000`
- **Web UI**: Available at `http://localhost:3000` when server is running

## Available Commands

### CLI Commands
```bash
# Initialize project
npx llm-jira init

# Start server
npx llm-jira start

# Stop server
npx llm-jira stop

# Check status
npx llm-jira status
```

## API Endpoints

### Issues (Tasks)
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Create new issue
  ```json
  {
    "title": "Task title",
    "description": "Task description",
    "priority": "LOW" | "MEDIUM" | "HIGH"
  }
  ```
- `GET /api/issues/:id` - Get issue by ID
- `PATCH /api/issues/:id` - Update issue
  ```json
  {
    "title": "Updated title",
    "description": "Updated description",
    "status": "TODO" | "ING" | "DONE" | "PENDING",
    "priority": "LOW" | "MEDIUM" | "HIGH"
  }
  ```
- `DELETE /api/issues/:id` - Delete issue

### Executions
- `GET /api/executions` - Get all executions
- `POST /api/executions` - Create execution record
  ```json
  {
    "issueId": "issue-uuid",
    "llmProvider": "claude" | "openai" | "gemini",
    "prompt": "The prompt used",
    "response": "LLM response",
    "status": "RUNNING" | "SUCCESS" | "FAILED",
    "error": "Error message if failed"
  }
  ```
- `PATCH /api/executions/:id` - Update execution status

### Releases
- `GET /api/releases` - Get all releases
- `POST /api/releases` - Create release snapshot
  ```json
  {
    "version": "v1.0.0",
    "description": "Release description"
  }
  ```

### Attachments
- `POST /api/attachments/:issueId` - Upload file (multipart/form-data)
- `GET /api/attachments/:id` - Download file
- `DELETE /api/attachments/:id` - Delete file

## Working with Tasks

### Creating a Task
When user asks to create a task, use the API:
```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature X",
    "description": "Detailed description",
    "priority": "HIGH"
  }'
```

### Updating Task Status
When starting work on a task, update status to "ING":
```bash
curl -X PATCH http://localhost:3000/api/issues/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "ING"}'
```

When task is completed, update to "DONE":
```bash
curl -X PATCH http://localhost:3000/api/issues/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE"}'
```

### Recording Execution
When you execute a task, create an execution record:
```bash
curl -X POST http://localhost:3000/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "{issue-id}",
    "llmProvider": "claude",
    "prompt": "The task description",
    "response": "Execution result",
    "status": "SUCCESS"
  }'
```

## Best Practices

1. **Always check server status** before working with tasks
2. **Update task status** when starting (ING) and completing (DONE)
3. **Record executions** for all automated work
4. **Use appropriate priority levels** (HIGH for urgent, MEDIUM for normal, LOW for nice-to-have)
5. **Create releases** when completing major milestones

## Status Definitions

- **TODO**: Task is ready to be worked on
- **ING**: Task is currently in progress
- **DONE**: Task is completed
- **PENDING**: Task is blocked or waiting for something

## Priority Levels

- **HIGH**: Urgent, needs immediate attention
- **MEDIUM**: Normal priority, work on after HIGH tasks
- **LOW**: Nice to have, work on when time permits

## Example Workflow

1. User requests a new feature
2. Create issue via API with status "TODO"
3. Update status to "ING" when starting work
4. Execute the task (write code, run commands, etc.)
5. Record execution with success/failure status
6. Update issue status to "DONE" when complete
7. Attach any relevant files if needed
