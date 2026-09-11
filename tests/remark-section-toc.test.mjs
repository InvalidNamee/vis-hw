import test from 'node:test';
import assert from 'node:assert/strict';
import plugin from '../src/plugins/remark-section-toc.mjs';
const heading = (depth, value) => ({ type: 'heading', depth, children: [{ type: 'text', value }] });
test('collects external h2/h3 and excludes nested tab content', () => {
  const first = heading(2, '相同标题');
  const second = heading(3, '相同标题');
  const tree = { children: [heading(1, 'Title'), first, { name: 'HomeworkTabs', children: [heading(2, 'hidden'), { children: [heading(3, 'nested')] }] }, second, heading(4, 'ignored')] };
  const file = { data: { astro: { frontmatter: { title: 'Keep' } } } };
  plugin()(tree, file);
  assert.deepEqual(file.data.astro.frontmatter.toc, [
    { depth: 2, text: '相同标题', id: 'chapter-section-1' },
    { depth: 3, text: '相同标题', id: 'chapter-section-2' },
  ]);
  assert.equal(first.data.hProperties.id, 'chapter-section-1');
  assert.equal(file.data.astro.frontmatter.title, 'Keep');
});
test('empty chapter and inline code titles', () => {
  const file = { data: {} }; plugin()({ children: [] }, file);
  assert.deepEqual(file.data.astro.frontmatter.toc, []);
  plugin()({ children: [{ type: 'heading', depth: 2, children: [{ type: 'inlineCode', value: 'Grid' }] }] }, file);
  assert.equal(file.data.astro.frontmatter.toc[0].text, 'Grid');
});
