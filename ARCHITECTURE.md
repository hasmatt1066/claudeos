# ClaudeOS Architecture

This document describes the technical architecture of ClaudeOS—an Electron desktop application that provides a conversational interface to Claude, with persistent tool building, context management, and local-first data storage.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ClaudeOS Desktop                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        RENDERER PROCESS                              │    │
│  │                        (React + TypeScript)                          │    │
│  │                                                                      │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │    │
│  │   │ Chat Panel   │  │ Learning     │  │ Tool Gallery             │  │    │
│  │   │              │  │ Window       │  │                          │  │    │
│  │   │ • Streaming  │  │              │  │ • Built tools            │  │    │
│  │   │   messages   │  │ • File ops   │  │ • Launch/configure       │  │    │
│  │   │ • User input │  │ • Narrated   │  │ • Background status      │  │    │
│  │   │ • Dynamic UI │  │   actions    │  │                          │  │    │
│  │   └──────────────┘  └──────────────┘  └──────────────────────────┘  │    │
│  │                              │                                       │    │
│  └──────────────────────────────┼───────────────────────────────────────┘    │
│                                 │ IPC / MessagePort                          │
│  ┌──────────────────────────────┼───────────────────────────────────────┐    │
│  │                        MAIN PROCESS                                   │    │
│  │                                                                       │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │   │ Window       │  │ System Tray  │  │ IPC Handlers             │   │    │
│  │   │ Manager      │  │              │  │                          │   │    │
│  │   └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  │          │                                        │                   │    │
│  │          │         ┌──────────────────────────────┘                   │    │
│  │          │         │                                                  │    │
│  │   ┌──────┴─────────┴──────────────────────────────────────────────┐  │    │
│  │   │                    UTILITY PROCESS                             │  │    │
│  │   │                    (Claude Agent Worker)                       │  │    │
│  │   │                                                                │  │    │
│  │   │   ┌──────────────────────────────────────────────────────┐    │  │    │
│  │   │   │              Claude Agent SDK                         │    │  │    │
│  │   │   │                                                       │    │  │    │
│  │   │   │  • Streaming messages                                 │    │  │    │
│  │   │   │  • Tool execution (Read, Edit, Bash, etc.)           │    │  │    │
│  │   │   │  • Permission callbacks                               │    │  │    │
│  │   │   │  • Session persistence                                │    │  │    │
│  │   │   └──────────────────────────────────────────────────────┘    │  │    │
│  │   │                           │                                    │  │    │
│  │   └───────────────────────────┼────────────────────────────────────┘  │    │
│  │                               │                                       │    │
│  │   ┌───────────────────────────┴────────────────────────────────────┐  │    │
│  │   │                    LOCAL SERVICES                               │  │    │
│  │   │                                                                 │  │    │
│  │   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │    │
│  │   │   │ Inbox        │  │ Context      │  │ Tool                 │ │  │    │
│  │   │   │ Processor    │  │ Brain        │  │ Manager              │ │  │    │
│  │   │   │              │  │              │  │                      │ │  │    │
│  │   │   │ • Chokidar   │  │ • LanceDB    │  │ • Tool registry      │ │  │    │
│  │   │   │ • file-type  │  │ • Embeddings │  │ • Child processes    │ │  │    │
│  │   │   │ • Auto-sort  │  │ • Hybrid     │  │ • Lifecycle mgmt     │ │  │    │
│  │   │   │              │  │   search     │  │                      │ │  │    │
│  │   │   └──────────────┘  └──────────────┘  └──────────────────────┘ │  │    │
│  │   │                                                                 │  │    │
│  │   └─────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                        │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │   Local Filesystem  │
                              │                     │
                              │   ~/ClaudeOS/       │
                              │   ├── inbox/        │
                              │   ├── context/      │
                              │   ├── tools/        │
                              │   └── .claudeos/    │
                              └─────────────────────┘
