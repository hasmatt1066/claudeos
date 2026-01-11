# CLAUDE.md - ClaudeOS Project Context

This file provides context for Claude Code when working on this project. It's automatically read by Claude Code to understand the codebase.

---

## Project Overview

**ClaudeOS** is an Electron desktop application that provides a conversational interface to Claude. It's a "blank canvas" tool where Claude builds functionality on demand—the user describes what they need, Claude creates it.

### Core Concept

We build the substrate (shell, engine, context brain). Claude builds everything else (dashboards, automations, integrations) in response to user requests.

### Key Documents

| Document | Purpose |
|----------|---------|
| `VISION.md` | Product vision, user stories, personas |
| `ARCHITECTURE.md` | Technical architecture, component design |
| `CLAUDE.md` | This file—project context for Claude Code |
| `PROMPT.md` | Ralph Wiggum loop prompts (when active) |

---

## Architecture Summary

### Process Model

```
┌─────────────────────────────────────────────────────────┐
│                    ClaudeOS Desktop                      │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ Main Process   │  │ Renderer       │  │ Utility    │ │
│  │                │  │ (React UI)     │  │ Process    │ │
│  │ • Window mgmt  │  │                │  │            │ │
│  │ • System tray  │  │ • Chat         │  │ • Agent SDK│ │
│  │ • IPC routing  │  │ • Learning win │  │ • Context  │ │
│  │                │  │ • Tool gallery │  │   brain    │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Electron 34+ |
| UI | React 19 + TypeScript |
| State | Zustand |
| Agent Engine | Claude Agent SDK |
| Vector DB | LanceDB |
| Embeddings | Transformers.js (local) |
| File Watching | Chokidar |
| Build | Vite + electron-vite |

### Key Directories

```
src/
├── main/           # Electron main process
├── renderer/       # React application
├── worker/         # Utility process (agent)
├── preload/        # Secure IPC bridge
└── shared/         # Shared types
```

---

## Development Guidelines

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Prefer composition over inheritance
- Keep main process lightweight—delegate to utility process
- All file operations through validated IPC handlers

### Security Requirements

- Renderer must have `contextIsolation: true` and `sandbox: true`
- Never enable `nodeIntegration` in renderer
- Validate all file paths against allowed directories
- Use `safeStorage` for credentials

### Testing Expectations

- Unit tests for business logic
- Integration tests for IPC handlers
- E2E tests for critical user flows
- Test tool lifecycle (create, launch, stop)

---

## Current State

**Phase:** 5 (Utility Process)

Phases 1-4 complete: electron-vite scaffold, secure window shell, chat UI, IPC infrastructure with typed API.

**Next Steps:**
1. Set up utility process for agent worker
2. MessagePort communication with main
3. Integrate Claude Agent SDK in utility process
4. Build first proof of concept: chat → tool → gallery

---

## Ralph Wiggum Development

This project is designed for Ralph Wiggum loop development. When using Ralph:

### Prompt Structure

Prompts should reference:
1. This file (`CLAUDE.md`) for project context
2. `VISION.md` for product requirements
3. `ARCHITECTURE.md` for technical decisions
4. Specific task with clear completion criteria

### Completion Promises

Use explicit completion markers:
```
<promise>COMPLETE</promise>
```

### Recommended Loop Settings

```bash
/ralph-loop "..." --max-iterations 20 --completion-promise "COMPLETE"
```

### Safety Notes

- Always set `--max-iterations`
- Use sandboxed environment for overnight loops
- Monitor token usage
- Commit frequently (Ralph makes many changes)

---

## Common Tasks

### Adding a New Feature

1. Update `VISION.md` if it affects product vision
2. Update `ARCHITECTURE.md` if it affects technical design
3. Implement in appropriate process (main/renderer/worker)
4. Add tests
5. Update this file if needed

### Running the App

```bash
npm run dev        # Development mode
npm run build      # Production build
npm run test       # Run tests
```

### Debugging

- Main process: Chrome DevTools via `--inspect`
- Renderer: Built-in Chromium DevTools
- Utility process: Node.js debugger

---

## Important Patterns

### IPC Communication

```typescript
// Main process
ipcMain.handle('channel-name', async (event, ...args) => {
  // Handle request
  return result;
});

// Preload (expose to renderer)
contextBridge.exposeInMainWorld('api', {
  channelName: (...args) => ipcRenderer.invoke('channel-name', ...args)
});

// Renderer
const result = await window.api.channelName(...args);
```

### Agent SDK Integration

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const response = query({
  prompt: userMessage,
  options: {
    model: 'claude-opus-4-5',
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    permissionMode: 'acceptEdits'
  }
});

for await (const message of response) {
  // Stream to renderer
}
```

### Context Brain Queries

```typescript
const results = await table
  .query()
  .fullTextSearch(query)
  .nearestTo(queryVector)
  .rerank(lancedb.RRFReranker())
  .limit(10)
  .toArray();
```

---

## Constraints

- Must work offline (except for Claude API calls)
- Must run on Windows and Mac
- User data stays local—no cloud storage of user content
- Bundle size should be reasonable (~100-150MB)
- Startup time under 3 seconds

---

*This file should be updated as the project evolves.*
