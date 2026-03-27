import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function extractArchive(filePath: string): string[] {
  const tempDir = mkdtempSync(join(tmpdir(), 'askpro-'));

  try {
    if (filePath.endsWith('.zip')) {
      execFileSync('unzip', ['-o', '-q', filePath, '-d', tempDir], { stdio: 'pipe' });
    } else if (filePath.endsWith('.tar.gz') || filePath.endsWith('.tgz')) {
      execFileSync('tar', ['-xzf', filePath, '-C', tempDir], { stdio: 'pipe' });
    } else if (filePath.endsWith('.tar')) {
      execFileSync('tar', ['-xf', filePath, '-C', tempDir], { stdio: 'pipe' });
    } else {
      return [];
    }
  } catch {
    return [];
  }

  return collectFiles(tempDir);
}

function collectFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}