```

---

## Process Model

ClaudeOS uses Electron's multi-process architecture for security, stability, and performance.

### Main Process

The main process is the application coordinator. It should remain lightweight—never run CPU-intensive operations here.

**Responsibilities:**
- Application lifecycle (startup, shutdown, updates)
- Window management (BrowserWindow creation/destruction)
- System tray integration
- IPC routing between renderer and utility processes
- Native OS dialogs (file pickers, notifications)

**Key Pattern:** Delegate heavy work to the utility process.

### Renderer Process

A sandboxed Chromium process running the React UI.

**Responsibilities:**
- Chat interface with streaming text display
- Learning window (file operations, narrated actions)
- Tool gallery (list, launch, configure tools)
- Dynamic UI rendering (Claude-generated interfaces)

**Security:**
```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // Required
    sandbox: true,            // Chromium sandbox
    nodeIntegration: false,   // Never enable
    preload: 'preload.js'     // Typed API bridge
  }
});
```

### Utility Process (Claude Agent Worker)

A separate Node.js process running the Claude Agent SDK. This isolates the agent from the main process, preventing UI freezes and enabling clean error recovery.

**Why UtilityProcess over child_process.fork:**
- Direct MessagePort communication with renderer
- Proper integration with Chromium's process model
- Automatic cleanup on app exit
- Can be killed and restarted independently

```typescript
import { utilityProcess } from 'electron';

const agentProcess = utilityProcess.fork(
  path.join(__dirname, 'agent-worker.js'),
  [],
  { serviceName: 'claude-agent' }
);
```

---

## Claude Agent SDK Integration

The Agent SDK runs in the utility process and provides the core agentic capabilities.

### Initialization

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const response = query({
  prompt: userMessage,
  options: {
    model: 'claude-opus-4-5',
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    permissionMode: 'acceptEdits',
    cwd: claudeOSHomePath,
    canUseTool: handleToolPermission
  }
});

for await (const message of response) {
  // Stream messages to renderer via MessagePort
  messagePort.postMessage(message);
}
```

### Message Types

| Type | Description |
|------|-------------|
| `system` | Session init, metadata, tools available |
| `assistant` | Claude's response (text, tool calls) |
| `result` | Final result with cost, tokens, duration |
| `stream_event` | Live token streaming (when enabled) |

### Permission Handling

Tool permissions flow through IPC for user approval:

```typescript
async function handleToolPermission(toolName, input, options) {
  // Auto-approve safe reads
  if (['Read', 'Glob', 'Grep'].includes(toolName)) {
    return { behavior: 'allow', updatedInput: input };
  }

  // Ask user via renderer
  return new Promise((resolve) => {
    mainWindow.webContents.send('permission-request', { toolName, input });

    ipcMain.once('permission-response', (event, approved) => {
      resolve(approved
        ? { behavior: 'allow', updatedInput: input }
        : { behavior: 'deny', message: 'User rejected' }
      );
    });
  });
}
```

### Session Persistence

Sessions are captured on init and stored for resumption:

```typescript
interface SessionState {
  id: string;
  title: string;
  createdAt: number;
  lastUsed: number;
}

// Capture session ID
if (message.type === 'system' && message.subtype === 'init') {
  saveSession(message.session_id, conversationTitle);
}

// Resume later
const resumed = query({
  prompt: 'Continue where we left off',
  options: { resume: savedSessionId }
});
```

---

## IPC Architecture

### Streaming Pattern: MessagePort

For high-frequency streaming data (tokens, progress), use MessagePort for direct renderer↔worker communication:

```typescript
// Main process: Create channel
const { port1, port2 } = new MessageChannelMain();
mainWindow.webContents.postMessage('stream-port', null, [port1]);
agentProcess.postMessage({ type: 'stream-port' }, [port2]);

// Worker: Send chunks
messagePort.postMessage({ type: 'token', content: chunk });

// Renderer: Receive
streamPort.onmessage = (e) => appendToken(e.data.content);
```

### Request/Response Pattern: invoke/handle

