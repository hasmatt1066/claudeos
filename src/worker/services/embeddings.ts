/**
 * Embedding Service
 * Uses Transformers.js to generate embeddings locally
 */

import { pipeline } from '@huggingface/transformers';

// Use 'any' to avoid complex union type issues with Transformers.js pipeline types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the embedding model
 * Uses Xenova/all-MiniLM-L6-v2 for efficient local embeddings
 */
export async function initEmbeddings(): Promise<void> {
  if (extractor) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log('[Embeddings] Loading model...');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[Embeddings] Model loaded successfully');
  })();

  return initPromise;
}

/**
 * Generate embeddings for an array of texts
 * @param texts Array of strings to embed
 * @returns Array of embedding vectors (384 dimensions each)
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!extractor) {
    await initEmbeddings();
  }

  if (!extractor) {
    throw new Error('Embedding model not initialized');
  }

  // Generate embeddings with mean pooling and normalization
  const output = await extractor(texts, {
    pooling: 'mean',
    normalize: true
  });

  // Convert to array format
  return output.tolist() as number[][];
}

/**
 * Generate a single embedding for a text
 * @param text Text to embed
 * @returns Embedding vector (384 dimensions)
 */
export async function embedSingle(text: string): Promise<number[]> {
  const vectors = await embed([text]);
  return vectors[0];
}

/**
 * Check if embeddings are initialized
 */
export function isInitialized(): boolean {
  return extractor !== null;
}
