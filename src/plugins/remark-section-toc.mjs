/** Collect chapter headings, excluding all content inside HomeworkTabs. */
export default function remarkSectionToc() {
  return (tree, file) => {
    const toc = [];
    let index = 0;
    const text = node => node.type === 'text' || node.type === 'inlineCode'
      ? node.value : (node.children || []).map(text).join('');
    const visit = (node, insideTabs = false) => {
      const excluded = insideTabs || node.name === 'HomeworkTabs' || node.name === 'TabsContent';
      if (node.type === 'heading' && !excluded && (node.depth === 2 || node.depth === 3)) {
        // Namespace and ordinal keep duplicate/non-Latin titles safe and deterministic.
        const id = `chapter-section-${++index}`;
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, id };
        toc.push({ depth: node.depth, text: text(node), id });
      }
      for (const child of node.children || []) visit(child, excluded);
    };
    visit(tree);
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.toc = toc;
  };
}
