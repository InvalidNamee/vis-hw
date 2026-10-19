var e=`\`\`\`javascript
// 数据配置
        const data = [
            { value: 2025, color: "#4e79a7", label: "男性" },
            { value: 1280, color: "#e15759", label: "女性" }
        ];

        // 图表尺寸
        const svgWidth = 400;
        const svgHeight = 80;
        const barHeight = 50;
        const spacing = 0; // 条形间距为0，实现紧邻效果

        // 计算比例尺
        const totalValue = data[0].value + data[1].value;
        const scale = d3.scaleLinear()
            .domain([0, totalValue])
            .range([0, svgWidth]);

        // 创建SVG
        const svg = d3.select("#gender-chart")
            .attr("viewBox", \`0 0 \${svgWidth} \${svgHeight}\`);

        // 计算条形位置
        let currentX = 0;

        // 绘制条形
        data.forEach((item, index) => {
            const barWidth = scale(item.value);
            
            // 绘制矩形条
            svg.append("rect")
                .attr("x", currentX)
                .attr("y", (svgHeight - barHeight) / 2)
                .attr("width", barWidth)
                .attr("height", barHeight)
                .attr("fill", item.color)
                .attr("rx", 4)
                .attr("ry", 4);
            
            // 添加数值标签
            svg.append("text")
                .attr("class", "value-label")
                .attr("x", currentX + barWidth / 2)
                .attr("y", svgHeight / 2)
                .text(item.value);
            
            currentX += barWidth + spacing;
        });

        // 添加总数显示
        svg.append("text")
            .attr("x", svgWidth / 2)
            .attr("y", svgHeight - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#666")
            .text(\`总计: \${totalValue.toLocaleString()}\`);
\`\`\`
`;export{e as default};