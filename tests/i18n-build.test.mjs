// Run after npm run build: node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
const homeworkCount = Number(readFileSync(new URL('../src/config/homework.ts', import.meta.url), 'utf8').match(/length:\s*(\d+)/)[1]);
const read = path => readFileSync(new URL(`../dist/${path}index.html`, import.meta.url), 'utf8');

test('all pages have matching language routes and localized navigation', () => {
  for (const path of ['', 'about/', ...Array.from({ length: homeworkCount }, (_, i) => `hw${String(i + 1).padStart(2, '0')}/`).filter(path => path !== 'hw04/')]) {
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
        const nav = html.match(/<nav class="navigation-homework"[\s\S]*?<\/nav>/)?.[0];
        assert.ok(nav);
        assert.equal([...nav.matchAll(/href="\/en\/hw\d+\/"/g)].length, homeworkCount);
      }
      assert.doesNotMatch(html, /class="site-header"/);
      assert.match(html, /popovertarget="site-navigation"/);
      assert.match(html, /id="site-navigation"[^>]*popover="auto"/);
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

test('hw04 ships the independent Vue course and shares homework navigation labels', () => {
  const course = read('hw04/');
  assert.match(course, /id="app"/);
  assert.match(course, /\/hw04\/assets\//);
  assert.doesNotMatch(course, /popovertarget="site-navigation"/);
  assert.equal(existsSync(new URL('../public/hw04/old/', import.meta.url)), false);
  assert.equal(existsSync(new URL('../dist/hw04/old/', import.meta.url)), false);
  assert.match(read('en/hw04/'), /\/hw04\/#\/\?lang=en/);
  const navigation = JSON.parse(readFileSync(new URL('../dist/site-navigation.json', import.meta.url), 'utf8'));
  assert.equal(navigation.length, homeworkCount);
  assert.equal(navigation.find(item => item.id === 'hw04').titleEn, 'Course Website Redesign');
});


test('hw04 directory routes preserve every shipped HTML entry', () => {
  const archive = new URL('../public/hw04/', import.meta.url);
  const entries = readdirSync(archive, { recursive: true }).filter(path => path === 'index.html' || path.endsWith('/index.html'));
  assert.ok(entries.length > 1, 'Course should contain legacy chapter and demo entries');
  for (const path of entries) {
    const original = readFileSync(new URL(path, archive), 'utf8');
    const rendered = readFileSync(new URL(`../dist/hw04/${path}`, import.meta.url), 'utf8');
    assert.equal(rendered.trim(), original.trim(), `Course entry changed: ${path}`);
  }
});
