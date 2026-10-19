var e=`\`\`\`javascript
// utils/data.js
const fieldConfig = {\r
  '姓名': 'name',\r
  '性别': 'gender',\r
  '班级': 'cls',\r
  '生源省份': 'province',\r
  '政治面貌': 'pol_status',\r
  '民族': 'ethnicity',\r
  '年龄': 'age',\r
  '序号': 'id',\r
  '生日': 'birthday',\r
  '班号': 'clsNum',\r
  '专业': 'major'\r
};\r
const fieldChinese = {\r
  'name': '姓名',\r
  'gender': '性别',\r
  'cls': '班级',\r
  'province': '生源省份',\r
  'pol_status': '政治面貌',\r
  'ethnicity': '民族',\r
  'age': '年龄',\r
  'id': '序号',\r
  'birthday': '生日',\r
  'clsNum': '班号',\r
  'major': '专业'\r
};\r
async function loadCSV() {\r
  try {\r
    const newstudent = await d3.csv("./newstudent.csv", function (d) {//本质上是在定义一个函数,d为参数\r
      return {\r
        id: +d.序号,\r
        name: d.姓名,\r
        gender: d.性别,\r
        age: +d.年龄,// 使用 "+" 运算符将字符串转换为数字\r
        cls: d.班级,\r
        province: d.生源省份,\r
        pol_status: d.政治面貌,\r
        ethnicity: d.民族,\r
        // 如果需要转换日期，可以使用 d3.timeParse\r
        birthday: d3.timeParse("%Y-%m-%d")(d.生日)\r
      };\r
    });\r
    return newstudent;\r
  } catch (error) {\r
    console.error("加载CSV文件失败:", error);\r
  }\r
}\r
\r
function addSplitColumns(students) {\r
  students.forEach(student => {\r
    if (student.cls) {\r
      // 添加新列\r
      const parts = student.cls.split(/(\\d+班)/).filter(Boolean);\r
      if (parts.length >= 2) {\r
        student.major = parts[0];\r
        student.clsNum = parts[1]; // 使用不同列名避免冲突\r
      } else {\r
        student.major = student.cls;\r
        student.clsNum = '';\r
      }\r
    }\r
  });\r
  return students;\r
}\r
\r
function filterArray(data, term, searchFields = null) {\r
  if (!term) {\r
    return data; // 如果搜索词为空，直接返回原数据\r
  }\r
  const searchTerm = String(term).toLowerCase();\r
  \r
  const filteredData = data.filter(row => {\r
    // 如果未指定 searchFields，则搜索所有字段（保持原逻辑）\r
    const fieldsToSearch = searchFields || Object.keys(row);\r
\r
    return fieldsToSearch.some(field => {\r
      const value = row[field];\r
      return String(value).toLowerCase().includes(searchTerm);\r
    });\r
  });\r
\r
  return filteredData;\r
}\r
\r
function groupOnMajorCls(data) {\r
  try {\r
    const countByGroup = d3.rollup(data,\r
      v => v.length,\r
      d => d.major,\r
      d => d.clsNum // 使用拆分后的clsNum而不是原始cls\r
    );\r
\r
    console.log("分组结果:", countByGroup);\r
    return countByGroup;\r
  } catch (error) {\r
    console.error("分组失败:", error);\r
    return new Map();\r
  }\r
}\r
\r
function mapToTreeStructure(mapData, rootName = "青岛软件学院") {\r
  const root = { name: rootName, children: [] };\r
\r
  for (const [major, classes] of mapData) {\r
    const majorNode = { name: major, children: [] };\r
\r
    for (const [className, count] of classes) {\r
      majorNode.children.push({\r
        name: className,\r
        value: count\r
      });\r
    }\r
\r
    root.children.push(majorNode);\r
  }\r
\r
  return root;\r
}\r
\r
async function load() {\r
  try {\r
    const students = await loadCSV();\r
    console.log("数据加载完成:", students);\r
\r
    // 后续处理\r
    return groupOnMajorCls(addSplitColumns(students));\r
  } catch (error) {\r
    console.error("处理失败:", error);\r
  }\r
}
\`\`\`

\`\`\`javascript
// utils/scatter.js
\r
function setupChart(cfg) {\r
    // const margin = { top: 40, right: 100, bottom: 60, left: 200 };\r
    // const width = 800 - margin.left - margin.right;\r
    // const height = 600 - margin.top - margin.bottom;\r
    // 创建SVG元素\r
    cfg.svg = d3.select(cfg.chartid)\r
        .append("svg")\r
        .attr("width", cfg.width)\r
        .attr("height", cfg.height)\r
        .append("g")\r
        .attr("transform", \`translate(\${cfg.margin.left},\${cfg.margin.top})\`);\r
    cfg.width -= (cfg.margin.left + cfg.margin.right);\r
    cfg.height -= (cfg.margin.top + cfg.margin.bottom);\r
}\r
\r
function setupScale(data, cfg) {\r
    // 创建比例尺\r
    cfg.x = d3.scaleLinear()// 线性变换\r
        .domain([d3.min(data, d => d[cfg.key_col]) - 0.1,\r
        d3.max(data, d => d[cfg.key_col]) + 0.1])\r
        .range([0, cfg.width]);\r
\r
    cfg.y = d3.scaleBand()// 类别型映射\r
        .domain(data.map(d => d[cfg.index_col]))\r
        .range([0, cfg.height])\r
        .padding(0.2);\r
\r
    // 添加X轴\r
    cfg.svg.append("g")\r
        .attr("transform", \`translate(0,\${cfg.height})\`)\r
        .call(d3.axisBottom(cfg.x).ticks(10))\r
        .append("text")\r
        .attr("class", "axis-label")\r
        .attr("x", cfg.width / 2)\r
        .attr("y", 40)\r
        .attr("fill", "#000")\r
        .text(cfg.x_title);\r
\r
    // 添加Y轴\r
    cfg.svg.append("g")\r
        .call(d3.axisLeft(cfg.y))\r
        .append("text")\r
        .attr("class", "axis-label")\r
        .attr("transform", "rotate(-90)")\r
        .attr("y", -50)\r
        .attr("x", -cfg.height / 2)\r
        .attr("fill", "#000")\r
        .text(cfg.y_title);\r
}\r
\r
function createScatter(data, cfg) {\r
    // 添加散点\r
    const scatter = cfg.svg.selectAll(".dot")\r
        .data(data)\r
        .enter()\r
        .append("circle")\r
        .attr("class", "dot")\r
        .attr("cx", d => cfg.x(d[cfg.key_col]))\r
        .attr("cy", d => cfg.y(d[cfg.index_col]) + cfg.y.bandwidth() / 2)\r
        .attr("r", 8)\r
        .attr("fill", d => d[cfg.key_col] >= 0 ? "#1f77b4" : "#ff7f0e");\r
    return scatter;\r
}\r
function tooltip(scatter) {\r
    // 创建工具提示\r
    const tooltip = d3.select("body").append("div")\r
        .attr("class", "tooltip")\r
        .style("opacity", 0);\r
\r
    scatter.on("mouseover", function (event, d) {\r
        tooltip.transition()\r
            .duration(200)\r
            .style("opacity", .9);\r
        tooltip.html(\`<strong>\${cfg.y_title} : \${d[cfg.index_col]}</strong><br/>\r
                    \${cfg.x_title} : \${(d[cfg.key_col] * 100).toFixed(1)}%<br/>\`)\r
            .style("left", (event.pageX + 10) + "px")\r
            .style("top", (event.pageY - 28) + "px");\r
    })\r
        .on("mouseout", function () {\r
            tooltip.transition()\r
                .duration(500)\r
                .style("opacity", 0);\r
        });\r
}\r
\r
function curveRegression(data, cfg) {\r
    // 计算曲线拟合点（使用局部加权回归）\r
    const xValues = data.map((d, i) => i);\r
    const yValues = data.map(d => d[cfg.key_col]);\r
\r
\r
    // 使用二次多项式拟合\r
    const Xs = interceptX(xValues, yValues);\r
    const fitPoints = d3.zip(\r
        Xs.map(x => cfg.x(x)),\r
        data.map(d => cfg.y(d[cfg.index_col]) + cfg.y.bandwidth() / 2)\r
    );\r
\r
    // 绘制曲线拟合线\r
    cfg.svg.append("path")\r
        .attr("class", "fit-line")\r
        .attr("d", d3.line().curve(d3.curveCatmullRom.alpha(0.5))(fitPoints));\r
\r
    // 添加拟合线说明\r
    cfg.svg.append("text")\r
        .attr("x", cfg.width - 150)\r
        .attr("y", 40)\r
        .attr("fill", "#ff7f0e")\r
        .text("局部加权回归拟合");\r
}\r
function interceptX(xValues, yValues) {\r
    const Xs = [];\r
    const bandwidth = 2; // 控制曲线平滑度的参数\r
\r
    for (let i = 0; i < xValues.length; i++) {\r
        const weights = xValues.map((x) => Math.exp(-Math.pow((x - i) / bandwidth, 2) / 2));\r
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumW = 0;\r
\r
        for (let j = 0; j < xValues.length; j++) {\r
            const w = weights[j];\r
            sumX += w * xValues[j];\r
            sumY += w * yValues[j];\r
            sumXY += w * xValues[j] * yValues[j];\r
            sumX2 += w * xValues[j] * xValues[j];\r
            sumW += w;\r
        }\r
\r
        const slope = (sumW * sumXY - sumX * sumY) / (sumW * sumX2 - sumX * sumX);\r
        const intercept = (sumY - slope * sumX) / sumW;\r
\r
        // fitPoints.push([cfg.x(slope * i + intercept), cfg.y(data[i][cfg.index_col]) + cfg.y.bandwidth() / 2]);\r
        Xs.push(slope * i + intercept);\r
    }\r
    return Xs;\r
}\r
\r
async function renderScatter(data) {\r
    cfg = await d3.json("utils/scatterConfig.json");\r
    // 设置图表尺寸和边距\r
    setupChart(cfg);\r
    setupScale(data, cfg);\r
    const scatter = createScatter(data, cfg);\r
    tooltip(scatter);\r
    curveRegression(data, cfg);\r
}
\`\`\`

\`\`\`javascript
// 启动渲染
    main();
    // 测试树渲染
    async function main() {
        try {
            const data = await await d3.csv("data/1985CrimeGender.csv", function (d) {//本质上是在定义一个函数,d为参数
                return { crimeType:d.犯罪类型, male: +d.男性, female: +d.女性};
            });
            data.forEach(rec => {
                rec.genderDiffRatio = (rec.male-rec.female)/(rec.male+rec.female);
            });
            data.sort((a, b) => b.genderDiffRatio - a.genderDiffRatio);//排序
            renderScatter(data,"#chart");
        } catch (error) {
            console.error("渲染失败:", error);
            d3.select("#tree-container").html(\`<div style="color:red">加载失败: \${error.message}</div>\`);
        }
    }
\`\`\`
`;export{e as default};