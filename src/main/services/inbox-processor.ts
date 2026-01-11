/**
 * Inbox Processor Service
 * Watches ~/ClaudeOS/inbox/ for new files and auto-organizes them
 */

import chokidar, { FSWatcher } from 'chokidar';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';

// PDF parsing - dynamic import for ESM compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParse: ((buffer: Buffer) => Promise<{ text: string }>) | null = null;

export interface ProcessedFile {
  originalPath: string;
  newPath: string;
  text: string;
  fileType: string;
  category: string;
  fileName: string;
}

export interface InboxProcessorOptions {
  inboxPath: string;
  contextPath: string;
  onFileProcessed: (file: ProcessedFile) => Promise<void>;
}

interface FileInfo {
  mime: string;
  ext: string;
  category: string;
}

export class InboxProcessor {
  private watcher: FSWatcher | null = null;
  private inboxPath: string;
  private contextPath: string;
  private onFileProcessed: (file: ProcessedFile) => Promise<void>;
  private mainWindow: BrowserWindow | null = null;
  private processing = new Set<string>();

  constructor(options: InboxProcessorOptions) {
    this.inboxPath = options.inboxPath;
    this.contextPath = options.contextPath;
    this.onFileProcessed = options.onFileProcessed;
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Start watching the inbox directory
   */
  async start(): Promise<void> {
    console.log('[InboxProcessor] Starting...');

    // Ensure directories exist
    await fs.mkdir(this.inboxPath, { recursive: true });
    await fs.mkdir(this.contextPath, { recursive: true });

    // Create category subdirectories
    const categories = ['documents', 'documents/finance', 'documents/notes', 'images', 'reference'];
    for (const cat of categories) {
      await fs.mkdir(path.join(this.contextPath, cat), { recursive: true });
    }

    // Load pdf-parse dynamically
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfModule = await import('pdf-parse') as any;
      pdfParse = pdfModule.default || pdfModule;
      console.log('[InboxProcessor] PDF parsing enabled');
    } catch (e) {
      console.warn('[InboxProcessor] PDF parsing not available:', e);
    }

    // Initialize watcher
    this.watcher = chokidar.watch(this.inboxPath, {
      ignoreInitial: false, // Process existing files on startup (reconciliation)
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      depth: 0,
      ignored: /(^|[\/\\])\../ // Ignore dotfiles
    });

    this.watcher.on('add', (filePath: string) => this.processFile(filePath));
    this.watcher.on('ready', () => {
      console.log('[InboxProcessor] Ready and watching:', this.inboxPath);
    });
    this.watcher.on('error', (error: unknown) => {
      console.error('[InboxProcessor] Watcher error:', error);
    });

    console.log('[InboxProcessor] Started');
  }

  /**
   * Process a file that was added to the inbox
   */
  private async processFile(filePath: string): Promise<void> {
    // Prevent duplicate processing
    if (this.processing.has(filePath)) {
      return;
    }
    this.processing.add(filePath);

    try {
      const fileName = path.basename(filePath);
      console.log(`[InboxProcessor] Processing: ${fileName}`);

      // Notify UI that processing started
      this.notifyRenderer('inbox:processing', { fileName, status: 'started' });

      // Detect file type
      const fileInfo = await this.detectType(filePath);

      // Extract text content
      const text = await this.extractText(filePath, fileInfo);

      // Determine category based on content and type
      const category = this.categorize(fileInfo, text);

      // Generate semantic name
      const newName = this.generateName(fileName, fileInfo, text);

      // Move to context folder
      const destDir = path.join(this.contextPath, category);
      await fs.mkdir(destDir, { recursive: true });
      const destPath = path.join(destDir, newName);

      // Handle potential name conflicts
      const finalPath = await this.getUniqueDestPath(destPath);
      await fs.rename(filePath, finalPath);

      // Create processed file info
      const processedFile: ProcessedFile = {
        originalPath: filePath,
        newPath: finalPath,
        text,
        fileType: fileInfo.category,
        category,
        fileName: path.basename(finalPath)
      };

      // Call callback for indexing
      await this.onFileProcessed(processedFile);

      // Notify UI of completion
      this.notifyRenderer('inbox:processed', {
        fileName: processedFile.fileName,
        category,
        originalName: fileName
      });

      console.log(`[InboxProcessor] Processed: ${fileName} -> ${category}/${path.basename(finalPath)}`);
    } catch (error) {
      console.error(`[InboxProcessor] Error processing ${filePath}:`, error);
      this.notifyRenderer('inbox:error', {
        fileName: path.basename(filePath),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.processing.delete(filePath);
    }
  }

  /**
   * Detect file type using file-type library
   */
  private async detectType(filePath: string): Promise<FileInfo> {
    const result = await fileTypeFromFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      mime: result?.mime || this.getMimeFromExt(ext),
      ext: result?.ext || ext.slice(1),
      category: this.mimeToCategory(result?.mime, ext)
    };
  }

  /**
   * Get MIME type from extension for text files
   */
  private getMimeFromExt(ext: string): string {
    const mimeMap: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.py': 'text/x-python',
      '.yml': 'text/yaml',
      '.yaml': 'text/yaml'
    };
    return mimeMap[ext] || 'text/plain';
  }

