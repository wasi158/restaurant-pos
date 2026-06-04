/**
 * Removes release folders before a Windows installer build.
 * Close the app and stop `npm run electron:dev` first if delete fails.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const dir of ['release', 'release-build']) {
  const target = path.join(root, dir);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${dir}/`);
  }
}
