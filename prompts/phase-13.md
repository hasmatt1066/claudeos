# Phase 13: Polish & Integration

## Objective

Final integration pass—tie everything together, add polish, handle edge cases.

## Acceptance Criteria

- [ ] All components work together seamlessly
- [ ] Error handling throughout:
  - Agent errors show in chat
  - Tool errors show in gallery
  - Inbox errors logged
- [ ] Loading states:
  - Chat shows typing indicator
  - Tool launch shows spinner
  - Startup shows loading screen
- [ ] Empty states:
  - Empty chat: "Start a conversation with Claude"
  - Empty gallery: "No tools yet. Ask Claude to build something!"
  - Empty learning window: "Claude's actions will appear here"
- [ ] Settings panel with:
  - ClaudeOS home path (read-only display)
  - Theme toggle (light/dark) - optional
  - About section
- [ ] Keyboard shortcuts:
  - Cmd/Ctrl+N: New conversation
  - Cmd/Ctrl+,: Settings
  - Escape: Close panels
- [ ] Window state persistence (size, position)
- [ ] Graceful shutdown (stop tools, close connections)
- [ ] No console errors in production build
- [ ] Production build works: `npm run build && npm run preview`

## Technical Notes

### Error Boundaries

```typescript
// src/renderer/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Loading Screen

```typescript
// src/renderer/components/LoadingScreen.tsx
export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="logo">ClaudeOS</div>
      <div className="spinner" />
      <div className="status">Initializing...</div>
    </div>
  );
}
```

### Settings Panel

```typescript
// src/renderer/components/Settings/index.tsx
interface Settings {
  homePath: string;
  theme: 'light' | 'dark' | 'system';
}

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings);
  }, []);

  return (
    <div className="settings">
      <h2>Settings</h2>

      <section>
        <h3>ClaudeOS Home</h3>
        <code>{settings?.homePath}</code>
      </section>

      <section>
        <h3>About</h3>
        <p>ClaudeOS v{settings?.version}</p>
        <p>Claude as your operating system layer.</p>
      </section>
    </div>
  );
}
```

### Window State Persistence

```typescript
// src/main/services/window-state.ts
import Store from 'electron-store';

const store = new Store();

export function saveWindowState(win: BrowserWindow) {
  const bounds = win.getBounds();
  store.set('windowBounds', bounds);
}

export function loadWindowState() {
  return store.get('windowBounds', {
    width: 1200,
    height: 800
  });
}
```

### Keyboard Shortcuts

```typescript
// src/main/index.ts
import { globalShortcut } from 'electron';

app.on('ready', () => {
  // Register shortcuts
  globalShortcut.register('CommandOrControl+N', () => {
    mainWindow?.webContents.send('app:newConversation');
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

### Graceful Shutdown

```typescript
app.on('before-quit', async () => {
  console.log('Shutting down...');

  // Stop all tools
  await toolManager.stopAll();

  // Stop inbox processor
  await inboxProcessor.stop();

  // Stop agent worker
  await agentProcess.stop();

  console.log('Shutdown complete');
});
```

## Files to Create

- src/renderer/components/ErrorBoundary.tsx
- src/renderer/components/LoadingScreen.tsx
- src/renderer/components/Settings/index.tsx
- src/main/services/window-state.ts

## Files to Modify

- src/main/index.ts (shortcuts, shutdown)
- src/renderer/App.tsx (error boundary, loading, settings)
- Various CSS files for polish

## Testing Checklist

- [ ] Fresh install works (no existing data)
- [ ] Chat with Claude works end-to-end
- [ ] Build a tool via chat, see it in gallery
- [ ] Launch and stop tool
- [ ] Drop file in inbox, see it indexed
- [ ] Search context brain
- [ ] Close to tray, reopen
- [ ] Quit and restart
- [ ] Production build runs

## Completion

When everything works together smoothly and production build runs, output:

```
<promise>COMPLETE</promise>
```

---

## Congratulations!

If you've reached this point, ClaudeOS v0.1 is complete. The blank canvas is ready—now users can start asking Claude to build whatever they need.
