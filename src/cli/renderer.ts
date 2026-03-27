import chalk from 'chalk';

export function renderWelcome(): void {
  console.log();
  console.log(chalk.bold.green('  askpro') + chalk.dim(' — Fachexperten-Dokumenten-Agent'));
  console.log(chalk.dim('  65+ Experten-Rollen | Dokumentenanalyse | Professionelle Ausgaben'));
  console.log();
  console.log(chalk.dim('  Befehle: /help, /roles, /docs, /export, /model, /clear'));
  console.log(chalk.dim('  Beenden: Ctrl+C oder /exit'));
  console.log();
}

export function renderRoleActivation(roleName: string): void {
  console.log(chalk.cyan(`  [${roleName} aktiviert]`));
}

export function renderToolCall(toolName: string): void {
  process.stdout.write(chalk.dim(`  [Tool: ${toolName}] `));
}

export function renderToolResult(toolName: string, truncated: boolean): void {
  if (truncated) {
    console.log(chalk.dim('(gekuerzt)'));
  } else {
    console.log(chalk.dim('OK'));
  }
}

export function renderError(message: string): void {
  console.error(chalk.red(`\n  Fehler: ${message}\n`));
}

export function renderDisclaimer(): void {
  console.log(
    chalk.dim.italic(
      '\n  Hinweis: Diese Analyse wurde KI-gestuetzt erstellt und ersetzt keine\n' +
      '  professionelle Beratung. Alle Angaben ohne Gewaehr.\n'
    )
  );
}

export function renderInfo(message: string): void {
  console.log(chalk.blue(`  ${message}`));
}

export function renderPrompt(): string {
  return chalk.green('askpro') + chalk.dim(' > ');
}
