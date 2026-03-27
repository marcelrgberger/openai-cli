import chalk from 'chalk';

export function renderWelcome(): void {
  console.log();
  console.log(chalk.bold.green('  askpro') + chalk.dim(' — Ask a Pro. Expert Document Agent.'));
  console.log(chalk.dim('  85+ Expert Roles | Document Analysis | Professional Outputs'));
  console.log();
  console.log(chalk.dim('  Commands: /help, /roles, /docs, /export, /model, /clear'));
  console.log(chalk.dim('  Quit: Ctrl+C or /exit'));
  console.log();
}

export function renderRoleActivation(roleName: string): void {
  console.log(chalk.cyan(`  [${roleName} activated]`));
}

export function renderToolCall(toolName: string): void {
  process.stdout.write(chalk.dim(`  [Tool: ${toolName}] `));
}

export function renderToolResult(toolName: string, truncated: boolean): void {
  if (truncated) {
    console.log(chalk.dim('(truncated)'));
  } else {
    console.log(chalk.dim('OK'));
  }
}

export function renderError(message: string): void {
  console.error(chalk.red(`\n  Error: ${message}\n`));
}

export function renderDisclaimer(): void {
  console.log(
    chalk.dim.italic(
      '\n  Note: This analysis was AI-assisted and does not replace\n' +
      '  professional consultation. All information without warranty.\n'
    )
  );
}

export function renderInfo(message: string): void {
  console.log(chalk.blue(`  ${message}`));
}

export function renderPrompt(): string {
  return chalk.green('askpro') + chalk.dim(' > ');
}
