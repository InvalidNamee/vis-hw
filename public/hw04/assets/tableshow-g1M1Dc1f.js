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
// utils/table.js
function formatShow(value) {\r
    if (value instanceof Date)\r
        return d3.timeFormat("%Y年%m月%d日")(value);\r
    else\r
        return value;\r
}\r
// 渲染表格函数\r
function renderTable(data, containerID) {\r
    const table = d3.select(containerID);\r
\r
    // 清空现有表格内容\r
    table.html("");\r
    const headers = Object.keys(data[0]);\r
    // 添加表头\r
    table.append("thead").append("tr")\r
        .selectAll("th")\r
        .data(headers)\r
        .enter()\r
        .append("th")\r
        .text(d => fieldChinese[d] )\r
        .on("click", function (_, column) {\r
            sortTable(data, column);\r
        });\r
    // 添加表格主体\r
    const tbody = table.append("tbody");\r
    const rows = tbody.selectAll("tr")\r
        .data(data)\r
        .enter()\r
        .append("tr");\r
    // 添加单元格\r
    rows.selectAll("td")\r
        //.data(row => headers.map(column => formatShow(row[column])))\r
        .data(row => Object.values(row).map(v => formatShow(v)))\r
        .enter()\r
        .append("td")\r
        .text(d => d);\r
    // 更新统计信息\r
    updateStats(data.length);\r
}\r
// 当前排序状态\r
let sortState = {\r
    column: null,\r
    direction: 'asc'\r
};\r
// 排序函数\r
function sortTable(data, column) {\r
    if (sortState.column === column) {\r
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';\r
    } else {\r
        sortState.column = column;\r
        sortState.direction = 'asc';\r
    }\r
\r
    data.sort((a, b) => {\r
        let valueA = a[column];\r
        let valueB = b[column];\r
\r
        // 处理数字排序\r
        if (!isNaN(valueA) && !isNaN(valueB)) {\r
            valueA = Number(valueA);\r
            valueB = Number(valueB);\r
        }\r
\r
        if (valueA < valueB) return sortState.direction === 'asc' ? -1 : 1;\r
        if (valueA > valueB) return sortState.direction === 'asc' ? 1 : -1;\r
        return 0;\r
    });\r
\r
    renderTable(data, "#data-table");\r
    updateSortIndicator(column);\r
}\r
\r
// 更新排序指示器\r
function updateSortIndicator(column) {\r
    d3.selectAll("th").each(function () {\r
        const th = d3.select(this);\r
        const thColumn = th.datum();\r
        th.select(".sort-icon").remove();\r
\r
        if (thColumn === column) {\r
            th.append("span")\r
                .attr("class", "sort-icon")\r
                .text(sortState.direction === 'asc' ? ' ↑' : ' ↓');\r
        }\r
    });\r
}\r
// 更新统计信息（可选）\r
function updateStats(count) {\r
    d3.select(".stats").text(\`显示 \${count} 条记录，共 \${count} 条记录\`);\r
}\r

\`\`\`

\`\`\`javascript
// 启动渲染
        main();
        // 测试树渲染
        async function main() {
            try {
                const students = await loadCSV();
                renderTable(students,"#data-table");
            } catch (error) {
                console.error("渲染失败:", error);
                d3.select("#tree-container").html(\`<div style="color:red">加载失败: \${error.message}</div>\`);
            }
        }
\`\`\`
`;export{e as default};