#!/usr/bin/env node
import { render } from 'ink';
import { App } from './ui/app.js';
import { scenario, stages } from './application/design-simulator.js';
import { plainScreen } from './ui/presentation.js';
import type { Stage } from './domain/model.js';
import { runProduction, productionHelp } from './production-cli.js';
import { errorMessage } from './domain/catalogue.js';

const args = process.argv.slice(2);
const snapshotIndex = args.indexOf('--snapshot');
if (args.includes('--help')) {
  console.log(productionHelp);
} else if (snapshotIndex >= 0) {
  const stage = args[snapshotIndex + 1] as Stage;
  if (!stages.includes(stage)) { console.error(`Choose a state: ${stages.join(', ')}`); process.exitCode = 1; }
  else console.log(plainScreen(scenario(stage, args.includes('--empty'))));
} else if (args.includes('--demo') && process.stdin.isTTY) {
  render(<App empty={args.includes('--empty')} />, { exitOnCtrlC: true });
} else {
  await runProduction(args).catch(error => { console.error(errorMessage(error)); process.exitCode = 1; });
}
