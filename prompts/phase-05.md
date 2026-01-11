# Phase 5: Utility Process

## Objective

Set up the utility process (agent worker) that will run the Claude Agent SDK, with MessagePort communication.

## Acceptance Criteria

- [ ] UtilityProcess spawns on app startup
- [ ] Worker file at src/worker/agent-worker.ts
- [ ] MessagePort established between main and worker
- [ ] Can send message from renderer → main → worker
- [ ] Can receive message from worker → main → renderer
- [ ] Worker restarts automatically if it crashes
- [ ] Clean shutdown when app closes
- [ ] Console logs show communication working
- [ ] No TypeScript errors

## Technical Notes

### Main Process Setup

```typescript
// src/main/services/agent-process.ts
import { utilityProcess, MessageChannelMain } from 'electron';
import path from 'path';

export class AgentProcessManager {
  private process: Electron.UtilityProcess | null = null;
  private port: Electron.MessagePortMain | null = null;

  async start() {
    this.process = utilityProcess.fork(
      path.join(__dirname, '../../worker/agent-worker.js'),
      [],
      { serviceName: 'claude-agent' }
    );

    const { port1, port2 } = new MessageChannelMain();
    this.port = port1;

    this.process.postMessage({ type: 'init' }, [port2]);

    this.process.on('exit', (code) => {
      console.log(`Agent process exited with code ${code}`);
      if (code !== 0) {
        this.restart();
      }
    });

    this.port.on('message', (event) => {
      // Forward to renderer
    });

    this.port.start();
  }

  send(message: any) {
    this.port?.postMessage(message);
  }

  async stop() {
    this.process?.kill();
    this.process = null;
  }

  private async restart() {
    await this.stop();
    setTimeout(() => this.start(), 1000);
  }
}
```

### Worker Process

```typescript
// src/worker/agent-worker.ts
let messagePort: MessagePort | null = null;

process.parentPort.on('message', (event) => {
  if (event.data.type === 'init' && event.ports[0]) {
    messagePort = event.ports[0];
    messagePort.on('message', handleMessage);
    messagePort.start();
    console.log('Agent worker initialized');
  }
});

function handleMessage(event: MessageEvent) {
  const { type, payload } = event.data;

  if (type === 'chat') {
    // Placeholder - will use Agent SDK in Phase 6
    messagePort?.postMessage({
      type: 'response',
      payload: {
        content: `Worker received: ${payload.message}`
      }
    });
  }
}
```

### Wire It Up

1. Start AgentProcessManager in main process
2. Route chat:send IPC to worker via MessagePort
3. Route worker responses back to renderer

## Out of Scope

- Actual Claude Agent SDK integration (Phase 6)
- Real chat functionality

## Files to Create

- src/main/services/agent-process.ts
- src/worker/agent-worker.ts

## Files to Modify

- src/main/index.ts (start agent process)
- src/main/ipc/chat.ts (route to worker)

## Completion

When messages flow renderer → main → worker → main → renderer, output:

```
<promise>COMPLETE</promise>
```
