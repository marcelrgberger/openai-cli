import type { ToolDefinition } from '../registry.js';

// These will be set by the REPL when document index is available
let vectorStoreRef: any = null;
let indexStoreRef: any = null;

export function setSearchStores(vectorStore: any, indexStore: any): void {
  vectorStoreRef = vectorStore;
  indexStoreRef = indexStore;
}

export const docSearchTool: ToolDefinition = {
  name: 'doc_search',
  description: 'Durchsucht die indexierten Dokumente semantisch nach relevanten Textstellen. Nutze dieses Tool, bevor du Fragen zu Dokumenten beantwortest.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Suchanfrage — was suchst du in den Dokumenten?',
      },
      top_k: {
        type: 'number',
        description: 'Anzahl der Ergebnisse (Standard: 5)',
      },
    },
    required: ['query'],
  },
  async execute(params) {
    const query = params.query as string;
    const topK = (params.top_k as number) || 5;

    if (!vectorStoreRef || !indexStoreRef) {
      // Fallback to text search if no embeddings available
      if (indexStoreRef) {
        const results = indexStoreRef.searchText(query, topK);
        if (results.length === 0) {
          return 'Keine Treffer gefunden. Sind Dokumente indexiert? Nutze /docs ingest <pfad>';
        }
        return results.map((r: any, i: number) =>
          `[${i + 1}] ${r.doc_name} (Chunk ${r.chunk_index}):\n${r.text.slice(0, 500)}`
        ).join('\n\n---\n\n');
      }
      return 'Keine Dokumente indexiert. Nutze /docs ingest <pfad> um Dokumente einzulesen.';
    }

    try {
      const results = await vectorStoreRef.hybridSearch(query, topK);

      if (results.length === 0) {
        return 'Keine relevanten Textstellen gefunden.';
      }

      return results.map((r: any, i: number) =>
        `[${i + 1}] ${r.chunk.doc_name} (Relevanz: ${(r.score * 100).toFixed(0)}%):\n${r.chunk.text.slice(0, 800)}`
      ).join('\n\n---\n\n');
    } catch (err) {
      return `Suchfehler: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};
