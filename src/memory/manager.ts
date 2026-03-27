import { MemoryStore } from './store.js';

let storeInstance: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!storeInstance) {
    storeInstance = new MemoryStore();
  }
  return storeInstance;
}

export function formatMemoriesForContext(): string {
  const store = getMemoryStore();
  const memories = store.getAll();

  if (memories.length === 0) return '';

  const lines = ['## Gespeicherte Erinnerungen\n'];

  const categories = new Map<string, typeof memories>();
  for (const m of memories) {
    if (!categories.has(m.category)) {
      categories.set(m.category, []);
    }
    categories.get(m.category)!.push(m);
  }

  for (const [category, entries] of categories) {
    lines.push(`### ${category}`);
    for (const entry of entries.slice(0, 10)) {
      lines.push(`- **${entry.key}**: ${entry.value}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
