# LLM-JIRA Project Instructions for Gemini

You are working with LLM-JIRA, a task management system with REST API.

## Quick Reference

**API Base URL**: `http://localhost:3000`
**Database**: SQLite at `.llm-jira/prisma/dev.db`

## Key Commands

```bash
npx llm-jira init    # Initialize project
npx llm-jira start   # Start API server
npx llm-jira stop    # Stop server
npx llm-jira status  # Check if running
```

## API Usage

### Issues (Tasks)

**List all tasks**:
```bash
curl http://localhost:3000/api/issues
```

**Create task**:
```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"Task name","description":"Details","priority":"MEDIUM"}'
```

**Update task status**:
```bash
# Start working (set to ING)
curl -X PATCH http://localhost:3000/api/issues/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"ING"}'

# Complete task (set to DONE)
curl -X PATCH http://localhost:3000/api/issues/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'
```

### Executions

**Record your work**:
```bash
curl -X POST http://localhost:3000/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "issueId":"{task-id}",
    "llmProvider":"gemini",
    "prompt":"What you were asked to do",
    "response":"What you did",
    "status":"SUCCESS"
  }'
```

## Status Values

- `TODO` - Not started
- `ING` - In progress
- `DONE` - Completed
- `PENDING` - Blocked/waiting

## Priority Values

- `HIGH` - Urgent
- `MEDIUM` - Normal
- `LOW` - Low priority

## Typical Workflow

1. Receive task request
2. Create issue with `POST /api/issues`
3. Get issue ID from response
4. Update to `ING` status
5. Perform the work
6. Record execution with `POST /api/executions`
7. Update to `DONE` status

## Important Notes

- Always update task status when starting and completing work
- Record all executions for tracking
- Use gemini as the `llmProvider` value
- Include error details if task fails
