import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export async function parsePptx(filePath: string): Promise<string> {
  // Try textutil on macOS first
  try {
    const tempDir = mkdtempSync(join(tmpdir(), 'askpro-pptx-'));
    const outFile = join(tempDir, 'output.txt');
    execFileSync('textutil', ['-convert', 'txt', '-output', outFile, filePath], { stdio: 'pipe' });
    if (existsSync(outFile)) {
      return readFileSync(outFile, 'utf-8');
    }
  } catch {
    // textutil failed
  }

  // Fallback: try xlsx lib
  try {
    const XLSX = await import('xlsx');
    const buffer = readFileSync(filePath);
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const parts: string[] = [];
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      if (sheet) {
        parts.push(XLSX.utils.sheet_to_csv(sheet));
      }
    }
    return parts.join('\n\n') || '(Kein Text extrahierbar)';
  } catch {
    return '(PowerPoint-Datei konnte nicht gelesen werden)';
  }
}
