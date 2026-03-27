import { loadAllRoles, type RoleDefinition } from './loader.js';

export class RoleRegistry {
  private roles = new Map<string, RoleDefinition>();
  private triggerIndex = new Map<string, string[]>(); // trigger -> roleIds

  constructor() {
    this.reload();
  }

  reload(): void {
    this.roles.clear();
    this.triggerIndex.clear();

    const roles = loadAllRoles();
    for (const role of roles) {
      this.roles.set(role.id, role);

      for (const trigger of role.triggers) {
        const lower = trigger.toLowerCase();
        if (!this.triggerIndex.has(lower)) {
          this.triggerIndex.set(lower, []);
        }
        this.triggerIndex.get(lower)!.push(role.id);
      }
    }
  }

  get(id: string): RoleDefinition | undefined {
    return this.roles.get(id);
  }

  getAll(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  getByCategory(category: string): RoleDefinition[] {
    return this.getAll().filter((r) => r.category === category);
  }

  matchByKeywords(text: string): Array<{ roleId: string; score: number; triggers: string[] }> {
    const lower = text.toLowerCase();
    const scores = new Map<string, { score: number; triggers: string[] }>();

    for (const [trigger, roleIds] of this.triggerIndex) {
      if (lower.includes(trigger)) {
        for (const roleId of roleIds) {
          if (!scores.has(roleId)) {
            scores.set(roleId, { score: 0, triggers: [] });
          }
          const entry = scores.get(roleId)!;
          entry.score += trigger.length; // longer triggers = more specific = higher score
          entry.triggers.push(trigger);
        }
      }
    }

    return Array.from(scores.entries())
      .map(([roleId, data]) => ({ roleId, ...data }))
      .sort((a, b) => b.score - a.score);
  }

  count(): number {
    return this.roles.size;
  }
}
