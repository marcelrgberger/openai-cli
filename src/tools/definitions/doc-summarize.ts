import { resolve } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument, isSupportedFile } from '../../documents/parser.js';
import type { ToolDefinition } from '../registry.js';

export const docSummarizeTool: ToolDefinition = {
  name: 'doc_summarize',
  description: 'Liest ein Verzeichnis mit Dokumenten und gibt eine Uebersicht aller gefundenen Dateien mit Kurzinformationen zurueck.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Pfad zum Verzeichnis',
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

    const files = collectFiles(dirPath, recursive);
    const supported = files.filter(isSupportedFile);

    if (supported.length === 0) {
      return `Keine unterstuetzten Dokumente in ${dirPath} gefunden.`;
    }

    const lines: string[] = [
      `Verzeichnis: ${dirPath}`,
      `Dokumente gefunden: ${supported.length}`,
      '---',
    ];

    for (const file of supported.slice(0, 100)) {
      const stat = statSync(file);
      const sizeKb = (stat.size / 1024).toFixed(1);
      lines.push(`- ${file.replace(dirPath + '/', '')} (${sizeKb} KB)`);
    }

    if (supported.length > 100) {
      lines.push(`... und ${supported.length - 100} weitere Dateien`);
    }

    return lines.join('\n');
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
