import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import tailwindcss from '@tailwindcss/vite';
import remarkSectionToc from './src/plugins/remark-section-toc.mjs';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  markdown: { processor: unified({ remarkPlugins: [remarkSectionToc] }) },
  integrations: [
    expressiveCode({
      themes: ['github-light'],
      defaultLocale: 'zh-CN',
      styleOverrides: {
        borderRadius: '0.5rem', codeFontSize: '0.875rem',
        codePaddingInline: '1rem', codePaddingBlock: '0.75rem',
      },
    }),
    mdx(),
  ],
  vite: { plugins: [tailwindcss()] },
});
