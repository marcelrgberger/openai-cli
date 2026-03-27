import chalk from 'chalk';
import { listModels, getModel } from '../llm/models.js';
import { RoleRegistry } from '../roles/registry.js';
import type { Conversation } from '../agent/conversation.js';

export interface CommandContext {
  conversation: Conversation;
  roleRegistry: RoleRegistry;
  askQuestion: (prompt: string) => Promise<string>;
  setModel: (model: string) => void;
  setRole: (role: string | null) => void;
}

export async function handleCommand(input: string, ctx: CommandContext): Promise<boolean> {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return false;

  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      showHelp();
      return true;

    case 'roles':
      await showRolesInteractive(ctx);
      return true;

    case 'role':
      if (args[0]) {
        const roleId = args[0].toLowerCase();
        const exactMatch = ctx.roleRegistry.get(roleId);

        if (exactMatch) {
          ctx.setRole(roleId);
          console.log(chalk.cyan(`  Role activated: ${exactMatch.name} (${roleId})`));
        } else {
          // Fuzzy match: find roles containing the input
          const allRoles = ctx.roleRegistry.getAll();
          const matches = allRoles.filter((r) =>
            r.id.includes(roleId) || r.name.toLowerCase().includes(roleId)
          );

          if (matches.length === 1) {
            ctx.setRole(matches[0].id);
            console.log(chalk.cyan(`  Role activated: ${matches[0].name} (${matches[0].id})`));
          } else if (matches.length > 1 && matches.length <= 10) {
            console.log(chalk.yellow(`  Multiple matches for "${roleId}":`));
            for (const m of matches) {
              console.log(chalk.dim(`    /role ${m.id}`) + chalk.dim(` — ${m.name}`));
            }
            console.log();
            console.log(chalk.dim('  Please be more specific.'));
          } else if (matches.length > 10) {
            console.log(chalk.yellow(`  ${matches.length} matches for "${roleId}" — please be more specific.`));
            console.log(chalk.dim('  Use /roles to see all available roles.'));
          } else {
            console.log(chalk.red(`  Unknown role: "${roleId}"`));
            // Suggest closest matches by edit distance
            const suggestions = findClosestRoles(roleId, allRoles, 3);
            if (suggestions.length > 0) {
              console.log(chalk.dim('  Did you mean:'));
              for (const s of suggestions) {
                console.log(chalk.dim(`    /role ${s.id}`) + chalk.dim(` — ${s.name}`));
              }
            }
            console.log(chalk.dim('\n  Use /roles to see all available roles.'));
          }
        }
      } else {
        ctx.setRole(null);
        console.log(chalk.cyan('  Role deactivated — automatic routing active'));
      }
      return true;

    case 'model':
      if (args[0]) {
        ctx.setModel(args[0]);
        const info = getModel(args[0]);
        console.log(chalk.cyan(`  Model switched: ${info.name}`));
        console.log(chalk.dim('  Saved as default for future sessions.'));
      } else {
        await showModelsInteractive(ctx);
      }
      return true;

    case 'clear':
      ctx.conversation.clear();
      console.log(chalk.cyan('  Conversation cleared'));
      return true;

    case 'exit':
    case 'quit':
      console.log(chalk.dim('\n  Goodbye!\n'));
      process.exit(0);

    default:
      console.log(chalk.yellow(`  Unknown command: /${cmd}`));
      console.log(chalk.dim('  Type /help for a list of all commands'));
      return true;
  }
}

async function showModelsInteractive(ctx: CommandContext): Promise<void> {
  console.log();
  console.log(chalk.bold('  Available models (live from OpenAI API):'));
  console.log(chalk.dim('  Enter a number to switch model, or press Enter to cancel.'));
  console.log();

  const currentModel = ctx.conversation.model;

  try {
    const models = await listModels();

    const tierLabels: Record<string, string> = {
      flagship: 'Flagship',
      pro: 'Pro (Extended Thinking)',
      fast: 'Fast & Affordable',
      nano: 'Nano (Cheapest)',
      reasoning: 'Reasoning (o-series)',
      codex: 'Codex (Code)',
      legacy: 'Legacy',
      other: 'Other',
    };

    const numbered: Array<{ num: number; id: string }> = [];
    let num = 1;

    const grouped = new Map<string, typeof models>();
    for (const m of models) {
      if (!grouped.has(m.tier)) grouped.set(m.tier, []);
      grouped.get(m.tier)!.push(m);
    }

    const tierOrder = ['flagship', 'pro', 'fast', 'nano', 'reasoning', 'codex', 'legacy', 'other'];
    for (const tier of tierOrder) {
      const tierModels = grouped.get(tier);
      if (!tierModels?.length) continue;

      console.log(chalk.cyan(`  ${tierLabels[tier] || tier}:`));
      for (const m of tierModels.slice(0, 5)) {
        const isCurrent = m.id === currentModel;
        const numStr = String(num).padStart(3, ' ');
        const marker = isCurrent ? chalk.green(' <-- active') : '';
        const name = isCurrent ? chalk.bold(m.id) : m.id;
        console.log(chalk.dim(`  ${numStr}.`) + ` ${name}${marker}`);
        numbered.push({ num, id: m.id });
        num++;
      }
      console.log();
    }

    console.log(chalk.dim(`  ${models.length} models total. Tip: /model <id> for any model.`));
    console.log();

    const answer = await ctx.askQuestion(chalk.cyan('  Switch to [number or Enter to skip]: '));

    if (!answer) return;

    const selected = parseInt(answer, 10);
    const match = numbered.find((m) => m.num === selected);

    if (match) {
      ctx.setModel(match.id);
      console.log(chalk.green(`  Model switched: ${match.id}`));
      console.log(chalk.dim('  Saved as default.'));
    } else if (answer) {
      // Maybe they typed a model ID
      ctx.setModel(answer);
      console.log(chalk.green(`  Model switched: ${answer}`));
      console.log(chalk.dim('  Saved as default.'));
    }
  } catch {
    console.log(chalk.yellow('  Could not fetch models from API.'));
    console.log(chalk.dim(`  Current model: ${currentModel}`));
    console.log(chalk.dim('  Usage: /model <name>   e.g. /model gpt-5.4'));
  }
  console.log();
}

