# Phase 11: Inbox Processor

## Objective

Implement the inbox watcher that automatically processes and organizes dropped files.

## Acceptance Criteria

- [ ] Chokidar watches ~/ClaudeOS/inbox/
- [ ] New files detected within seconds
- [ ] File type detection using file-type library
- [ ] Text extraction for common formats:
  - Plain text (.txt, .md)
  - PDF (using pdf-parse)
  - Basic support for other text files
- [ ] Files moved to ~/ClaudeOS/context/{category}/
- [ ] Category determined by content/type:
  - documents/
  - images/
  - reference/
  - projects/{detected-project}/
- [ ] Files indexed in context brain
- [ ] Semantic naming (not just original filename)
- [ ] Startup reconciliation (process files added while app was closed)
- [ ] Status shown somewhere in UI (optional toast/indicator)

## Technical Notes

### Install Dependencies

```bash
npm install chokidar file-type pdf-parse
```

### Inbox Processor Service

```typescript
// src/main/services/inbox-processor.ts
import chokidar from 'chokidar';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

export class InboxProcessor {
  private watcher: chokidar.FSWatcher | null = null;
  private inboxPath: string;
  private contextPath: string;
  private onFileProcessed: (file: ProcessedFile) => void;

  constructor(options: {
    inboxPath: string;
    contextPath: string;
    onFileProcessed: (file: ProcessedFile) => void;
  }) {
    this.inboxPath = options.inboxPath;
    this.contextPath = options.contextPath;
    this.onFileProcessed = options.onFileProcessed;
  }

  async start() {
    // Ensure directories exist
    await fs.mkdir(this.inboxPath, { recursive: true });
    await fs.mkdir(this.contextPath, { recursive: true });

    this.watcher = chokidar.watch(this.inboxPath, {
      ignoreInitial: false,  // Process existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      depth: 0,
      ignored: /(^|[\/\\])\../  // Ignore dotfiles
    });

    this.watcher.on('add', (filePath) => this.processFile(filePath));
    this.watcher.on('ready', () => console.log('Inbox processor ready'));
  }

  private async processFile(filePath: string) {
    try {
      const fileName = path.basename(filePath);
      console.log(`Processing: ${fileName}`);

      // Detect file type
      const fileInfo = await this.detectType(filePath);

      // Extract text content
      const text = await this.extractText(filePath, fileInfo);

      // Determine category
      const category = this.categorize(fileInfo, text);

      // Generate semantic name (simplified - could use Claude)
      const newName = this.generateName(fileName, fileInfo, text);

      // Move to context folder
      const destDir = path.join(this.contextPath, category);
      await fs.mkdir(destDir, { recursive: true });
      const destPath = path.join(destDir, newName);
      await fs.rename(filePath, destPath);

      // Notify for indexing
      this.onFileProcessed({
        originalPath: filePath,
        newPath: destPath,
        text,
        fileType: fileInfo.category,
        category
      });

      console.log(`Processed: ${fileName} -> ${category}/${newName}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  private async detectType(filePath: string) {
    const result = await fileTypeFromFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      mime: result?.mime || 'text/plain',
      ext: result?.ext || ext.slice(1),
      category: this.mimeToCategory(result?.mime, ext)
    };
  }

  private mimeToCategory(mime: string | undefined, ext: string): string {
    if (mime?.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (mime?.includes('word')) return 'document';
    if (['.txt', '.md', '.csv'].includes(ext)) return 'text';
    return 'other';
  }

  private async extractText(filePath: string, fileInfo: any): Promise<string> {
    if (fileInfo.category === 'pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (['text', 'document'].includes(fileInfo.category)) {
      return await fs.readFile(filePath, 'utf-8');
    }

    return '';  // Images, etc. - no text extraction for now
  }

  private categorize(fileInfo: any, text: string): string {
    // Simple categorization - could be enhanced with Claude
    if (fileInfo.category === 'image') return 'images';
    if (fileInfo.category === 'pdf') return 'documents';

    // Check for project keywords
    const lowerText = text.toLowerCase();
    if (lowerText.includes('invoice') || lowerText.includes('budget')) {
      return 'documents/finance';
    }
    if (lowerText.includes('meeting') || lowerText.includes('notes')) {
      return 'documents/notes';
    }

    return 'documents';
  }

  private generateName(original: string, fileInfo: any, text: string): string {
    // For now, keep original name with timestamp
    // Could enhance with Claude-generated names
    const ext = path.extname(original);
    const base = path.basename(original, ext);
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${timestamp}-${base}${ext}`;
  }

  async stop() {
    await this.watcher?.close();
  }
}

interface ProcessedFile {
  originalPath: string;
  newPath: string;
  text: string;
  fileType: string;
  category: string;
}
```

### Integration

```typescript
// In main process
const inboxProcessor = new InboxProcessor({
  inboxPath: path.join(claudeOSHome, 'inbox'),
  contextPath: path.join(claudeOSHome, 'context'),
  onFileProcessed: async (file) => {
    // Index in context brain
    await contextBrain.addDocument(file.newPath, file.text, file.fileType);

    // Notify renderer
    mainWindow?.webContents.send('inbox:processed', {
      fileName: path.basename(file.newPath),
      category: file.category
    });
  }
});

await inboxProcessor.start();
```

## Out of Scope

- Image OCR (could add later)
- Claude-powered categorization (could enhance later)
- UI for managing inbox

## Files to Create

- src/main/services/inbox-processor.ts

## Files to Modify

- package.json (add chokidar, file-type, pdf-parse)
- src/main/index.ts (start inbox processor)
- Worker receives indexing requests

## Completion

When files dropped in inbox are auto-processed and indexed, output:

```
<promise>COMPLETE</promise>
```
