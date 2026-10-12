#!/usr/bin/env node
import { render } from 'ink';
import { App } from './ui/app.js';
import { scenario, stages } from './application/design-simulator.js';
import { plainScreen } from './ui/presentation.js';
import type { Stage } from './domain/model.js';

const args = process.argv.slice(2);
const snapshotIndex = args.indexOf('--snapshot');
if (args.includes('--help')) {
  console.log('SourceSpool design scaffold\n\n--demo                 Interactive local fixture walkthrough\n--empty                Start with an empty example collection\n--snapshot <state>     Print a workflow sketch\n--help                 Show this help\n\nNo downloads or persistent media catalogue in phase 2.');
} else if (snapshotIndex >= 0) {
  const stage = args[snapshotIndex + 1] as Stage;
  if (!stages.includes(stage)) { console.error(`Choose a state: ${stages.join(', ')}`); process.exitCode = 1; }
  else console.log(plainScreen(scenario(stage, args.includes('--empty'))));
} else if (args.includes('--demo') && process.stdin.isTTY) {
  render(<App empty={args.includes('--empty')} />, { exitOnCtrlC: true });
} else {
  console.log('SourceSpool is a phase 2 design prototype. Run in a terminal with --demo, or use --snapshot home.');
}
