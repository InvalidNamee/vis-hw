/** Keep the independently maintained Vue course under the homework site's /hw04/. */
import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(process.env.HW04_SOURCE_DIR || resolve(root, '../cinger-vis-rebuild'));
const prebuilt = process.env.HW04_DIST_DIR && resolve(process.env.HW04_DIST_DIR);
const output = resolve(root, 'public/hw04');
const build = prebuilt || resolve(source, 'dist');

if (!prebuilt) {
  if (!existsSync(resolve(source, 'package.json'))) {
    throw new Error('HW04 source is missing. Place cinger-vis-rebuild beside vis-hw, set HW04_SOURCE_DIR, or supply HW04_DIST_DIR with a complete course build.');
  }
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: source,
    stdio: 'inherit',
    env: { ...process.env, VITE_BASE_PATH: '/hw04/' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Validate before replacing the previous working copy.
await readFile(resolve(build, 'index.html'));
if (build === output || build.startsWith(`${output}/`) || output.startsWith(`${build}/`)) {
  throw new Error('HW04_DIST_DIR must not overlap public/hw04.');
}
await mkdir(dirname(output), { recursive: true });
await rm(output, { recursive: true, force: true });
await cp(build, output, { recursive: true });
console.log('HW04 course staged at public/hw04/');
