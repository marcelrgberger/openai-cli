import chalk from 'chalk';

/**
 * Render markdown text for terminal output.
 * Converts markdown formatting to chalk-styled terminal text.
 */
export function renderMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      // Headers
      if (line.match(/^#{1,3}\s/)) {
        const content = line.replace(/^#{1,3}\s+/, '');
        return chalk.bold(content);
      }

      // Bold + italic
      line = line.replace(/\*\*\*(.+?)\*\*\*/g, (_, t) => chalk.bold.italic(t));
      // Bold
      line = line.replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t));
      // Italic
      line = line.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, (_, t) => chalk.italic(t));
      // Inline code
      line = line.replace(/`([^`]+)`/g, (_, t) => chalk.cyan(t));
      // Strikethrough
      line = line.replace(/~~(.+?)~~/g, (_, t) => chalk.strikethrough(t));

      return line;
    })
    .join('\n');
}

// Role-specific thinking animations
const ROLE_ANIMATIONS: Record<string, string[]> = {
  // Legal
  'default-legal': ['  Reviewing case law...', '  Checking statutes...', '  Analyzing precedents...', '  Preparing legal opinion...'],
  'fachanwalt-arbeitsrecht': ['  Reviewing employment law...', '  Checking termination clauses...', '  Analyzing labor regulations...'],
  'fachanwalt-mietrecht': ['  Reviewing tenancy law...', '  Checking rental regulations...', '  Analyzing lease terms...'],
  'fachanwalt-familienrecht': ['  Reviewing family law...', '  Checking custody regulations...', '  Analyzing matrimonial provisions...'],
  'fachanwalt-strafrecht': ['  Reviewing criminal code...', '  Checking case details...', '  Analyzing defense options...'],
  // Finance
  'steuerberater': ['  Reviewing tax regulations...', '  Checking deductions...', '  Calculating tax implications...'],
  'finanzberater': ['  Analyzing investment options...', '  Reviewing market data...', '  Calculating projections...'],
  'buchhalter': ['  Reviewing accounts...', '  Checking bookings...', '  Balancing entries...'],
  // Medical
  'allgemeinmediziner': ['  Reviewing symptoms...', '  Checking medical history...', '  Considering differential diagnosis...'],
  'psychologe': ['  Reflecting on your situation...', '  Considering therapeutic approaches...', '  Reviewing assessment criteria...'],
  'kardiologe': ['  Reviewing cardiac indicators...', '  Analyzing symptoms...', '  Checking risk factors...'],
  // Real Estate
  'immobilienmakler': ['  Analyzing property data...', '  Reviewing market conditions...', '  Checking comparable sales...'],
  'architekt': ['  Reviewing building plans...', '  Checking regulations...', '  Analyzing structural requirements...'],
  // Insurance
  'versicherungsberater': ['  Reviewing insurance options...', '  Comparing coverage plans...', '  Analyzing risk profile...'],
  // Business
  'unternehmensberater': ['  Analyzing business model...', '  Reviewing market strategy...', '  Evaluating options...'],
  'gruendungsberater': ['  Reviewing startup requirements...', '  Checking legal forms...', '  Analyzing business plan...'],
  // Meta
  'triage': ['  Analyzing your request...', '  Identifying relevant experts...', '  Routing to specialist...'],
  'panel': ['  Consulting multiple experts...', '  Cross-referencing perspectives...', '  Synthesizing opinions...'],
};

const DEFAULT_ANIMATION = ['  Thinking...', '  Analyzing...', '  Considering...', '  Preparing response...'];

export class ThinkingAnimation {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frameIndex = 0;
  private frames: string[];
  private startTime = 0;

  constructor(role?: string | null) {
    // Pick role-specific or category-based animation
    if (role && ROLE_ANIMATIONS[role]) {
      this.frames = ROLE_ANIMATIONS[role];
    } else if (role) {
      // Try to match by category prefix
      const category = role.startsWith('fachanwalt-') ? 'default-legal' : undefined;
      this.frames = (category && ROLE_ANIMATIONS[category]) || DEFAULT_ANIMATION;
    } else {
      this.frames = DEFAULT_ANIMATION;
    }
  }

  start(): void {
    this.startTime = Date.now();
    this.frameIndex = 0;
    this.render();
    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.render();
    }, 2000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Clear the animation line
    process.stdout.write('\r\x1b[K');
  }

  private render(): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(0);
    const frame = this.frames[this.frameIndex];
    process.stdout.write(`\r\x1b[K${chalk.dim(frame)} ${chalk.dim.italic(`(${elapsed}s)`)}`);
  }
}

export function renderWelcome(): void {
  console.log();
  console.log(chalk.bold.green('  askapro') + chalk.dim(' — Ask a Pro. Expert Document Agent.'));
  console.log(chalk.dim('  85+ Expert Roles | Document Analysis | Professional Outputs'));
  console.log();
  console.log(chalk.dim('  Commands: /help, /roles, /docs, /export, /model, /copy, /clear'));
  console.log(chalk.dim('  Quit: Ctrl+C or /exit'));
  console.log();
  console.log(
    chalk.dim.italic(
      '  Note: AI-assisted analysis — does not replace professional consultation.\n'
    )
  );
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

export function renderInfo(message: string): void {
  console.log(chalk.blue(`  ${message}`));
}

export function renderPrompt(): string {
  return chalk.green('askapro') + chalk.dim(' > ');
}
