# ClaudeOS Build Prompt

You are building ClaudeOS, an Electron desktop application.

## Instructions

1. Read `CLAUDE.md` for project context
2. Read `ROADMAP.md` to find the current phase number
3. Read `prompts/phase-XX.md` for that phase's specific task
4. Complete all acceptance criteria in that phase
5. When done and the app runs without errors, output: `<promise>COMPLETE</promise>`
6. If blocked, create `BLOCKERS.md` with details and output: `<promise>BLOCKED</promise>`

## Key Documents

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project overview, tech stack, patterns |
| `VISION.md` | Product vision (what we're building) |
| `ARCHITECTURE.md` | Technical design (how we're building) |
| `ROADMAP.md` | Build phases and current progress |
| `prompts/phase-XX.md` | Specific task for each phase |

## Working Agreements

- Commit after completing each phase
- Don't modify files outside the phase's scope
- Prefer small, incremental changes
- If tests exist, don't break them
- Add tests for new functionality
- Update `CLAUDE.md` if you make architectural decisions

## Phase Files

```
prompts/
├── phase-01.md  # Scaffold
├── phase-02.md  # Window Shell
├── phase-03.md  # Chat UI
├── phase-04.md  # IPC Infrastructure
├── phase-05.md  # Utility Process
├── phase-06.md  # Agent SDK Integration
├── phase-07.md  # Learning Window
├── phase-08.md  # Tool Gallery UI
├── phase-09.md  # Tool Persistence
├── phase-10.md  # Context Brain
├── phase-11.md  # Inbox Processor
├── phase-12.md  # System Tray
└── phase-13.md  # Polish & Integration
```

## Current Phase

Check `ROADMAP.md` for the current phase number. The line `**PHASE: X**` tells you which phase to work on.

## Completion

When ALL acceptance criteria for the current phase are met:

```
<promise>COMPLETE</promise>
```

After outputting COMPLETE, the human will:
1. Review your changes
2. Commit the code
3. Update ROADMAP.md to the next phase
4. Run another Ralph loop

## If Blocked

If you cannot complete a task:
1. Create `BLOCKERS.md` explaining the issue
2. Output: `<promise>BLOCKED</promise>`
3. The human will review and help resolve
