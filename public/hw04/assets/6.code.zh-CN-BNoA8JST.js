var e=`### 关键代码

<strong>关键点 1：构建可点击的 quiz 卡片</strong>

\`\`\`javascript
// 4 张 SVG 卡片，点哪张就高亮 + 显示原因
cases.forEach((c, i) => {
  const card = document.createElement('div');
  card.className = 'quiz-card';
  card.innerHTML = \`\${makeSampleBars(c.palette)}<div>\${c.name}</div>\`;
  card.addEventListener('click', () => {
    cards.forEach((cc, ii) => {
      cc.classList.remove('correct', 'wrong');
      if (ii === i) cc.classList.add(c.type);  // 'correct' or 'wrong'
    });
    showResult(c);
  });
  grid.appendChild(card);
});
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">quiz 模式比"展示正确"更适合教学——让学生先犯错再揭示答案。</aside>
`;export{e as default};