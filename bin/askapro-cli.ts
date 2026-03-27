// Suppress punycode deprecation warning from transitive dependencies
process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name === 'DeprecationWarning' && w.message.includes('punycode')) return;
  console.warn(w);
});

import { parseArgs } from '../src/cli/args.js';
import { startRepl } from '../src/cli/repl.js';

const args = parseArgs();
startRepl(args).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
