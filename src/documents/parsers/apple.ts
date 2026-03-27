import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function parseAppleDocument(filePath: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'askpro-apple-'));
  const outFile = join(tempDir, 'output.txt');

  try {
    execFileSync('textutil', ['-convert', 'txt', '-output', outFile, filePath], {
      stdio: 'pipe',
    });

    if (existsSync(outFile)) {
      return readFileSync(outFile, 'utf-8');
    }
  } catch {
    // textutil not available or format not supported
  }

  return `(Apple-Dokument konnte nicht konvertiert werden: ${filePath})`;
}

export const APPLE_EXTENSIONS = ['.pages', '.numbers', '.key'];
