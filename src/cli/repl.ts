import * as readline from 'node:readline';
import { Conversation } from '../agent/conversation.js';
import { agentLoop } from '../agent/loop.js';
import { buildSystemPrompt } from '../agent/system-prompt.js';
import { createToolRegistry } from '../tools/registry.js';
import { handleCommand, getRoleCompletions } from './commands.js';
import { renderWelcome, renderPrompt, renderError, renderToolCall, renderInfo } from './renderer.js';
import { RoleRegistry } from '../roles/registry.js';
import type { CliArgs } from './args.js';
import { loadSettings, saveSettings } from '../config/settings.js';
import { ensureGlobalDirs } from '../config/paths.js';
import { DEFAULT_MODEL, fetchModels, getModel } from '../llm/models.js';
import { loadConfig } from '../config/loader.js';
import chalk from 'chalk';

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function runOnboarding(rl: readline.Interface): Promise<void> {
  console.log();
  console.log(chalk.bold.green('  Welcome to askapro!'));
  console.log(chalk.dim('  AI-powered document analysis with 85+ expert consultation roles'));
  console.log();
  console.log(chalk.bold('  Let\'s set you up. You\'ll need an OpenAI API key.'));
  console.log(chalk.dim('  Get one at: https://platform.openai.com/api-keys'));
  console.log();

  const apiKey = await askQuestion(rl, chalk.cyan('  Enter your OpenAI API key: '));

  if (!apiKey) {
    console.log(chalk.yellow('\n  No API key entered. You can set it later:'));
    console.log(chalk.dim('    export OPENAI_API_KEY="sk-..."'));
    console.log(chalk.dim('    or: askapro --api-key "sk-..."'));
    console.log();
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    console.log(chalk.yellow('\n  Warning: API key usually starts with "sk-". Saving anyway.'));
  }

  saveSettings({ apiKey });
  console.log(chalk.green('  API key saved to ~/.askapro/settings.json'));
  console.log();
}

async function selectModel(rl: readline.Interface): Promise<string> {
  console.log();
  console.log(chalk.bold('  Welcome! Fetching available models from OpenAI...'));

  let modelList;
  try {
    modelList = await fetchModels();
  } catch {
    console.log(chalk.yellow('  Could not fetch models. Using default.'));
    saveSettings({ model: DEFAULT_MODEL });
    return DEFAULT_MODEL;
  }

  // Show top models grouped by tier for selection
  const recommended = modelList.filter((m) => m.tier === 'flagship' || m.tier === 'fast' || m.tier === 'nano' || m.tier === 'reasoning').slice(0, 10);

  console.log();
  const defaultIdx = recommended.findIndex((m) => m.id === DEFAULT_MODEL);

  for (let i = 0; i < recommended.length; i++) {
    const m = recommended[i];
    const isDefault = m.id === DEFAULT_MODEL;
    const prefix = isDefault ? chalk.green(`  ${i + 1}. `) : chalk.dim(`  ${i + 1}. `);
    const name = isDefault ? chalk.bold(m.name) : m.name;
    const tier = chalk.dim(` [${m.tier}]`);
    const def = isDefault ? chalk.green(' [default]') : '';
    console.log(`${prefix}${name}${tier}${def}`);
  }

  console.log();
  console.log(chalk.dim(`  (${modelList.length} models total — type a model ID for any other)`));
  const answer = await askQuestion(rl, chalk.cyan(`  Your choice [${(defaultIdx >= 0 ? defaultIdx : 0) + 1}]: `));

  // Check if numeric selection
  const idx = parseInt(answer, 10) - 1;
  if (idx >= 0 && idx < recommended.length) {
    const selected = recommended[idx].id;
    saveSettings({ model: selected });
    console.log(chalk.green(`  Model set: ${recommended[idx].name}`));
    console.log(chalk.dim('  Change anytime with /model'));
    console.log();
    return selected;
  }

  // Check if typed a model ID directly
  if (answer && modelList.some((m) => m.id === answer)) {
    saveSettings({ model: answer });
    console.log(chalk.green(`  Model set: ${answer}`));
    console.log();
    return answer;
  }

  // Default
  saveSettings({ model: DEFAULT_MODEL });
  const defaultInfo = getModel(DEFAULT_MODEL);
  console.log(chalk.green(`  Using default: ${defaultInfo.name}`));
  console.log();
  return DEFAULT_MODEL;
}

