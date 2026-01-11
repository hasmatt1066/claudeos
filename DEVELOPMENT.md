# ClaudeOS Development Guide

This guide covers how to develop ClaudeOS, including setup, workflows, and Ralph Wiggum autonomous development.

---

## Prerequisites

- **Node.js 20+** (required for Chokidar v5, Electron 34+)
- **Git**
- **Claude Code CLI** (v2.0.76 or later)
- **jq** (for Ralph Wiggum plugin)

### Installing Prerequisites

```bash
# macOS
brew install node jq

# Windows (use WSL for Ralph Wiggum)
# Install Node.js from nodejs.org
# In WSL: sudo apt install jq

# Claude Code
npm install -g @anthropic-ai/claude-code
claude auth login
```

---

## Getting Started

### Clone and Setup

```bash
git clone https://github.com/hasmatt1066/claudeos.git
cd claudeos

# Once project is scaffolded:
npm install
npm run dev
```

### Project Structure (Target)

```
claudeos/
├── CLAUDE.md           # Project context for Claude Code
├── VISION.md           # Product vision
├── ARCHITECTURE.md     # Technical architecture
├── PROMPT.md           # Ralph Wiggum prompt template
├── DEVELOPMENT.md      # This file
├── README.md           # User-facing readme
│
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React UI
│   ├── worker/         # Utility process (agent)
│   ├── preload/        # Secure IPC bridge
│   └── shared/         # Shared types
│
├── resources/          # Icons, assets
├── scripts/            # Build/dev scripts
└── tests/              # Test files
```

---

## Development Workflows

### Standard Development

```bash
# Start dev server with hot reload
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Package for distribution
npm run package
```

### Manual Claude Code Development

For interactive development with Claude Code:

```bash
cd claudeos
claude

# In Claude Code:
> Read CLAUDE.md to understand this project
> Help me implement [feature]
```

---

## Ralph Wiggum Development

Ralph Wiggum enables autonomous development loops where Claude iterates until a task is complete.

### Installing Ralph Wiggum

```bash
# In Claude Code
/plugin install ralph-wiggum@claude-plugins-official
```

### Basic Usage

1. **Update PROMPT.md** with your task:

```markdown
**Objective:** Build the chat component

**Acceptance Criteria:**
- [ ] Message list displays correctly
- [ ] Input field works
- [ ] Streaming text support
```

2. **Start the loop:**

```bash
/ralph-loop "Read PROMPT.md and complete the task described. When all acceptance criteria are met and tests pass, output <promise>COMPLETE</promise>" --max-iterations 20 --completion-promise "COMPLETE"
```

3. **Monitor progress** (in another terminal):

```bash
ralph-monitor  # If using frankbria implementation
# Or just watch the Claude Code output
```

4. **Cancel if needed:**

```bash
/cancel-ralph
```

### Best Practices

#### Do:
- Set reasonable `--max-iterations` (start with 10-20)
- Define clear, testable acceptance criteria
- Commit before starting a loop (easy rollback)
- Use for well-defined, automatable tasks
- Include escape hatches for blockers

#### Don't:
- Run overnight without sandboxing
- Use for tasks requiring design decisions
- Forget to set iteration limits
- Ignore token costs (monitor usage)

### Recommended Tasks for Ralph

| Good for Ralph | Not Good for Ralph |
|----------------|-------------------|
| Implementing a defined component | Architectural decisions |
| Getting tests to pass | UI/UX design choices |
| Refactoring with clear spec | Production debugging |
| Adding CRUD operations | Tasks with unclear scope |
| Migration tasks (Jest→Vitest) | Creative feature design |

### Safety Considerations

Ralph requires `--dangerously-skip-permissions` for autonomous operation. Mitigate risks:

1. **Use sandboxing for AFK sessions:**
   ```bash
   # Run in Docker/VM where only project dir is mounted
   ```

2. **Set hard limits:**
   ```bash
   --max-iterations 50  # Never unlimited
   ```

3. **Use disposable environments** for long loops

4. **Commit frequently** (Ralph can be rolled back)

---

## Debugging

### Main Process

```bash
# Start with inspector
npm run dev -- --inspect

# Attach Chrome DevTools to chrome://inspect
```

### Renderer Process

- Open DevTools with `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (Mac)
- Or: Menu → View → Toggle Developer Tools

### Utility Process (Agent Worker)

```javascript
// In worker code
process.parentPort.on('message', (e) => {
  console.log('Worker received:', e.data);
});
```

Check main process console for worker logs.

---

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

---

## Building & Packaging

### Development Build

```bash
npm run build:dev
```

### Production Build

```bash
npm run build
```

### Create Installers

```bash
# All platforms
npm run package

# Specific platform
npm run package:win
npm run package:mac
```

Outputs go to `dist/` directory.

---

## Contributing

### Commit Messages

Follow conventional commits:

```
feat: add chat streaming support
fix: resolve IPC timeout issue
docs: update ARCHITECTURE.md
refactor: extract message parser
test: add agent worker tests
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with tests
3. Update documentation if needed
4. Create PR with description
5. Ensure CI passes

### Code Review Checklist

- [ ] Types are correct (no `any`)
- [ ] Security considerations addressed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log in production code

---

## Troubleshooting

### Ralph Wiggum Issues

**"jq not found"**
```bash
# macOS
brew install jq

# Linux
sudo apt install jq

# Windows: Use WSL
```

**"Permission denied"**
Add to `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": ["Bash(**/ralph-wiggum/**)"]
  }
}
```

**Loop won't stop**
```bash
/cancel-ralph
# Or Ctrl+C multiple times
```

### Electron Issues

**Window won't open**
- Check main process console for errors
- Verify preload script path is correct

**IPC not working**
- Ensure contextIsolation is true
- Check preload script exposes the API correctly

**Agent SDK errors**
- Verify Claude Code is authenticated: `claude auth status`
- Check utility process is spawning correctly

---

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk)
- [Ralph Wiggum Plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum)
- [LanceDB Documentation](https://lancedb.com/docs)
- [electron-vite](https://electron-vite.org/)

---

*Last updated: January 2026*
