import { getClient } from './client.js';
import { loadSettings } from '../config/settings.js';

export async function createEmbedding(text: string): Promise<number[]> {
  const client = getClient();
  const settings = loadSettings();

  const response = await client.embeddings.create({
    model: settings.embeddingModel,
    input: text,
  });

  return response.data[0].embedding;
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getClient();
  const settings = loadSettings();

  // OpenAI supports batch embedding
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await client.embeddings.create({
      model: settings.embeddingModel,
      input: batch,
    });

    for (const item of response.data) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
