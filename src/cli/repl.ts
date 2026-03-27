import * as readline from 'node:readline';
import { Conversation } from '../agent/conversation.js';
import { agentLoop } from '../agent/loop.js';
import { buildSystemPrompt } from '../agent/system-prompt.js';
import { createToolRegistry } from '../tools/registry.js';
import { handleCommand } from './commands.js';
import { renderWelcome, renderPrompt, renderError, renderToolCall } from './renderer.js';
import type { CliArgs } from './args.js';
import { loadSettings, saveSettings } from '../config/settings.js';
import { ensureGlobalDirs } from '../config/paths.js';

export async function startRepl(args: CliArgs): Promise<void> {
  ensureGlobalDirs();

  if (args.apiKey) {
    saveSettings({ apiKey: args.apiKey });
  }

  const settings = loadSettings();
  const model = args.model || settings.model;
  const conversation = new Conversation(model);
  const toolRegistry = await createToolRegistry();

  let activeRole: string | null = args.role || null;

  conversation.setSystemPrompt(buildSystemPrompt(activeRole || undefined));

  const commandCtx = {
    conversation,
    setModel: (m: string) => {
      conversation.model = m;
    },
    setRole: (r: string | null) => {
      activeRole = r;
      conversation.setSystemPrompt(buildSystemPrompt(activeRole || undefined));
    },
  };

  // Non-interactive mode
  if (args.print) {
    conversation.addUserMessage(args.print);
    try {
      const result = await agentLoop(conversation, toolRegistry, {
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

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: renderPrompt(),
    terminal: true,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input.startsWith('/')) {
      handleCommand(input, commandCtx);
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
