import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GLOBAL_ROLES_DIR } from '../config/paths.js';

export interface RoleDefinition {
  id: string;
  name: string;
  category: string;
  triggers: string[];
  outputs: string[];
  jurisdiction?: string;
  content: string;
}

export function parseRoleFile(filePath: string): RoleDefinition | null {
  const raw = readFileSync(filePath, 'utf-8');

  // Parse YAML frontmatter
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1];
  const content = fmMatch[2].trim();

  const getField = (name: string): string => {
    const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
    return match?.[1]?.trim() || '';
  };

  const getList = (name: string): string[] => {
    const lines: string[] = [];
    const regex = new RegExp(`^${name}:\\s*$`, 'm');
    const startMatch = frontmatter.match(regex);
    if (!startMatch) return [];

    const startIdx = (startMatch.index || 0) + startMatch[0].length;
    const remaining = frontmatter.slice(startIdx);
    for (const line of remaining.split('\n')) {
      const itemMatch = line.match(/^\s+-\s+(.+)$/);
      if (itemMatch) {
        lines.push(itemMatch[1].trim());
      } else if (line.trim() && !line.startsWith(' ')) {
        break;
      }
    }
    return lines;
  };

  const id = getField('id');
  const name = getField('name');
  const category = getField('category');

  if (!id || !name) return null;

  return {
    id,
    name,
    category,
    triggers: getList('triggers'),
    outputs: getList('outputs'),
    jurisdiction: getField('jurisdiction') || undefined,
    content,
  };
}

export function loadRolesFromDir(dir: string): RoleDefinition[] {
  const roles: RoleDefinition[] = [];

  if (!existsSync(dir)) return roles;

  function walk(d: string): void {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.md')) {
        const role = parseRoleFile(full);
        if (role) roles.push(role);
      }
    }
  }

  walk(dir);
  return roles;
}

export function loadAllRoles(): RoleDefinition[] {
  // Built-in roles
  const builtinDir = resolve(import.meta.dirname || __dirname, '.');
  const builtinRoles = loadRolesFromDir(builtinDir);

  // User custom roles
  const userRoles = loadRolesFromDir(GLOBAL_ROLES_DIR);

  // Merge: user roles override built-in by ID
  const roleMap = new Map<string, RoleDefinition>();
  for (const r of builtinRoles) roleMap.set(r.id, r);
  for (const r of userRoles) roleMap.set(r.id, r);

  return Array.from(roleMap.values());
}
