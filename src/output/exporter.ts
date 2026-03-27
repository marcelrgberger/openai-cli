import { writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type ExportFormat = 'md' | 'txt';

export function exportDocument(
  content: string,
  filename: string,
  format: ExportFormat = 'md',
  outputDir?: string,
): string {
  const dir = outputDir || process.cwd();
  const ext = format === 'md' ? '.md' : '.txt';
  let outPath = join(dir, filename + ext);

  // Avoid overwriting
  let counter = 1;
  while (existsSync(outPath)) {
    outPath = join(dir, `${filename}-${counter}${ext}`);
    counter++;
  }

  writeFileSync(outPath, content, 'utf-8');
  return outPath;
}

export function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function generateExportFilename(type: string): string {
  return `${type}-${formatDate()}`;
}
