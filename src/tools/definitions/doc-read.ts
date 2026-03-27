import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { parseDocument } from '../../documents/parser.js';
import type { ToolDefinition } from '../registry.js';

export const docReadTool: ToolDefinition = {
  name: 'doc_read',
  description: 'Liest ein Dokument beliebigen Formats (PDF, DOCX, XLSX, CSV, HTML, Bilder, E-Mails, Apple-Dokumente, etc.) und gibt den extrahierten Text zurueck.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Pfad zur Datei (relativ oder absolut)',
      },
      max_chars: {
        type: 'number',
        description: 'Maximale Anzahl Zeichen in der Ausgabe (Standard: 50000)',
      },
    },
    required: ['path'],
  },
  async execute(params) {
    const filePath = resolve(params.path as string);

    if (!existsSync(filePath)) {
      return `Fehler: Datei nicht gefunden: ${filePath}`;
    }

    try {
      const doc = await parseDocument(filePath);
      const maxChars = (params.max_chars as number) || 50000;

      let text = doc.text;
      let truncated = false;
      if (text.length > maxChars) {
        text = text.slice(0, maxChars);
        truncated = true;
      }

      const header = [
        `Datei: ${doc.filename}`,
        `Format: ${doc.format}`,
        `Groesse: ${(doc.size / 1024).toFixed(1)} KB`,
      ];

      if (doc.metadata.pages) header.push(`Seiten: ${doc.metadata.pages}`);
      if (doc.metadata.sheets) header.push(`Blaetter: ${(doc.metadata.sheets as string[]).join(', ')}`);
      if (truncated) header.push(`(Text gekuerzt auf ${maxChars} Zeichen)`);

      return header.join(' | ') + '\n---\n' + text;
    } catch (err) {
      return `Fehler beim Lesen: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};
