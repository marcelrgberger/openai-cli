import { extname, basename } from 'node:path';
import { statSync } from 'node:fs';
import { parsePlaintext, PLAINTEXT_EXTENSIONS } from './parsers/plaintext.js';
import { parsePdf } from './parsers/pdf.js';
import { parseDocx } from './parsers/docx.js';
import { parseXlsx, parseCsv } from './parsers/xlsx.js';
import { parseHtml } from './parsers/html.js';
import { parseEmail } from './parsers/email.js';
import { parseImage, IMAGE_EXTENSIONS } from './parsers/image.js';
import { extractArchive } from './parsers/archive.js';
import { parseAppleDocument, APPLE_EXTENSIONS } from './parsers/apple.js';
import { parsePptx } from './parsers/pptx.js';

export interface ParsedDocument {
  path: string;
  filename: string;
  format: string;
  text: string;
  size: number;
  metadata: Record<string, unknown>;
}

const ARCHIVE_EXTENSIONS = ['.zip', '.tar.gz', '.tgz', '.tar'];
const JSON_EXTENSIONS = ['.json', '.yaml', '.yml', '.xml'];

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const ext = extname(filePath).toLowerCase();
  const filename = basename(filePath);
  const size = statSync(filePath).size;

  const base: Omit<ParsedDocument, 'text' | 'format' | 'metadata'> = {
    path: filePath,
    filename,
    size,
  };

  // PDF
  if (ext === '.pdf') {
    const result = await parsePdf(filePath);
    return { ...base, format: 'pdf', text: result.text, metadata: result.metadata };
  }

  // DOCX / DOC
  if (ext === '.docx' || ext === '.doc') {
    const result = await parseDocx(filePath);
    return { ...base, format: 'docx', text: result.text, metadata: {} };
  }

  // XLSX / XLS
  if (ext === '.xlsx' || ext === '.xls') {
    const result = await parseXlsx(filePath);
    return { ...base, format: 'xlsx', text: result.text, metadata: { sheets: result.sheets } };
  }

  // CSV / TSV
  if (ext === '.csv' || ext === '.tsv') {
    const text = await parseCsv(filePath);
    return { ...base, format: 'csv', text, metadata: {} };
  }

  // PowerPoint
  if (ext === '.pptx' || ext === '.ppt') {
    const text = await parsePptx(filePath);
    return { ...base, format: 'pptx', text, metadata: {} };
  }

  // HTML
  if (ext === '.html' || ext === '.htm') {
    const text = await parseHtml(filePath);
    return { ...base, format: 'html', text, metadata: {} };
  }

  // Email
  if (ext === '.eml' || ext === '.msg') {
    const result = await parseEmail(filePath);
    return { ...base, format: 'email', text: result.text, metadata: result.metadata };
  }

  // Images (OCR)
  if (IMAGE_EXTENSIONS.includes(ext)) {
    const text = await parseImage(filePath);
    return { ...base, format: 'image', text, metadata: { ocr: true } };
  }

  // Apple Documents
  if (APPLE_EXTENSIONS.includes(ext)) {
    const text = parseAppleDocument(filePath);
    return { ...base, format: 'apple', text, metadata: {} };
  }

  // JSON/YAML/XML
  if (JSON_EXTENSIONS.includes(ext)) {
    const text = parsePlaintext(filePath);
    return { ...base, format: ext.slice(1), text, metadata: {} };
  }

  // Plaintext fallback
  if (PLAINTEXT_EXTENSIONS.includes(ext)) {
    const text = parsePlaintext(filePath);
    return { ...base, format: 'text', text, metadata: {} };
  }

  // EPUB
  if (ext === '.epub') {
    // EPUB is a ZIP with XHTML content — extract and parse
    const files = extractArchive(filePath);
    const htmlFiles = files.filter((f) => f.endsWith('.html') || f.endsWith('.xhtml') || f.endsWith('.htm'));
    const texts: string[] = [];
    for (const f of htmlFiles) {
      try {
        texts.push(await parseHtml(f));
      } catch { /* skip */ }
    }
    return { ...base, format: 'epub', text: texts.join('\n\n'), metadata: {} };
  }

  // Try plaintext as last resort
  try {
    const text = parsePlaintext(filePath);
    return { ...base, format: 'unknown', text, metadata: { warning: 'Unbekanntes Format, als Plaintext gelesen' } };
  } catch {
    return { ...base, format: 'unknown', text: `(Datei konnte nicht gelesen werden: ${filePath})`, metadata: {} };
  }
}

export function getSupportedExtensions(): string[] {
  return [
    '.pdf', '.docx', '.doc',
    '.xlsx', '.xls', '.csv', '.tsv',
    '.pptx', '.ppt',
    '.html', '.htm', '.xml', '.json', '.yaml', '.yml',
    '.eml', '.msg',
    ...IMAGE_EXTENSIONS,
    ...APPLE_EXTENSIONS,
    ...PLAINTEXT_EXTENSIONS,
    ...ARCHIVE_EXTENSIONS,
    '.epub',
  ];
}

export function isSupportedFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return getSupportedExtensions().includes(ext);
}
