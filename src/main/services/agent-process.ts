import { utilityProcess, MessageChannelMain, BrowserWindow } from 'electron';
import path from 'path';
import { handleWorkerResponse } from '../ipc/chat';

export interface WorkerMessage {
  type: string;
  payload?: unknown;
}

export class AgentProcessManager {
  private process: Electron.UtilityProcess | null = null;
  private port: Electron.MessagePortMain | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isShuttingDown = false;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async start(): Promise<void> {
    if (this.process) {
      console.log('Agent process already running');
      return;
    }

    console.log('Starting agent process...');

    this.process = utilityProcess.fork(
      path.join(__dirname, './worker/agent-worker.js'),
      [],
      { serviceName: 'claude-agent' }
    );

    const { port1, port2 } = new MessageChannelMain();
    this.port = port1;

    // Send init message with MessagePort to worker
    this.process.postMessage({ type: 'init' }, [port2]);

    // Handle worker exit
    this.process.on('exit', (code) => {
      console.log(`Agent process exited with code ${code}`);
      this.process = null;
      this.port = null;

      // Auto-restart if not shutting down and exit was abnormal
      if (!this.isShuttingDown && code !== 0) {
        console.log('Agent process crashed, restarting in 1 second...');
        setTimeout(() => this.start(), 1000);
      }
    });

    // Handle messages from worker
    this.port.on('message', (event) => {
      const message = event.data as WorkerMessage;
      console.log('Received from worker:', message.type);

      // Route chat responses to the IPC handler
      if (message.type === 'chat:response') {
        handleWorkerResponse(message as Parameters<typeof handleWorkerResponse>[0]);
      }

      // Forward to renderer if we have a window
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('agent:message', message);
      }
    });

    this.port.start();
    console.log('Agent process started');
  }

  send(message: WorkerMessage): void {
    if (!this.port) {
      console.error('Cannot send message: agent process not running');
      return;
    }
    console.log('Sending to worker:', message.type);
    this.port.postMessage(message);
  }

  async stop(): Promise<void> {
    this.isShuttingDown = true;

    if (this.port) {
      this.port.close();
      this.port = null;
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    console.log('Agent process stopped');
  }

  isRunning(): boolean {
    return this.process !== null;
  }
}

// Singleton instance
export const agentProcess = new AgentProcessManager();
