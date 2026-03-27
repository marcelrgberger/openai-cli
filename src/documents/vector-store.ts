import { createEmbedding, cosineSimilarity } from '../llm/embeddings.js';
import { IndexStore, type StoredChunk } from './index-store.js';

export interface SearchResult {
  chunk: StoredChunk;
  score: number;
}

export class VectorStore {
  private indexStore: IndexStore;

  constructor(indexStore: IndexStore) {
    this.indexStore = indexStore;
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await createEmbedding(query);
    const allChunks = this.indexStore.getAllChunks();

    const scored: SearchResult[] = [];

    for (const chunk of allChunks) {
      if (!chunk.embedding) continue;

      try {
        const chunkEmbedding = JSON.parse(chunk.embedding as string) as number[];
        const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
        scored.push({ chunk, score });
      } catch {
        // Skip chunks with invalid embeddings
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async hybridSearch(query: string, topK: number = 5): Promise<SearchResult[]> {
    // Combine vector search with text search
    const vectorResults = await this.search(query, topK * 2);
    const textResults = this.indexStore.searchText(query, topK);

    // Merge results, preferring vector search but boosting text matches
    const resultMap = new Map<number, SearchResult>();

    for (const vr of vectorResults) {
      resultMap.set(vr.chunk.id, vr);
    }

    for (const tr of textResults) {
      if (resultMap.has(tr.id)) {
        // Boost score for chunks that also match text search
        resultMap.get(tr.id)!.score *= 1.3;
      } else {
        resultMap.set(tr.id, { chunk: tr, score: 0.5 });
      }
    }

    const merged = Array.from(resultMap.values());
    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, topK);
  }
}
