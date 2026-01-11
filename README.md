# ClaudeOS

A local-first personal operating environment powered by Claude.

Talk to your computer. It builds what you need.

## What is this?

ClaudeOS is an exploration of what computing looks like when an AI agent becomes your primary interface. Instead of switching between apps, learning new tools, and manually organizing your digital life—you just describe what you need and it happens.

This isn't a no-code tool. It's not an app builder. It's closer to: **what if Claude Code had a face, lived on your machine, and actually understood your whole context?**

## Core ideas

- **Chat is the interface.** You talk, things happen. No terminal, no IDE, no config files.
- **Local-first.** Your data stays on your machine. Cloud services are endpoints you push to and pull from, not places you live.
- **Bidirectional collaboration.** Claude prompts you as much as you prompt Claude. It surfaces things, asks questions, proposes next steps.
- **Dynamic UI generation.** Claude doesn't just answer—it builds the interface for the current moment.
- **Learning by exposure.** A window into what's actually happening (files, folders, logic) so users discover that "coding" is just making files with text in them.

## Status

**Phase 13 of 13.** System tray complete. Final polish and integration.

- Phase 1: Scaffold electron-vite project
- Phase 2: Basic Electron window
- Phase 3: Chat UI
- Phase 4: IPC Infrastructure
- Phase 5: Utility Process
- Phase 6: Agent SDK Integration
- Phase 7: Learning Window
- Phase 8: Tool Gallery UI
- Phase 9: Tool Persistence
- Phase 10: Context Brain
- Phase 11: Inbox Processor
- Phase 12: System Tray (current)
- Phase 13: See [ROADMAP.md](./ROADMAP.md)

## Building ClaudeOS

This project is designed to be built using [Ralph Wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) autonomous development loops.

### Prerequisites

- Node.js 20+
- Claude Code CLI (authenticated)
- Ralph Wiggum plugin: `/plugin install ralph-wiggum@claude-plugins-official`

### How to Build

1. **Check current phase:**
   ```bash
   cat ROADMAP.md | grep "PHASE:"
   ```

2. **Run Ralph loop:**
   ```bash
   /ralph-loop "Read PROMPT.md and complete the current phase. When all acceptance criteria are met and the app runs without errors, output <promise>COMPLETE</promise>. If blocked, create BLOCKERS.md and output <promise>BLOCKED</promise>." --completion-promise "COMPLETE" --max-iterations 25
   ```

3. **After completion:**
   - Review changes
   - Commit: `git add -A && git commit -m "Complete phase X"`
   - Update phase in ROADMAP.md
   - Run next loop

### Build Phases

| Phase | Description |
|-------|-------------|
| 1 | Scaffold electron-vite project |
| 2 | Basic Electron window |
| 3 | Chat UI component |
| 4 | IPC infrastructure |
| 5 | Utility process (agent worker) |
| 6 | Claude Agent SDK integration |
| 7 | Learning window |
| 8 | Tool gallery UI |
| 9 | Tool persistence |
| 10 | Context brain (LanceDB) |
| 11 | Inbox processor |
| 12 | System tray |
| 13 | Polish & integration |

## Documentation

| Document | Description |
|----------|-------------|
| [VISION.md](./VISION.md) | Product vision, user stories, personas |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Developer guide |
| [ROADMAP.md](./ROADMAP.md) | Build phases and progress |
| [CLAUDE.md](./CLAUDE.md) | Project context for Claude Code |

## License

TBD