For discrete operations, use Electron's invoke pattern:

```typescript
// Main
ipcMain.handle('load-conversation', async (event, id) => {
  return await db.getConversation(id);
});

// Renderer (via preload)
const conversation = await window.electronAPI.loadConversation(id);
```

### Preload API

Never expose raw IPC. Define a typed API:

```typescript
// preload.ts
interface ElectronAPI {
  // Chat
  sendMessage: (content: string) => void;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;

  // Files
  selectDirectory: () => Promise<string | null>;

  // Tools
  launchTool: (toolId: string) => Promise<void>;
  getToolStatus: (toolId: string) => Promise<ToolStatus>;
}

contextBridge.exposeInMainWorld('electronAPI', api);
```

---

## Context Brain

The context brain provides semantic storage and retrieval for the user's documents, notes, and data.

### Storage Layer: LanceDB

LanceDB is an embedded vector database that runs in-process with no server:

```typescript
import * as lancedb from '@lancedb/lancedb';

const db = await lancedb.connect('data/context-brain');

const table = await db.createTable('documents', [
  { id: '1', filePath: '/docs/notes.md', text: '...', vector: [...] }
]);

// Create FTS index for hybrid search
await table.createIndex('text', { config: lancedb.Index.fts() });
```

**Why LanceDB:**
- Embedded (no server)
- Native TypeScript SDK
- Built-in hybrid search (vector + BM25)
- Memory-mapped files for efficiency
- Used by AnythingLLM, Continue, and other AI tools

### Embedding Generation

**Primary: Local embeddings with Transformers.js**

```typescript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

async function embed(texts: string[]): Promise<number[][]> {
  const output = await extractor(texts, {
    pooling: 'mean',
    normalize: true
  });
  return output.tolist();
}
```

**Fallback: Voyage AI** (Anthropic-recommended embedding provider)

```typescript
const response = await fetch('https://api.voyageai.com/v1/embeddings', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${VOYAGE_API_KEY}` },
  body: JSON.stringify({ texts, model: 'voyage-3.5' })
});
```

### Hybrid Search

Combine semantic similarity with keyword matching:

```typescript
async function search(query: string, limit = 10) {
  const queryVector = await embed([query]);

  return await table
    .query()
    .fullTextSearch(query)           // BM25 keyword search
    .nearestTo(queryVector[0])       // Vector similarity
    .rerank(lancedb.RRFReranker())   // Reciprocal Rank Fusion
    .limit(limit)
    .toArray();
}
```

### Document Processing

| File Type | Library | Output |
|-----------|---------|--------|
| PDF | pdf-parse | Text extraction |
| Images | Tesseract.js | OCR text |
| Markdown | LangChain TextSplitter | Semantic chunks |
| DOCX/XLSX | mammoth / xlsx | Text extraction |

---

## Inbox Processor

The inbox watches a folder and automatically processes incoming files.

### File Watching: Chokidar

```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch(inboxPath, {
  persistent: true,
  ignoreInitial: false,        // Process existing on startup
  awaitWriteFinish: {
    stabilityThreshold: 2000,  // Wait for write completion
    pollInterval: 100
  },
  depth: 0,
  ignored: /(^|[\/\\])\../     // Ignore dotfiles
});

watcher
  .on('add', handleFile)
  .on('ready', () => console.log('Initial scan complete'));
```

### File Type Detection

```typescript
import { fileTypeFromFile } from 'file-type';

