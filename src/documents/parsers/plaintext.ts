import { readFileSync } from 'node:fs';

export function parsePlaintext(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

export const PLAINTEXT_EXTENSIONS = ['.txt', '.md', '.rst', '.tex', '.rtf', '.log', '.cfg', '.ini', '.conf'];