function getProjectModel(): string | null {
  const config = loadConfig();
  if (!config.projectInstructions) return null;

  // Parse model from project OPENAI.md
  const match = config.projectInstructions.match(/^-\s*(?:model|modell|default):\s*(\S+)/im);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export async function startRepl(args: CliArgs): Promise<void> {
  ensureGlobalDirs();

  if (args.apiKey) {
    saveSettings({ apiKey: args.apiKey });
  }

  let settings = loadSettings();

  // Onboarding: First-time setup (interactive only)
  const isFirstRun = !settings.apiKey && !process.env.OPENAI_API_KEY && !args.apiKey;
  const needsModelSelection = !settings.model || settings.model === 'gpt-4o';

  if (!args.print && (isFirstRun || needsModelSelection)) {
    const setupRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    if (isFirstRun) {
      await runOnboarding(setupRl);
      settings = loadSettings();
    }

    if (needsModelSelection && !args.model) {
      await selectModel(setupRl);
      settings = loadSettings();
    }

    setupRl.close();
  }

  const toolRegistry = await createToolRegistry();

  // Model selection priority: CLI arg > project OPENAI.md > saved setting > default
  let model: string;

  if (args.model && args.model !== 'gpt-4o') {
    model = args.model;
  } else {
    const projectModel = getProjectModel();
    if (projectModel) {
      model = projectModel;
    } else if (settings.model && settings.model !== 'gpt-4o') {
      model = settings.model;
    } else {
      model = DEFAULT_MODEL;
    }
  }

  const conversation = new Conversation(model);
  const roleRegistry = new RoleRegistry();
  let activeRole: string | null = args.role || null;

  // Validate --role flag
  if (activeRole && !roleRegistry.get(activeRole)) {
    console.error(chalk.red(`  Unknown role: "${activeRole}"`));
    console.error(chalk.dim(`  Use askapro --help or /roles to see available roles.`));
    process.exit(1);
  }

  const getRoleContent = (roleId: string | null): string | undefined => {
    if (!roleId) return undefined;
    const role = roleRegistry.get(roleId);
    return role?.content;
  };

  conversation.setSystemPrompt(buildSystemPrompt(activeRole || undefined, getRoleContent(activeRole)));

  // askQuestion will be bound to the REPL readline after it's created
  let replRl: readline.Interface | null = null;

  const commandCtx = {
    conversation,
    roleRegistry,
    askQuestion: (prompt: string): Promise<string> => {
      if (!replRl) return Promise.resolve('');
      return new Promise((resolve) => {
        replRl!.question(prompt, (answer) => resolve(answer.trim()));
      });
    },
    setModel: (m: string) => {
      conversation.model = m;
      saveSettings({ model: m });
    },
    setRole: (r: string | null) => {
      activeRole = r;
      conversation.setSystemPrompt(buildSystemPrompt(activeRole || undefined, getRoleContent(activeRole)));
    },
  };

  // Non-interactive mode
  if (args.print) {
    conversation.addUserMessage(args.print);
    try {
      await agentLoop(conversation, toolRegistry, {
        onText: (text) => process.stdout.write(text),
      });
      console.log();
    } catch (err) {
      renderError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
    return;
  }

  // Interactive REPL
  renderWelcome();
  renderInfo(`Model: ${getModel(model).name}`);
  if (activeRole) renderInfo(`Role: ${activeRole}`);
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: renderPrompt(),
    terminal: true,
    completer: (line: string): [string[], string] => {
      if (line.startsWith('/role ')) {
        const partial = line.slice(6);
        const matches = getRoleCompletions(roleRegistry, partial);
        return [matches.map((m) => `/role ${m}`), line];
      }
      if (line.startsWith('/')) {
        const commands = ['/help', '/roles', '/role ', '/model ', '/clear', '/exit'];
        const matches = commands.filter((c) => c.startsWith(line));
        return [matches, line];
      }
      return [[], line];
    },
  });

  replRl = rl;

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Handle exit/quit without slash
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log(chalk.dim('\n  Goodbye!\n'));
      process.exit(0);
    }

    if (input.startsWith('/')) {
      await handleCommand(input, commandCtx);
      rl.prompt();
      return;
    }

    conversation.addUserMessage(input);

    try {
      console.log();
      await agentLoop(conversation, toolRegistry, {
        onText: (text) => process.stdout.write(text),
        onToolStart: (name) => renderToolCall(name),
      });
      console.log('\n');
    } catch (err) {
      renderError(err instanceof Error ? err.message : String(err));
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n');
    process.exit(0);
  });
}
