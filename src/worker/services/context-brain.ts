/**
 * Context Brain Service
 * Uses LanceDB for semantic storage and retrieval of user documents
 */

import * as lancedb from '@lancedb/lancedb';
import { embed, initEmbeddings } from './embeddings';

export interface Document {
  id: string;
  filePath: string;
  text: string;
  vector: number[];
  createdAt: number;
  fileType: string;
}

export interface SearchResult {
  id: string;
  filePath: string;
  text: string;
  createdAt: number;
  fileType: string;
  _relevance_score?: number;
}

export class ContextBrain {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private initialized = false;

  /**
   * Initialize the context brain with LanceDB
   * @param dbPath Path to the database directory
   */
  async initialize(dbPath: string): Promise<void> {
    if (this.initialized) return;

    console.log('[ContextBrain] Initializing at:', dbPath);

    // Initialize embeddings first
    await initEmbeddings();

    // Connect to LanceDB
    this.db = await lancedb.connect(dbPath);

    // Try to open existing table or create new one
    try {
      this.table = await this.db.openTable('documents');
      console.log('[ContextBrain] Opened existing documents table');
    } catch {
      // Create table with initial schema
      console.log('[ContextBrain] Creating new documents table');
      const dummyVector = await embed(['initialization']);

      this.table = await this.db.createTable('documents', [
        {
          id: 'system:init',
          filePath: '',
          text: 'Context Brain initialization document',
          vector: dummyVector[0],
          createdAt: Date.now(),
          fileType: 'system'
        }
      ]);

      // Create full-text search index on text column
      try {
        await this.table.createIndex('text', {
          config: lancedb.Index.fts()
        });
        console.log('[ContextBrain] Created FTS index');
      } catch (e) {
        console.warn('[ContextBrain] FTS index creation failed:', e);
      }
    }

    this.initialized = true;
    console.log('[ContextBrain] Initialized successfully');
  }

  /**
   * Add a document to the context brain
   * @param filePath Path to the source file
   * @param text Document text content
   * @param fileType Type of file (e.g., 'markdown', 'text', 'code')
   */
  async addDocument(filePath: string, text: string, fileType: string): Promise<void> {
    if (!this.table) {
      throw new Error('Context brain not initialized');
    }

    const vector = (await embed([text]))[0];
    const id = `${filePath}:${Date.now()}`;

    await this.table.add([
      {
        id,
        filePath,
        text,
        vector,
        createdAt: Date.now(),
        fileType
      }
    ]);

    console.log('[ContextBrain] Added document:', filePath);
  }

  /**
   * Search for documents using hybrid search (vector + keyword)
   * @param query Search query
   * @param limit Maximum number of results
   * @returns Array of matching documents
   */
  async search(query: string, limit = 10): Promise<SearchResult[]> {
    if (!this.table) {
      throw new Error('Context brain not initialized');
    }

    const queryVector = (await embed([query]))[0];

    try {
      // Try hybrid search with RRF reranking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reranker = (lancedb as any).rerankers?.rrf?.() || (lancedb as any).RRFReranker?.();
      let queryBuilder = this.table.query().fullTextSearch(query).nearestTo(queryVector);
      if (reranker) {
        queryBuilder = queryBuilder.rerank(reranker);
      }
      const results = await queryBuilder.limit(limit).toArray();

      return results.map((row) => ({
        id: row.id as string,
        filePath: row.filePath as string,
        text: row.text as string,
        createdAt: row.createdAt as number,
        fileType: row.fileType as string,
        _relevance_score: row._relevance_score as number | undefined
      }));
    } catch (e) {
      // Fallback to vector-only search if hybrid fails
      console.warn('[ContextBrain] Hybrid search failed, using vector search:', e);

      const results = await this.table.search(queryVector).limit(limit).toArray();

      return results.map((row) => ({
        id: row.id as string,
        filePath: row.filePath as string,
        text: row.text as string,
        createdAt: row.createdAt as number,
        fileType: row.fileType as string
      }));
    }
  }

  /**
   * Search for documents using vector similarity only
   * @param query Search query
   * @param limit Maximum number of results
   * @returns Array of matching documents
   */
  async vectorSearch(query: string, limit = 10): Promise<SearchResult[]> {
    if (!this.table) {
      throw new Error('Context brain not initialized');
    }

    const queryVector = (await embed([query]))[0];

    const results = await this.table.search(queryVector).limit(limit).toArray();

    return results.map((row) => ({
      id: row.id as string,
      filePath: row.filePath as string,
      text: row.text as string,
      createdAt: row.createdAt as number,
      fileType: row.fileType as string
    }));
  }

  /**
   * Delete documents by file path
   * @param filePath Path of documents to delete
   */
  async deleteByPath(filePath: string): Promise<void> {
    if (!this.table) {
      throw new Error('Context brain not initialized');
    }

    await this.table.delete(`filePath = '${filePath}'`);
    console.log('[ContextBrain] Deleted documents for:', filePath);
  }

  /**
   * Get document count
   */
  async count(): Promise<number> {
    if (!this.table) {
      return 0;
    }

    const results = await this.table.countRows();
    return results;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const contextBrain = new ContextBrain();
