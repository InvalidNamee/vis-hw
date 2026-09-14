// Run after npm run build: node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = path => readFileSync(new URL(`../dist/${path}index.html`, import.meta.url), 'utf8');

test('all pages have matching language routes and localized navigation', () => {
  for (const path of ['', 'about/', ...Array.from({ length: 9 }, (_, i) => `hw${String(i + 1).padStart(2, '0')}/`)]) {
    for (const prefix of ['', 'en/']) {
      const html = read(prefix + path);
      assert.match(html, new RegExp(`<html lang="${prefix ? 'en' : 'zh-CN'}"`));
      for (const target of ['', 'en/']) assert.ok(html.includes(`href="/${target}${path}" lang=`), `Missing language link: ${prefix}${path}`);
      for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
        if (href.endsWith('/')) assert.ok(existsSync(new URL(`../dist${href}index.html`, import.meta.url)), href);
      }
      if (prefix) {
        const visible = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '').replaceAll('中文', '');
        assert.doesNotMatch(visible, /\p{Script=Han}/u, path);
        const nav = html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0];
        assert.ok(nav);
        assert.equal([...nav.matchAll(/href="\/en\/hw\d+\/"/g)].length, 9);
      }
    }
  }
});

test('hw01 translations preserve sections, examples, demos, and English copy controls', () => {
  const zh = read('hw01/');
  const en = read('en/hw01/');
  const ids = html => [...html.matchAll(/id="(chapter-section-\d+)"/g)].map(match => match[1]);
  assert.deepEqual(ids(en), ids(zh));
  assert.equal(ids(en).length, 10);
  for (const tag of ['box-model-demo', 'flow-demo', 'grid-demo', 'flex-demo', 'layout-demo']) assert.ok(en.includes(`<${tag}`));
  assert.equal((en.match(/class="homework-tabs"/g) || []).length, 5);
  assert.match(en, /Copy to clipboard/);
});
