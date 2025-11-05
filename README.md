# LLM-Jira

A local LLM-based project management tool that runs in your local environment. It provides a Jira-like UI with automated task execution and testing powered by LLMs.

[한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

<a href="https://www.buymeacoffee.com/ryokai" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/arial-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Key Features

### 🚀 **Domain-Based Parallel Execution** - The Game Changer
The standout feature that sets LLM-Jira apart! Execute multiple tasks simultaneously without conflicts by leveraging intelligent domain tagging.

**How it works:**
- Tag each task with a domain (e.g., `frontend`, `backend`, `database`, `auth`)
- Tasks from different domains run in parallel automatically
- Tasks from the same domain wait their turn to prevent conflicts
- No domain? No problem - tasks run freely without restrictions

**Real-world example:**
```
✅ Frontend redesign (frontend)     → Running
✅ API optimization (backend)       → Running in parallel
✅ Documentation update (no domain) → Running in parallel
⏸️ Component refactor (frontend)   → Waiting for frontend task
```

This means you can have your LLM agent working on frontend improvements while simultaneously handling backend optimizations and updating documentation - maximizing productivity and minimizing idle time!

## Screenshots

### Main Board View - Kanban Interface
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎯 LLM-JIRA                    [⚙️ LLM Settings]  [🏷️ Release]  [+ New Task] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐│
│  │   📋 TODO    │   │ ⚡ IN_PROGRESS│   │  ✅ DONE     │   │  ⏸️ PENDING  ││
│  ├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤│
│  │              │   │              │   │              │   │              ││
│  │ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────┐ ││
│  │ │Task #3   │ │   │ │Task #1   │ │   │ │Task #4   │ │   │ │Task #7   │ ││
│  │ │frontend  │ │   │ │backend   │ │   │ │database  │ │   │ │frontend  │ ││
│  │ │🔴 HIGH   │ │   │ │🟡 MEDIUM │ │   │ │🟢 LOW    │ │   │ │🔴 HIGH   │ ││
│  │ │📎 2 files│ │   │ │🤖 Running│ │   │ │✓ Tested  │ │   │ │❌ Failed │ ││
│  │ └──────────┘ │   │ └──────────┘ │   │ └──────────┘ │   │ └──────────┘ ││
│  │              │   │              │   │              │   │              ││
│  │ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────┐ │   │              ││
│  │ │Task #5   │ │   │ │Task #2   │ │   │ │Task #6   │ │   │              ││
│  │ │docs      │ │   │ │frontend  │ │   │ │tests     │ │   │              ││
│  │ │🟢 LOW    │ │   │ │🟡 MEDIUM │ │   │ │🟡 MEDIUM │ │   │              ││
│  │ │          │ │   │ │⏳ Waiting│ │   │ │✓ Passed  │ │   │              ││
│  │ └──────────┘ │   │ └──────────┘ │   │ └──────────┘ │   │              ││
│  │              │   │              │   │              │   │              ││
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘│
│                                                                             │
│  💡 Tip: Task #1 (backend) and Task #3 (frontend) can run in parallel!     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Task Details & Real-time LLM Execution
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Task #1: Implement user authentication                            [× Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📝 Description:                                                            │
│  Add JWT-based authentication to the API endpoints                         │
│                                                                             │
│  🏷️ Domain: backend                                                        │
│  🔴 Priority: HIGH                                                          │
│  📎 Attachments: auth-flow.png, requirements.md                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 LLM Execution Log                                    [🔄 Running] │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │ [14:23:45] 🚀 Starting task execution...                           │   │
│  │ [14:23:46] 📦 Installing dependencies: jsonwebtoken bcryptjs       │   │
│  │ [14:23:50] ✅ Dependencies installed successfully                  │   │
│  │ [14:23:51] 📝 Creating auth middleware in src/middleware/auth.ts   │   │
│  │ [14:23:55] 🔧 Implementing JWT token generation...                 │   │
│  │ [14:23:58] 🔧 Implementing password hashing...                     │   │
│  │ [14:24:02] ✅ Auth middleware created                              │   │
│  │ [14:24:03] 🧪 Running tests...                                     │   │
│  │ [14:24:10] ✅ All tests passed (12/12)                             │   │
│  │ [14:24:11] 🎉 Task completed successfully!                         │   │
│  │                                                                     │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░  85% Complete                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [▶️ Execute LLM]  [⏸️ Cancel]  [📋 View Full Log]                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Domain-Based Parallel Execution
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔄 Active Executions - 3 tasks running in parallel                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 🟢 Task #1: API optimization                           [backend]   │    │
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ 45% - Analyzing queries...      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 🟢 Task #3: UI redesign                                [frontend]  │    │
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 68% - Updating components...    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 🟢 Task #5: Update documentation                       [docs]      │    │
│  │    ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░ 30% - Writing API docs...       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ⏸️ Waiting Tasks:                                                          │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ⏳ Task #2: Component refactor                         [frontend]  │    │
│  │    ⚠️  Waiting for frontend domain (Task #3 in progress)           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ⏳ Task #4: Database migration                         [backend]   │    │
│  │    ⚠️  Waiting for backend domain (Task #1 in progress)            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  💡 3 domains active: backend, frontend, docs                              │
│  🚀 2 tasks queued, will start when domains are free                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Note:** To add real screenshots to your repository, create a `docs/images/` directory and add your screenshots there. The ASCII art above gives you a visual representation of the interface.

### Other Powerful Features

- 📋 **Task Management**: Manage tasks with TODO, IN_PROGRESS, DONE, and PENDING statuses
- 🤖 **LLM Integration**: Automatic integration with local LLM CLIs like Claude and ChatGPT
- ⚡ **Terminal Execution**: Automatically execute tasks as local terminal commands
- 📊 **Real-time Logs**: View LLM execution output in real-time
- 🏷️ **Release Management**: Git-based version control and snapshots
- 📎 **File Attachments**: Attach images and files to tasks
- 🔍 **Search/Filter**: Search tasks by title, description, and priority
- 🌐 **Multi-language Support**: UI automatically adapts to browser language
- 🎯 **Drag & Drop**: Move tasks between columns with drag-and-drop

## Quick Start

### Installation and Running

```bash
# Clone the repository
git clone https://github.com/yourusername/llm-jira.git
cd llm-jira

# Install dependencies
npm install

# Initialize database
npm run prisma:migrate

# Start development server
npm run dev
```

The server will start and you can access the web UI at `http://localhost:5173`.

### LLM CLI Setup

To use LLM integration, you need to install an LLM CLI locally:

**Installing Claude CLI:**
```bash
npm install -g @anthropic-ai/claude-cli
# or
brew install claude
```

**Usage:**
1. Click the "LLM Settings" button at the top of the web UI
2. Select the LLM to use (Claude, ChatGPT, or Custom)
3. Choose your preferred language
4. Save

Now when you click the "Execute LLM" button on a task card, the task content and attachments will be automatically sent to the LLM.

## Usage

### Creating Tasks

Click the "New Task" button in the web UI to create a task. Each task can have:
- Title
- Description
- Domain tag (for parallel execution control)
- File attachments (optional)
- Priority

**Pro tip:** Assign domain tags strategically to maximize parallel execution. For example:
- `frontend` - React components, UI styling
- `backend` - API routes, business logic
- `database` - Schemas, migrations
- `tests` - Test files
- `docs` - Documentation

### Using LLM to Generate Tasks Automatically

You can leverage LLM to automatically break down large features into manageable tasks with proper domain tags. Here's how:

**1. Prompt Template for Task Generation:**
```
I need to implement [FEATURE_NAME]. Please break this down into specific,
actionable tasks for a Kanban board. For each task, provide:
- A clear, concise title
- Detailed description of what needs to be done
- Appropriate domain tag (frontend/backend/database/tests/docs)
- Priority level (HIGH/MEDIUM/LOW)

Format the output as a list of tasks that can be directly added to the system.
```

**2. Example - Feature: "User Authentication System"**

**Prompt:**
```
I need to implement a JWT-based user authentication system. Please break this
down into tasks with domain tags for parallel execution.
```

**LLM Output (structured for parallel execution):**
```
Task 1: Design database schema for users
- Domain: database
- Priority: HIGH
- Description: Create User model with email, password hash, and timestamps

Task 2: Create authentication API endpoints
- Domain: backend
- Priority: HIGH
- Description: Implement /login, /register, /logout endpoints with JWT

Task 3: Build login/register UI components
- Domain: frontend
- Priority: MEDIUM
- Description: Create React forms for user authentication

Task 4: Write authentication tests
- Domain: tests
- Priority: HIGH
- Description: Unit and integration tests for auth flow

Task 5: Document authentication API
- Domain: docs
- Priority: LOW
- Description: API documentation for authentication endpoints
```

**Why this works:**
- ✅ Tasks 1, 2, 3, 4, and 5 can all run in parallel (different domains)
- ✅ Clear separation of concerns
- ✅ Maximizes LLM agent productivity
- ✅ Reduces idle time waiting for dependencies

**3. Advanced: Using LLM to Plan Task Dependencies**

For complex features, ask the LLM to identify dependencies:

```
For the user authentication feature, which tasks must be completed before
others can start? Organize them by execution waves for parallel processing.
```

**Example Response:**
```
Wave 1 (parallel execution):
- Database schema design [database]
- UI component wireframes [frontend]
- API documentation structure [docs]

Wave 2 (after Wave 1):
- Auth API implementation [backend]
- Login/Register components [frontend]

Wave 3 (after Wave 2):
- Integration tests [tests]
- Final documentation [docs]
```

**4. Best Practices:**

✅ **DO:**
- Use descriptive, action-oriented task titles
- Assign appropriate domain tags for parallel execution
- Break down large tasks into smaller, manageable pieces
- Include acceptance criteria in descriptions
- Consider test tasks for each feature

❌ **DON'T:**
- Create tasks that are too vague ("Fix bugs", "Improve performance")
- Assign the same domain to independent tasks
- Forget to prioritize tasks
- Create tasks without clear success criteria

### Executing Tasks (Terminal Commands)

You can execute tasks via the API:

```bash
# Execute a task
curl -X POST http://localhost:3000/api/tasks/{issueId}/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "npm test", "llmProvider": "claude"}'

# Check currently running domains (for parallel execution)
curl http://localhost:3000/api/tasks/running

# Check execution status
curl http://localhost:3000/api/tasks/{issueId}/status

# Cancel execution
curl -X POST http://localhost:3000/api/tasks/{issueId}/cancel
```

When executing a task:
1. System checks for domain conflicts - tasks with the same domain can't run simultaneously
2. Status automatically changes to IN_PROGRESS
3. The specified command runs in the background in the terminal
4. stdout/stderr output is logged
5. On success, status changes to DONE; on failure, to PENDING
6. Execution history is saved in the Execution table
7. Domain becomes available for other tasks in the same domain

**Domain conflict handling:**
- If a task's domain is already running, API returns 409 (Conflict)
- Tasks without domain tags never conflict
- Multiple tasks from different domains run in parallel seamlessly

### Creating Releases

You can create releases from the "Release" menu:
- Enter a version number (e.g., v1.0.0)
- Current task state is saved as a snapshot
- Git commit and tag are automatically created

### Checking Out Versions

Select a specific version from the release list to restore task state from that version.

## LLM Configuration

### Auto-generated Rule Files

When you save LLM settings, guideline files (CLAUDE.md, CHATGPT.md, GEMINI.md) are automatically generated in your project root. These files contain:
- Task completion standards
- Testing requirements with edge cases
- Status management guidelines
- Code quality standards
- Security vulnerability checks

The rule files are written in your selected language and help the LLM execute tasks with high quality standards.

## Project Structure

```
llm-jira/
├── src/
│   ├── cli/          # CLI commands
│   ├── server/       # Express server
│   ├── shared/       # Common types and utilities
│   └── index.ts      # Entry point
├── prisma/           # Database schema
├── web/              # React frontend
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run prisma:migrate

# Run in development mode
npm run dev

# Build
npm run build
```

## Requirements

- Node.js 18 or higher
- npm or pnpm

## License

MIT
