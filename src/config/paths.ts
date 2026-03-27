import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

export const GLOBAL_DIR = join(homedir(), '.askapro');
export const GLOBAL_CONFIG_FILE = join(GLOBAL_DIR, 'OPENAI.md');
export const GLOBAL_SETTINGS_FILE = join(GLOBAL_DIR, 'settings.json');
export const GLOBAL_MEMORY_DIR = join(GLOBAL_DIR, 'memory');
export const GLOBAL_ROLES_DIR = join(GLOBAL_DIR, 'roles');
export const GLOBAL_DB_FILE = join(GLOBAL_DIR, 'data.db');

export function getProjectDir(): string {
  return process.cwd();
}

export function getProjectConfigFile(): string {
  return join(getProjectDir(), 'OPENAI.md');
}

export function getProjectDataDir(): string {
  return join(getProjectDir(), '.askapro');
}

export function getProjectIndexDir(): string {
  return join(getProjectDataDir(), 'index');
}

export function ensureGlobalDirs(): void {
  for (const dir of [GLOBAL_DIR, GLOBAL_MEMORY_DIR, GLOBAL_ROLES_DIR]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export function ensureProjectDirs(): void {
  const dirs = [getProjectDataDir(), getProjectIndexDir()];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export function resolveRolesDir(): string {
  // Built-in roles are relative to the source
  return resolve(import.meta.dirname || __dirname, '..', 'roles');
}