async function detectType(filePath: string) {
  const result = await fileTypeFromFile(filePath);
  return {
    mime: result?.mime,
    ext: result?.ext,
    category: categorize(result?.mime)
  };
}
```

### Processing Pipeline

```
Inbox → Detect Type → Extract Text → Chunk → Embed → Store → Move to context/
```

```typescript
async function processFile(filePath: string) {
  // 1. Detect file type
  const fileInfo = await detectType(filePath);

  // 2. Extract text based on type
  const text = await extractText(filePath, fileInfo);

  // 3. Chunk into segments
  const chunks = await splitter.splitText(text);

  // 4. Generate embeddings
  const embeddings = await embed(chunks);

  // 5. Store in LanceDB
  await table.add(chunks.map((chunk, i) => ({
    id: `${filePath}:${i}`,
    filePath,
    text: chunk,
    vector: embeddings[i],
    createdAt: Date.now()
  })));

  // 6. Move to organized location
  const destPath = await organizeFile(filePath, fileInfo);
  await fs.rename(filePath, destPath);
}
```

---

## Tool Manager

Built tools persist in the filesystem and can be launched independently.

### Tool Structure

```
~/ClaudeOS/tools/
├── file-sorter/
│   ├── manifest.json      # Tool metadata
│   ├── index.js           # Entry point
│   └── package.json       # Dependencies (if any)
├── budget-tracker/
│   ├── manifest.json
│   ├── index.html         # UI (if applicable)
│   └── main.js
└── weekly-review/
    └── ...
```

### Tool Manifest

```json
{
  "id": "file-sorter",
  "name": "File Sorter",
  "description": "Watches Downloads and sorts files by client",
  "version": "1.0.0",
  "created": "2026-01-10T12:00:00Z",
  "type": "background",
  "entry": "index.js",
  "ui": null,
  "autostart": true
}
```

### Tool Types

| Type | Description | Implementation |
|------|-------------|----------------|
| `background` | Runs silently, no UI | Node.js child process |
| `window` | Has its own window | BrowserWindow |
| `tray` | Lives in system tray | Tray menu integration |
| `widget` | Embeddable in gallery | React component |

### Tool Lifecycle

```typescript
class ToolManager {
  private runningTools = new Map<string, ChildProcess>();

  async launch(toolId: string) {
    const manifest = await this.loadManifest(toolId);

    if (manifest.type === 'background') {
      const child = fork(manifest.entry, [], {
        cwd: path.join(toolsDir, toolId)
      });
      this.runningTools.set(toolId, child);
    }
  }

  async stop(toolId: string) {
    const process = this.runningTools.get(toolId);
    if (process) {
      process.kill();
      this.runningTools.delete(toolId);
    }
  }

  async startAutoStartTools() {
    const tools = await this.listTools();
    for (const tool of tools.filter(t => t.autostart)) {
      await this.launch(tool.id);
    }
  }
}
```

---

## Data Directory Structure

```
~/ClaudeOS/
├── inbox/                    # Drop files here for processing
│   └── (temporary landing zone)
│
├── context/                  # Claude-organized storage
│   ├── projects/
│   │   ├── consulting/
│   │   ├── mvp-club/
│   │   └── [user-defined]/
│   ├── documents/
│   ├── conversations/
│   └── reference/
│
├── tools/                    # Built tools
│   ├── [tool-id]/
│   │   ├── manifest.json
│   │   └── [tool files]
│   └── ...
│
├── data/                     # Application data
│   ├── context-brain/        # LanceDB vector store
│   │   └── *.lance
│   ├── sessions/             # Claude session data
│   └── cache/
│
└── .claudeos/                # Configuration
    ├── settings.json
    ├── credentials/          # Encrypted credentials
    └── logs/
```

---

## Security Model

### Filesystem Access

- Renderer has NO direct filesystem access
- All file operations go through main process IPC handlers
- Path validation enforces access only within ClaudeOS directory

```typescript
const allowedPaths = new Set([claudeOSHome]);

ipcMain.handle('fs:readFile', async (event, filePath) => {
  const normalized = path.normalize(filePath);
  const isAllowed = Array.from(allowedPaths).some(
    allowed => normalized.startsWith(allowed)
  );

  if (!isAllowed) {
    throw new Error('Access denied');
  }

  return fs.readFile(normalized, 'utf-8');
});
```

### Tool Sandboxing

Built tools run in separate processes with limited capabilities:
- No access to main process IPC
- Filesystem access scoped to tool directory
- Network access can be restricted per-tool

### Credential Storage

Sensitive data (API keys, OAuth tokens) stored encrypted:

```typescript
import { safeStorage } from 'electron';

