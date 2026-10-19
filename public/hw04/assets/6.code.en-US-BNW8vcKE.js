var e=`### Key code

<strong>Key point 1: Build clickable quiz cards</strong>

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

<aside class="course-callout course-callout--key-point" role="note">Quiz mode is more pedagogical than "showing the right answer"—let students make the mistake first, then reveal the answer.</aside>
`;export{e as default};