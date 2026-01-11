# Phase 8: Tool Gallery UI

## Objective

Build the tool gallery interface where built tools appear as launchable cards.

## Acceptance Criteria

- [ ] Tool gallery component as a separate view/panel
- [ ] Navigation between Chat and Gallery views
- [ ] Grid layout of tool cards
- [ ] Each card shows:
  - Tool name
  - Description (truncated)
  - Status indicator (running/stopped)
  - Created date
- [ ] Click card → launches tool (placeholder for now)
- [ ] Right-click context menu:
  - Launch
  - Stop (if running)
  - Configure (placeholder)
  - Delete
- [ ] Empty state: "No tools yet. Ask Claude to build something!"
- [ ] Add sample/mock tools for development
- [ ] Styling consistent with rest of app

## Technical Notes

### Component Structure

```
src/renderer/components/ToolGallery/
├── index.tsx         # Main gallery container
├── ToolGrid.tsx      # Grid layout
├── ToolCard.tsx      # Individual tool card
├── ToolContextMenu.tsx
└── ToolGallery.css
```

### Tool Type

```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'background' | 'window' | 'tray' | 'widget';
  status: 'stopped' | 'running' | 'error';
  createdAt: Date;
  icon?: string;  // Optional custom icon
}
```

### Navigation

Add a sidebar or tabs to switch between Chat and Gallery:

```
┌─────────────────────────────────────────────────────┐
│  ClaudeOS                               [_] [□] [X] │
├─────┬───────────────────────────────────────────────┤
│     │                                               │
│ 💬  │   ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│     │   │ File    │  │ Budget  │  │ Weekly  │     │
│ 🧰  │   │ Sorter  │  │ Tracker │  │ Review  │     │
│     │   │ ● Run   │  │ ○ Stop  │  │ ○ Stop  │     │
│     │   └─────────┘  └─────────┘  └─────────┘     │
│     │                                               │
│     │   ┌─────────┐                                │
│     │   │  + New  │                                │
│     │   │  Tool   │                                │
│     │   └─────────┘                                │
└─────┴───────────────────────────────────────────────┘
```

### Mock Data for Development

```typescript
const mockTools: Tool[] = [
  {
    id: '1',
    name: 'File Sorter',
    description: 'Watches Downloads and sorts files by client',
    type: 'background',
    status: 'running',
    createdAt: new Date()
  },
  // ... more mock tools
];
```

## Out of Scope

- Actual tool persistence (Phase 9)
- Tool launching/stopping (Phase 9)
- Tool creation flow

## Files to Create

- src/renderer/components/ToolGallery/index.tsx
- src/renderer/components/ToolGallery/ToolGrid.tsx
- src/renderer/components/ToolGallery/ToolCard.tsx
- src/renderer/components/ToolGallery/ToolContextMenu.tsx
- src/renderer/components/ToolGallery/ToolGallery.css
- src/renderer/components/Navigation/index.tsx (sidebar/tabs)

## Files to Modify

- src/renderer/App.tsx (add navigation and gallery view)

## Completion

When gallery displays tool cards with navigation working, output:

```
<promise>COMPLETE</promise>
```