function storeCredential(key: string, value: string) {
  const encrypted = safeStorage.encryptString(value);
  fs.writeFileSync(
    path.join(credentialsDir, key),
    encrypted
  );
}

function loadCredential(key: string): string {
  const encrypted = fs.readFileSync(path.join(credentialsDir, key));
  return safeStorage.decryptString(encrypted);
}
```

---

## Project Structure

```
claudeos/
├── src/
│   ├── main/                    # Main process
│   │   ├── index.ts            # Entry point
│   │   ├── window.ts           # Window management
│   │   ├── tray.ts             # System tray
│   │   ├── updater.ts          # Auto-updates
│   │   ├── ipc/                # IPC handlers
│   │   │   ├── index.ts
│   │   │   ├── chat.ts
│   │   │   ├── files.ts
│   │   │   └── tools.ts
│   │   └── services/
│   │       ├── inbox-processor.ts
│   │       └── tool-manager.ts
│   │
│   ├── worker/                  # Utility process (agent)
│   │   ├── agent-worker.ts
│   │   ├── context-brain.ts
│   │   └── embeddings.ts
│   │
│   ├── preload/                 # Preload scripts
│   │   ├── index.ts
│   │   └── api.ts
│   │
│   ├── renderer/                # React application
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── LearningWindow/
│   │   │   ├── ToolGallery/
│   │   │   └── Settings/
│   │   ├── hooks/
│   │   │   ├── useStreamingChat.ts
│   │   │   └── useTools.ts
│   │   └── stores/             # State (Zustand)
│   │
│   ├── shared/                  # Shared types
│   │   └── types.ts
│   │
│   └── types/                   # TypeScript declarations
│       └── electron.d.ts
│
├── resources/                   # Static assets
│   ├── icons/
│   └── tray/
│
├── electron-builder.json        # Build config
├── package.json
└── tsconfig.json
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Desktop Shell** | Electron 34+ | Cross-platform desktop app |
| **UI Framework** | React 19 + TypeScript | Renderer UI |
| **State Management** | Zustand | Lightweight state |
| **Agent Engine** | Claude Agent SDK | Agentic capabilities |
| **Vector Database** | LanceDB | Semantic storage |
| **Embeddings** | Transformers.js | Local embedding generation |
| **File Watching** | Chokidar | Inbox monitoring |
| **File Detection** | file-type | Magic byte detection |
| **PDF Processing** | pdf-parse | PDF text extraction |
| **OCR** | Tesseract.js | Image text extraction |
| **Build Tool** | Vite + electron-vite | Fast builds |
| **Packaging** | electron-builder | Installers |
| **Auto-Update** | electron-updater | OTA updates |

---

## Performance Considerations

### Streaming UI Updates

Batch state updates to prevent jank during token streaming:

```typescript
const streamBuffer = useRef('');

const handleToken = useCallback((token: string) => {
  streamBuffer.current += token;

  // Batch updates at 60fps
  requestAnimationFrame(() => {
    setContent(streamBuffer.current);
  });
}, []);
```

### Virtualized Lists

For long conversations or large tool galleries:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 100,
  overscan: 5
});
```

### Context Brain Indexing

Run embedding generation in utility process to avoid blocking:
- Process files in batches
- Use incremental updates (hash comparison)
- Index during idle time

---

## Future Considerations

### Plugin System

Allow third-party tools/integrations:
- MCP server support for external capabilities
- Tool marketplace
- Shared tool templates

### Sync

Optional cloud sync for:
- Session history
- Tool configurations
- (User-controlled, opt-in)

### Mobile Companion

Read-only mobile app for:
- Viewing context brain
- Tool status
- Quick queries

---

*This architecture is designed to evolve. The blank-canvas nature of ClaudeOS means new patterns will emerge as users build with it.*
