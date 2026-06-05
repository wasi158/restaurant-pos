/**
 * Clears release output before electron-builder runs.
 * On Windows, stops the packaged app if it is still running (common app.asar lock).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function sleep(ms) {
  return setTimeout(ms);
}
const isWin = process.platform === 'win32';

function stopPackagedApp() {
  if (!isWin) return;
  const names = ['Restaurant POS.exe', 'restaurant-pos.exe'];
  for (const name of names) {
    try {
      execSync(`taskkill /F /IM "${name}" /T`, { stdio: 'ignore' });
      console.log(`Stopped ${name}`);
    } catch {
      /* not running */
    }
  }
}

async function rmWithRetry(target, attempts = 5) {
  if (!fs.existsSync(target)) return;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
      console.log(`Removed ${path.relative(root, target)}/`);
      return;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const wait = 400 * (i + 1);
        console.warn(`Retrying delete in ${wait}ms… (${err.code ?? err.message})`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

stopPackagedApp();

for (const dir of ['release', 'release-build']) {
  await rmWithRetry(path.join(root, dir));
}

console.log('Release folder ready for build.');
