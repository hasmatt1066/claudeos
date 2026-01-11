# Phase 7: Learning Window

## Objective

Build the learning window—a collapsible panel that shows what Claude is doing (file operations, commands, tool use) in real-time.

## Acceptance Criteria

- [ ] Learning window component as collapsible panel
- [ ] Shows on the right side of chat (or bottom, depending on layout)
- [ ] Toggle button to show/hide
- [ ] Displays tool operations in real-time:
  - File reads: "Reading src/main/index.ts"
  - File writes: "Creating src/components/Button.tsx"
  - File edits: "Editing src/App.tsx (line 15)"
  - Bash commands: "Running: npm install axios"
  - Search: "Searching for 'handleClick'"
- [ ] Each operation shows:
  - Icon for operation type
  - Plain language description
  - Timestamp
  - Expandable details (optional)
- [ ] Operations clear when new conversation starts
- [ ] Auto-scroll to newest operation
- [ ] Styling consistent with chat

## Technical Notes

### Component Structure

```
src/renderer/components/LearningWindow/
├── index.tsx           # Main container with toggle
├── OperationList.tsx   # Scrollable list
├── Operation.tsx       # Single operation display
└── LearningWindow.css
```

### Operation Type

```typescript
interface Operation {
  id: string;
  type: 'read' | 'write' | 'edit' | 'bash' | 'search' | 'tool';
  description: string;
  details?: string;
  timestamp: Date;
  status: 'pending' | 'complete' | 'error';
}
```

### Wiring to Agent

The 'tool' messages from worker already contain tool name and input. Transform these into Operation objects:

```typescript
// Map tool_use to friendly description
function describeOperation(tool: string, input: any): string {
  switch (tool) {
    case 'Read':
      return `Reading ${input.file_path}`;
    case 'Write':
      return `Creating ${input.file_path}`;
    case 'Edit':
      return `Editing ${input.file_path}`;
    case 'Bash':
      return `Running: ${input.command.slice(0, 50)}...`;
    case 'Glob':
      return `Finding files: ${input.pattern}`;
    case 'Grep':
      return `Searching: ${input.pattern}`;
    default:
      return `Using ${tool}`;
  }
}
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ClaudeOS                               [_] [□] [X] │
├──────────────────────────────┬──────────────────────┤
│                              │  Learning Window  [v]│
│     Chat Messages            │  ──────────────────  │
│                              │  📖 Reading App.tsx  │
│                              │  ✏️ Editing index.ts │
│                              │  ⚡ Running: npm...  │
│                              │                      │
├──────────────────────────────┤                      │
│  [Type a message...]  [Send] │                      │
└──────────────────────────────┴──────────────────────┘
```

## Out of Scope

- File content preview
- Diff view
- Undo operations

## Files to Create

- src/renderer/components/LearningWindow/index.tsx
- src/renderer/components/LearningWindow/OperationList.tsx
- src/renderer/components/LearningWindow/Operation.tsx
- src/renderer/components/LearningWindow/LearningWindow.css

## Files to Modify

- src/renderer/App.tsx (add LearningWindow)
- src/preload/index.ts (expose tool events)

## Completion

When the learning window shows tool operations in real-time during chat, output:

```
<promise>COMPLETE</promise>
```
