var e=`### Where This Sits: View Rendering + User Interaction

Following the <strong>2.3 visual mapping</strong>, we now have a “visual structure.” Section <strong>2.4</strong> covers the last two arrows: <strong>“visual structure → view” (rendering)</strong> and <strong>“view user” (interaction feedback)</strong>. Card's V layer and van Wijk's feedback loop both land here.

### Your Original Case

The original document used \`classed\` to control node styles and \`stopPropagation\` to block bubbling. The focus is on <strong>turning the D3 tree layout output into an interactive HTML list</strong>.

### Embedded Theory: The Three Phases of DOM Events + Event Delegation

The browser's event flow has three phases (per the DOM spec):

1.  <strong>Capturing:</strong> window → document → ... → target element (outside to inside)
2.  <strong>Target:</strong> the target element itself
3.  <strong>Bubbling:</strong> target element → ... → document → window (inside to outside)

By default, listeners are registered on the bubbling phase. Inside a listener you can call \`e.stopPropagation()\` to cut off bubbling so ancestor listeners no longer fire.

### Theory Patch: Animation — the “time dimension” of view rendering

<strong>Animation (transition)</strong> isn't “fancy” — it's the <em>time dimension</em> of view rendering. In D3 you use \`.transition().duration(ms)\` to smoothly interpolate an attribute from its old value to a new one. The pedagogical value lies in the single \`duration\` parameter:

-   \`duration=0\`: instant jump — you can't “see the change happen”
-   \`duration=500\`: a 0.5\xA0s transition — you see the expand / collapse / move smoothly
-   \`duration>1500\`: too slow — students start to drift

<strong>This lesson's interactive demo</strong> adds a <strong>duration slider</strong> so you can change this parameter live and see “how rendering unfolds over time.” It's the most direct lesson on “view rendering + interaction feedback.”

### Theory Patch: Event Delegation

<strong>Problem</strong>: if a list has 1000 \`li\` elements and you bind a click listener to each → it's slow, memory-heavy, and newly added elements have to be re-bound.

<strong>Solution</strong>: bind only 1 click listener on the parent element (\`ul\` / \`div\`) and lean on bubbling — a click on any child eventually triggers the parent's listener. Use \`e.target.closest('.label')\` to figure out “which child element was actually clicked.”

<strong>Advantage</strong>: 1 listener replaces N, and any future newly added elements are automatically supported.

### Key API: D3 \`classed()\`

\`\`\`javascript
selection.classed("selected", true);          // 1) 添加 class
selection.classed("selected", false);         // 2) 移除 class
selection.classed("selected", d => d.id === pickId); // 3) 函数式批量切换
\`\`\`
`;export{e as default};