# Phase 3: Chat UI

## Objective

Build the chat interface component with message display and input, using placeholder responses (no backend yet).

## Acceptance Criteria

- [ ] Chat component with full-height layout
- [ ] Message list displays messages with:
  - User messages aligned right, styled distinctly
  - Assistant messages aligned left, styled distinctly
  - Timestamps optional but nice
- [ ] Input field at bottom with:
  - Text input (multiline support with Shift+Enter)
  - Send button
  - Enter key sends message
- [ ] Sending a message:
  - Adds user message to list
  - Shows typing indicator briefly
  - Adds placeholder assistant response ("I'm ClaudeOS. I'll be connected soon!")
- [ ] Auto-scroll to bottom when new messages arrive
- [ ] Empty state: "Start a conversation..."
- [ ] Clean, modern styling (dark theme preferred)
- [ ] No TypeScript errors

## Technical Notes

Component structure:
```
src/renderer/components/
├── Chat/
│   ├── index.tsx        # Main chat container
│   ├── MessageList.tsx  # Scrollable message list
│   ├── Message.tsx      # Individual message bubble
│   ├── ChatInput.tsx    # Input field + send button
│   └── Chat.css         # Styles
```

Use React state for messages:
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

## Out of Scope

- Actual Claude integration (Phase 6)
- Streaming text (Phase 6)
- Learning window (Phase 7)
- Tool gallery (Phase 8)

## Files to Create

- src/renderer/components/Chat/index.tsx
- src/renderer/components/Chat/MessageList.tsx
- src/renderer/components/Chat/Message.tsx
- src/renderer/components/Chat/ChatInput.tsx
- src/renderer/components/Chat/Chat.css

## Files to Modify

- src/renderer/App.tsx (import and render Chat)

## Completion

When chat UI is working with placeholder responses and looks good, output:

```
<promise>COMPLETE</promise>
```
