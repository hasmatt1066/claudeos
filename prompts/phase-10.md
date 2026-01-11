# Phase 10: Context Brain

## Objective

Implement the context brain using LanceDB for semantic storage and retrieval of user documents.

## Acceptance Criteria

- [ ] LanceDB initialized in ~/ClaudeOS/data/context-brain/
- [ ] Transformers.js generates embeddings locally
- [ ] Can store documents with embeddings
- [ ] Can search by semantic similarity
- [ ] Hybrid search (vector + keyword) working
- [ ] Agent has access to context brain for retrieval
- [ ] Documents indexed with metadata (path, type, date)
- [ ] Search exposed via IPC for manual testing
- [ ] No external API calls for embeddings (fully local)

## Technical Notes

### Install Dependencies

```bash
npm install @lancedb/lancedb @huggingface/transformers
```

### Embedding Service

```typescript
// src/worker/services/embeddings.ts
import { pipeline } from '@huggingface/transformers';

let extractor: any = null;

export async function initEmbeddings() {
  extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  console.log('Embedding model loaded');
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (!extractor) await initEmbeddings();

  const output = await extractor(texts, {
    pooling: 'mean',
    normalize: true
  });

  return output.tolist();
}
```

### Context Brain Service

```typescript
// src/worker/services/context-brain.ts
import * as lancedb from '@lancedb/lancedb';
import { embed } from './embeddings';

interface Document {
  id: string;
  filePath: string;
  text: string;
  vector: number[];
  createdAt: number;
  fileType: string;
}

export class ContextBrain {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;

  async initialize(dbPath: string) {
    this.db = await lancedb.connect(dbPath);

    // Create table if doesn't exist
    try {
      this.table = await this.db.openTable('documents');
    } catch {
      // Create with dummy data to establish schema
      const dummyVector = await embed(['init']);
      this.table = await this.db.createTable('documents', [{
        id: 'init',
        filePath: '',
        text: 'Initialization document',
        vector: dummyVector[0],
        createdAt: Date.now(),
        fileType: 'system'
      }]);

      // Create FTS index
      await this.table.createIndex('text', { config: lancedb.Index.fts() });
    }
  }

  async addDocument(filePath: string, text: string, fileType: string) {
    const vector = (await embed([text]))[0];

    await this.table?.add([{
      id: `${filePath}:${Date.now()}`,
      filePath,
      text,
      vector,
      createdAt: Date.now(),
      fileType
    }]);
  }

  async search(query: string, limit = 10) {
    const queryVector = (await embed([query]))[0];

    return await this.table
      ?.query()
      .fullTextSearch(query)
      .nearestTo(queryVector)
      .rerank(lancedb.RRFReranker())
      .limit(limit)
      .toArray();
  }
}
```

### Integration with Agent

Modify the agent worker to retrieve context before responding:

```typescript
// Before sending to Claude
const relevantContext = await contextBrain.search(userMessage, 5);
const contextString = relevantContext
  .map(doc => `[From ${doc.filePath}]: ${doc.text.slice(0, 500)}`)
  .join('\n\n');

const enhancedPrompt = `
Context from user's documents:
${contextString}

User message: ${userMessage}
`;
```

### IPC for Testing

```typescript
ipcMain.handle('context:search', async (_, query) => {
  return await contextBrain.search(query);
});

ipcMain.handle('context:add', async (_, { path, text, type }) => {
  return await contextBrain.addDocument(path, text, type);
});
```

## Out of Scope

- Automatic file ingestion (Phase 11)
- PDF/image processing (Phase 11)
- Context UI in the app

## Files to Create

- src/worker/services/embeddings.ts
- src/worker/services/context-brain.ts

## Files to Modify

- package.json (add lancedb, transformers)
- src/worker/agent-worker.ts (integrate context)
- src/main/ipc/context.ts (search API)
- src/preload/index.ts (expose context API)

## Completion

When you can add documents, search semantically, and agent uses context, output:

```
<promise>COMPLETE</promise>
```
