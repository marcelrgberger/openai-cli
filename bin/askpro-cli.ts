import { parseArgs } from '../src/cli/args.js';
import { startRepl } from '../src/cli/repl.js';

const args = parseArgs();
startRepl(args).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
