var e=`### ★ Key Code

★ <strong>Key Point 1: the 16-case lookup table (core data structure)</strong>

\`\`\`javascript
//  16 种 case 每种对应 0/1/2 条线段（用边的编号表示）
// 边编号：0=左中, 1=下中, 2=右中, 3=上中
const EDGE_TABLE = [
  [],                  // 0000 全小
  [[3, 0]],            // 0001 仅 BL 大
  [[0, 1]],            // 0010 仅 BR 大
  [[3, 1]],            // 0011 BL+BR
  [[1, 2]],            // 0100 仅 TR 大
  [[3, 0], [1, 2]],    // 0101（saddle 鞍点，需）
  [[0, 2]],            // 0110 BR+TR
  [[3, 2]],            // 0111
  [[2, 3]],            // 1000 仅 TL 大
  [[2, 0]],            // 1001 TL+BL
  [[0, 1], [2, 3]],    // 1010（saddle）
  [[2, 1]],
  [[1, 3]],
  [[1, 0]],
  [[0, 3]],
  []                   // 1111 全大
];
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">★ <strong>The saddle case (5 and 10) is the only ambiguous situation in Marching Squares that requires “checking the center value”</strong> — the other 14 cases are resolved with a simple lookup. For saddle cases, compare the cell center to the threshold to decide how to connect the line segments.</aside>

★ <strong>Key Point 2: assemble the case index with bitwise operations</strong>

\`\`\`javascript
// 4 个角是否 > 阈值 → 4 位二进制 → case 编号
let code = 0;
if (bl > threshold) code |= 1;   // bit 0
if (br > threshold) code |= 2;   // bit 1
if (tr > threshold) code |= 4;   // bit 2
if (tl > threshold) code |= 8;   // bit 3

const lines = EDGE_TABLE[code];   // 查表
\`\`\`
`;export{e as default};