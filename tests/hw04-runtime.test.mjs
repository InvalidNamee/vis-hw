import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'hw04-build-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'scripts'));
  copyFileSync(new URL('../scripts/hw04-runtime.mjs', import.meta.url), join(root, 'scripts/hw04-runtime.mjs'));
  const env = { ...process.env };
  delete env.HW04_SOURCE_DIR;
  delete env.HW04_DIST_DIR;
  return {
    root,
    run: (overrides = {}) => spawnSync(process.execPath, ['scripts/hw04-runtime.mjs'], {
      cwd: root, env: { ...env, ...overrides }, encoding: 'utf8',
    }),
    write(path, content) {
      const target = join(root, path);
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, content);
    },
  };
}

test('cloud build consumes committed snapshot without the course repository', t => {
  const f = fixture(t);
  f.write('public/hw04/index.html', '<html>course snapshot</html>');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no external source required/);
  assert.equal(readFileSync(join(f.root, 'public/hw04/index.html'), 'utf8'), '<html>course snapshot</html>');
});

test('missing committed course fails with an actionable message', t => {
  const f = fixture(t);
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /npm run sync:hw04/);
});

test('explicit prebuilt sync replaces stale assets and removed archive', t => {
  const f = fixture(t);
  f.write('public/hw04/old/index.html', 'stale archive');
  f.write('public/hw04/assets/stale.js', 'old chunk');
  f.write('prebuilt/index.html', '<html>new course</html>');
  f.write('prebuilt/assets/new.js', 'new chunk');
  const result = f.run({ HW04_DIST_DIR: join(f.root, 'prebuilt') });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(f.root, 'public/hw04/old')), false);
  assert.equal(existsSync(join(f.root, 'public/hw04/assets/stale.js')), false);
  assert.equal(readFileSync(join(f.root, 'public/hw04/assets/new.js'), 'utf8'), 'new chunk');
});
