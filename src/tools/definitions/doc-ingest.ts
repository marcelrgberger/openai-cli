import { resolve, basename } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument, isSupportedFile } from '../../documents/parser.js';
import { chunkText } from '../../documents/chunker.js';
import { createEmbeddings } from '../../llm/embeddings.js';
import { IndexStore } from '../../documents/index-store.js';
import type { ToolDefinition } from '../registry.js';

let indexStoreRef: IndexStore | null = null;

export function setIngestStore(store: IndexStore): void {
  indexStoreRef = store;
}

export const docIngestTool: ToolDefinition = {
  name: 'doc_ingest',
  description: 'Liest alle Dokumente in einem Verzeichnis ein, zerteilt sie in Chunks, erstellt Embeddings und speichert sie im Index fuer spaetere semantische Suche.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Pfad zum Verzeichnis mit Dokumenten',
      },
      recursive: {
        type: 'boolean',
        description: 'Unterverzeichnisse einbeziehen (Standard: true)',
      },
    },
    required: ['path'],
  },
  async execute(params) {
    const dirPath = resolve(params.path as string);
    const recursive = params.recursive !== false;

    if (!existsSync(dirPath)) {
      return `Fehler: Verzeichnis nicht gefunden: ${dirPath}`;
    }

    if (!indexStoreRef) {
      indexStoreRef = new IndexStore();
    }

    const files = collectFiles(dirPath, recursive).filter(isSupportedFile);

    if (files.length === 0) {
      return `Keine unterstuetzten Dokumente in ${dirPath} gefunden.`;
    }

    const results: string[] = [`Indexiere ${files.length} Dokumente aus ${dirPath}...`];
    let totalChunks = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const doc = await parseDocument(file);
        const chunks = chunkText(doc.text);

        if (chunks.length === 0) continue;

        // Create embeddings for all chunks
        const texts = chunks.map((c) => c.text);
        let embeddings: number[][] | null = null;

        try {
          embeddings = await createEmbeddings(texts);
        } catch {
          // If embedding fails (no API key, rate limit), store without embeddings
        }

        const chunkData = chunks.map((c, i) => ({
          docPath: file,
          docName: basename(file),
          chunkIndex: c.index,
          text: c.text,
          embedding: embeddings?.[i],
        }));

        indexStoreRef.insertChunksBatch(chunkData);
        totalChunks += chunks.length;
        results.push(`  OK: ${basename(file)} (${chunks.length} Chunks)`);
      } catch (err) {
        errors++;
        results.push(`  FEHLER: ${basename(file)} — ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    results.push(`\nFertig: ${files.length - errors} Dokumente, ${totalChunks} Chunks indexiert.`);
    if (errors > 0) results.push(`${errors} Fehler aufgetreten.`);

    return results.join('\n');
  },
};

function collectFiles(dir: string, recursive: boolean): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isFile()) {
      files.push(full);
    } else if (stat.isDirectory() && recursive) {
      files.push(...collectFiles(full, true));
    }
  }
  return files;
}
