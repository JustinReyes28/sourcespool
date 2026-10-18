// Explicit developer wrapper; never invoked by npm install.
import { installTools } from '../dist/adapters/tool-setup.js';
const args = process.argv.slice(2);
const cacheIndex = args.indexOf('--tool-cache');
if (!args.includes('--download-tools') && cacheIndex < 0) {
  console.error('Use npm run tools:install -- --tool-cache <folder> to reuse downloads, or --download-tools for an explicit ~133 MB transfer. Build first.');
  process.exitCode = 1;
} else {
  await installTools({ ...(cacheIndex >= 0 ? { sourceDirectory: args[cacheIndex + 1] } : {}), allowDownload: args.includes('--download-tools'), progress: console.log }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
