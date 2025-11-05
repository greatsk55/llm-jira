# LLM-JIRA Integration Guide for ChatGPT

## Overview

This project uses LLM-JIRA for task management. You can interact with tasks via REST API.

**Server**: `http://localhost:3000`

## Setup Commands

```bash
npx llm-jira init     # Initialize in project
npx llm-jira start    # Start server (port 3000)
npx llm-jira stop     # Stop server
npx llm-jira status   # Check status
```

## API Endpoints

### Tasks (Issues)

**GET /api/issues** - List all tasks
```bash
curl http://localhost:3000/api/issues
```

**POST /api/issues** - Create new task
```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task title",
    "description": "Task description",
    "priority": "MEDIUM"
  }'
```

**PATCH /api/issues/:id** - Update task
```bash
curl -X PATCH http://localhost:3000/api/issues/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "ING"}'
```

**DELETE /api/issues/:id** - Delete task
```bash
curl -X DELETE http://localhost:3000/api/issues/{id}
```

### Execution Tracking

**POST /api/executions** - Log your work
```bash
curl -X POST http://localhost:3000/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "{task-id}",
    "llmProvider": "openai",
    "prompt": "User request",
    "response": "Your response",
    "status": "SUCCESS"
  }'
```

### File Attachments

**POST /api/attachments/:issueId** - Upload file
**GET /api/attachments/:id** - Download file
**DELETE /api/attachments/:id** - Delete file

### Releases

**POST /api/releases** - Create release snapshot
```bash
curl -X POST http://localhost:3000/api/releases \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v1.0.0",
    "description": "Release notes"
  }'
```

## Data Models

### Task Status
- `TODO` - Ready to start
- `ING` - Currently working
- `DONE` - Finished
- `PENDING` - Blocked

### Priority
- `HIGH` - Critical/urgent
- `MEDIUM` - Normal
- `LOW` - Nice to have

### Execution Status
- `RUNNING` - In progress
- `SUCCESS` - Completed successfully
- `FAILED` - Failed with error

## Workflow Example

**User**: "Please implement user authentication"

**You should**:

1. Create task:
```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"Implement user authentication","description":"Add login/signup with JWT","priority":"HIGH"}'
# Response: {"id":"abc123",...}
```

2. Update to in-progress:
```bash
curl -X PATCH http://localhost:3000/api/issues/abc123 \
  -H "Content-Type: application/json" \
  -d '{"status":"ING"}'
```

3. Do the work...

4. Record execution:
```bash
curl -X POST http://localhost:3000/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "issueId":"abc123",
    "llmProvider":"openai",
    "prompt":"Implement user authentication",
    "response":"Implemented JWT auth with login/signup endpoints",
    "status":"SUCCESS"
  }'
```

5. Mark as done:
```bash
curl -X PATCH http://localhost:3000/api/issues/abc123 \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'
```

## Best Practices

✅ Always update task status (TODO → ING → DONE)
✅ Record executions for tracking
✅ Use "openai" as llmProvider
✅ Include error details if task fails
✅ Set appropriate priority levels
✅ Create releases for major milestones
