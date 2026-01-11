# ClaudeOS Build Roadmap

This file tracks the phased build of ClaudeOS. Each phase is a discrete Ralph loop.

---

## Current Phase

**PHASE: 1**

Update this number after completing each phase.

---

## Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Scaffold | pending | Initialize electron-vite project |
| 2 | Window Shell | pending | Basic Electron window with React |
| 3 | Chat UI | pending | Chat interface component |
| 4 | IPC Infrastructure | pending | Main↔Renderer communication |
| 5 | Utility Process | pending | Agent worker process setup |
| 6 | Agent SDK Integration | pending | Connect chat to Claude |
| 7 | Learning Window | pending | File operations display |
| 8 | Tool Gallery UI | pending | Tool cards and management |
| 9 | Tool Persistence | pending | Save/load/launch tools |
| 10 | Context Brain | pending | LanceDB + embeddings |
| 11 | Inbox Processor | pending | File watching + auto-organize |
| 12 | System Tray | pending | Background operation |
| 13 | Polish & Integration | pending | Final integration pass |

---

## Phase Details

### Phase 1: Scaffold
- Initialize electron-vite with TypeScript
- Create directory structure per ARCHITECTURE.md
- Configure tsconfig, eslint, prettier
- Verify `npm run dev` works (even if window is empty)

### Phase 2: Window Shell
- BrowserWindow with correct security settings
- Preload script with contextBridge
- Basic React app renders in window
- Window controls work (minimize, close)

### Phase 3: Chat UI
- Message list component
- User/assistant message styling
- Input field with send button
- Auto-scroll on new messages
- Placeholder responses (no backend yet)

### Phase 4: IPC Infrastructure
- IPC handlers in main process
- Typed API exposed via preload
- Request/response pattern working
- MessagePort setup for streaming

### Phase 5: Utility Process
- UtilityProcess spawns correctly
- MessagePort communication with main
- Basic message passing works
- Error handling and restart logic

### Phase 6: Agent SDK Integration
- Claude Agent SDK in utility process
- Streaming responses to renderer
- Tool use visible in console
- Session capture and storage
- Permission callbacks (auto-approve for now)

### Phase 7: Learning Window
- Collapsible panel component
- Shows file operations from agent
- Plain language descriptions
- Updates in real-time during agent work

### Phase 8: Tool Gallery UI
- Grid of tool cards
- Tool metadata display
- Launch button (placeholder action)
- Right-click context menu

### Phase 9: Tool Persistence
- Tool manifest format
- Save tools to ~/ClaudeOS/tools/
- Load tools on startup
- Launch tools as child processes
- Stop/restart tools

### Phase 10: Context Brain
- LanceDB initialization
- Embedding generation (Transformers.js)
- Document storage and retrieval
- Hybrid search implementation
- Integration with agent (context retrieval)

### Phase 11: Inbox Processor
- Chokidar file watcher
- File type detection
- Auto-organization logic
- Index new files in context brain
- Startup reconciliation

### Phase 12: System Tray
- Tray icon and menu
- Hide to tray on close
- Show window from tray
- Background tool indicators

### Phase 13: Polish & Integration
- Error handling throughout
- Loading states
- Empty states
- Settings panel
- Final integration testing

---

## How to Use

1. Check current phase above
2. Run: `npm run ralph` (or use the command below)
3. Wait for completion
4. Review changes, commit
5. Update "Current Phase" to next number
6. Repeat

### Manual Ralph Command

```bash
/ralph-loop "Read CLAUDE.md for project context. Read ROADMAP.md to find the current phase. Read prompts/phase-XX.md for that phase's task. Complete all acceptance criteria. When done and the app runs without errors, output <promise>COMPLETE</promise>. If blocked, create BLOCKERS.md and output <promise>BLOCKED</promise>." --max-iterations 25 --completion-promise "COMPLETE"
```

---

## Notes

<!-- Add notes as you progress through phases -->