function showHelp(): void {
  console.log();
  console.log(chalk.bold('  Commands:'));
  console.log();
  console.log('  /help               Show this help');
  console.log('  /roles              List all expert roles');
  console.log('  /role <id>          Activate a specific role');
  console.log('  /role               Enable automatic routing');
  console.log('  /model <name>       Switch model');
  console.log('  /model              Show available models (live from API)');
  console.log('  /clear              Clear conversation');
  console.log('  /exit               Exit');
  console.log();
  console.log(chalk.dim('  Planned: /docs, /export, /panel, /memory, /compact'));
  console.log();
}

const CATEGORY_LABELS: Record<string, string> = {
  legal: 'Legal (General)',
  'legal-de': 'Legal (Germany-specific)',
  finance: 'Tax & Finance',
  medical: 'Medical',
  realestate: 'Real Estate',
  insurance: 'Insurance',
  business: 'Business',
  academia: 'Academia',
  engineering: 'Engineering',
  consumer: 'Consumer',
  meta: 'Meta',
};

const CATEGORY_ORDER = ['legal', 'legal-de', 'finance', 'medical', 'realestate', 'insurance', 'business', 'academia', 'engineering', 'consumer', 'meta'];

async function showRolesInteractive(ctx: CommandContext): Promise<void> {
  const allRoles = ctx.roleRegistry.getAll();

  // Group by category
  const grouped = new Map<string, Array<{ id: string; name: string }>>();
  for (const role of allRoles) {
    if (!grouped.has(role.category)) grouped.set(role.category, []);
    grouped.get(role.category)!.push({ id: role.id, name: role.name });
  }

  // Build flat numbered list
  const numberedRoles: Array<{ num: number; id: string; name: string; category: string }> = [];
  let num = 1;

  console.log();
  console.log(chalk.bold(`  Expert Roles (${allRoles.length}):`));
  console.log(chalk.dim('  Enter a number to activate a role, or press Enter to cancel.'));
  console.log();

  for (const cat of CATEGORY_ORDER) {
    const roles = grouped.get(cat);
    if (!roles?.length) continue;
    grouped.delete(cat);

    const label = CATEGORY_LABELS[cat] || cat;
    console.log(chalk.cyan(`  ${label}:`));

    for (const r of roles) {
      const numStr = String(num).padStart(3, ' ');
      console.log(chalk.dim(`  ${numStr}.`) + ` ${r.id}` + chalk.dim(` — ${r.name}`));
      numberedRoles.push({ num, id: r.id, name: r.name, category: cat });
      num++;
    }
    console.log();
  }

  // Custom categories
  for (const [cat, roles] of grouped) {
    if (!roles.length) continue;
    const label = CATEGORY_LABELS[cat] || `Custom: ${cat}`;
    console.log(chalk.cyan(`  ${label}:`));
    for (const r of roles) {
      const numStr = String(num).padStart(3, ' ');
      console.log(chalk.dim(`  ${numStr}.`) + ` ${r.id}` + chalk.dim(` — ${r.name}`));
      numberedRoles.push({ num, id: r.id, name: r.name, category: cat });
      num++;
    }
    console.log();
  }

  console.log(chalk.dim('  Custom roles: add .md files to ~/.askpro/roles/'));
  console.log();

  const answer = await ctx.askQuestion(chalk.cyan('  Activate role [number or Enter to skip]: '));

  if (!answer) return;

  const selected = parseInt(answer, 10);
  const match = numberedRoles.find((r) => r.num === selected);

  if (match) {
    ctx.setRole(match.id);
    console.log(chalk.green(`  Role activated: ${match.name} (${match.id})`));
  } else {
    // Maybe they typed a role ID
    const byId = numberedRoles.find((r) => r.id === answer.toLowerCase());
    if (byId) {
      ctx.setRole(byId.id);
      console.log(chalk.green(`  Role activated: ${byId.name} (${byId.id})`));
    } else {
      console.log(chalk.yellow(`  Invalid selection: "${answer}"`));
    }
  }
  console.log();
}

// Simple edit distance for typo suggestions
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

function findClosestRoles(
  input: string,
  roles: Array<{ id: string; name: string }>,
  maxResults: number,
): Array<{ id: string; name: string }> {
  const scored = roles.map((r) => ({
    ...r,
    dist: Math.min(editDistance(input, r.id), editDistance(input, r.name.toLowerCase())),
  }));

  scored.sort((a, b) => a.dist - b.dist);

  // Only return if reasonably close (distance < half the input length + 3)
  const threshold = Math.floor(input.length / 2) + 3;
  return scored.filter((s) => s.dist <= threshold).slice(0, maxResults);
}

// Export for use in REPL tab completion
export function getRoleCompletions(registry: RoleRegistry, partial: string): string[] {
  const lower = partial.toLowerCase();
  return registry.getAll()
    .map((r) => r.id)
    .filter((id) => id.startsWith(lower))
    .sort();
}
