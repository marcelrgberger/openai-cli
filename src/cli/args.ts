import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface CliArgs {
  model: string;
  role?: string;
  dir?: string;
  print?: string;
  apiKey?: string;
  verbose: boolean;
}

export function parseArgs(): CliArgs {
  const argv = yargs(hideBin(process.argv))
    .scriptName('askapro')
    .usage('$0 [options]')
    .option('model', {
      alias: 'm',
      type: 'string',
      default: 'gpt-4o',
      describe: 'OpenAI model to use (gpt-4o, gpt-4o-mini, o3, o4-mini)',
    })
    .option('role', {
      alias: 'r',
      type: 'string',
      describe: 'Activate a specific expert role (e.g., steuerberater, fachanwalt-arbeitsrecht)',
    })
    .option('dir', {
      alias: 'd',
      type: 'string',
      describe: 'Directory of documents to ingest on startup',
    })
    .option('print', {
      alias: 'p',
      type: 'string',
      describe: 'Non-interactive mode: process query and print result to stdout',
    })
    .option('api-key', {
      type: 'string',
      describe: 'OpenAI API key (overrides env var and settings)',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      describe: 'Enable verbose/debug output',
    })
    .help()
    .alias('help', 'h')
    .version()
    .parseSync();

  return {
    model: argv.model,
    role: argv.role,
    dir: argv.dir,
    print: argv.print,
    apiKey: argv['api-key'] as string | undefined,
    verbose: argv.verbose,
  };
}