  /**
   * Map MIME type to category
   */
  private mimeToCategory(mime: string | undefined, ext: string): string {
    if (mime?.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (mime?.includes('word') || mime?.includes('document')) return 'document';
    if (mime?.includes('spreadsheet') || mime?.includes('excel')) return 'spreadsheet';
    if (mime?.includes('presentation') || mime?.includes('powerpoint')) return 'presentation';

    // Text file extensions
    const textExts = ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.html', '.css', '.py', '.yml', '.yaml'];
    if (textExts.includes(ext)) return 'text';

    return 'other';
  }

  /**
   * Extract text content from file
   */
  private async extractText(filePath: string, fileInfo: FileInfo): Promise<string> {
    try {
      if (fileInfo.category === 'pdf' && pdfParse) {
        const buffer = await fs.readFile(filePath);
        const data = await pdfParse(buffer);
        return data.text.slice(0, 50000); // Limit text length
      }

      if (['text', 'document'].includes(fileInfo.category)) {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.slice(0, 50000); // Limit text length
      }

      // Images and other binary files - no text extraction
      return '';
    } catch (error) {
      console.warn(`[InboxProcessor] Text extraction failed for ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Categorize file based on type and content
   */
  private categorize(fileInfo: FileInfo, text: string): string {
    // Images go to images folder
    if (fileInfo.category === 'image') return 'images';

    // Check for specific content patterns
    const lowerText = text.toLowerCase();

    // Finance-related documents
    if (
      lowerText.includes('invoice') ||
      lowerText.includes('receipt') ||
      lowerText.includes('budget') ||
      lowerText.includes('expense') ||
      lowerText.includes('payment')
    ) {
      return 'documents/finance';
    }

    // Meeting notes and notes
    if (
      lowerText.includes('meeting') ||
      lowerText.includes('notes') ||
      lowerText.includes('minutes') ||
      lowerText.includes('agenda')
    ) {
      return 'documents/notes';
    }

    // Reference materials
    if (
      lowerText.includes('reference') ||
      lowerText.includes('documentation') ||
      lowerText.includes('manual') ||
      lowerText.includes('guide')
    ) {
      return 'reference';
    }

    // Default to documents
    return 'documents';
  }

  /**
   * Generate a semantic filename with timestamp
   */
  private generateName(original: string, _fileInfo: FileInfo, _text: string): string {
    const ext = path.extname(original);
    const base = path.basename(original, ext);
    const timestamp = new Date().toISOString().slice(0, 10);

    // Clean the base name
    const cleanBase = base
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .toLowerCase()
      .slice(0, 50); // Limit length

    return `${timestamp}-${cleanBase}${ext}`;
  }

  /**
   * Get a unique destination path to avoid overwrites
   */
  private async getUniqueDestPath(destPath: string): Promise<string> {
    let finalPath = destPath;
    let counter = 1;

    while (true) {
      try {
        await fs.access(finalPath);
        // File exists, try with counter
        const ext = path.extname(destPath);
        const base = path.basename(destPath, ext);
        const dir = path.dirname(destPath);
        finalPath = path.join(dir, `${base}-${counter}${ext}`);
        counter++;
      } catch {
        // File doesn't exist, we can use this path
        break;
      }
    }

    return finalPath;
  }

  /**
   * Send notification to renderer process
   */
  private notifyRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Get the inbox directory path
   */
  getInboxPath(): string {
    return this.inboxPath;
  }

  /**
   * Get the context directory path
   */
  getContextPath(): string {
    return this.contextPath;
  }

  /**
   * Stop watching and clean up
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    console.log('[InboxProcessor] Stopped');
  }
}
