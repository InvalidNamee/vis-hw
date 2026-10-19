var e=`### 你的原案例

本章采用中国石油大学（华东）2025 级新生数据，阐述数据的特性。为了防止数据隐私泄露，数据采用 <strong>DeepSeek 大模型生成</strong>。数据文件 \`data/newstudent.csv\`，含 80 条记录。

### 嵌入理论：AI 合成数据的可信度边界

<strong>数据质量四维度</strong>（Wang & Strong 1996）：准确性 / 完整性 / 一致性 / 时效性。

DeepSeek 生成数据：

-   完整性：字段齐全
-   准确性：姓名/籍贯是虚构的，不能用作真实人口分析
-   采样偏差：模型倾向"看起来合理"的分布（如民族偏汉族、籍贯偏大城市）

<aside class="course-callout course-callout--note" role="note"><strong>课堂要点</strong>：教学场景使用合成数据没问题，但必须标注"合成数据"，避免学生误以为真实分布。</aside>
`;export{e as default};