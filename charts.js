// Charts.js - graceful version with null checks
(function() {
try {
// Load chart data and initialize all charts
fetch('chart_data.json')
    .then(res => res.json())
    .then(data => {
        initCandlestickChart(data.portfolio);
        initGaugeChart(data.portfolio);
        initWaterfallChart(data.cashflow);
        initSankeyChart(data.sankey);
        initGanttChart(data.sprint_goals);
        initHeatmapChart(data.performance_calendar);
    })
    .catch(err => console.error('Error loading chart data:', err));

// Chart 5: Candlestick Chart (Monthly OHLC + Volume)
function initCandlestickChart(data) {
    const ctx = document.getElementById('candlestickChart');
    if (!ctx) { return; }
    const monthlyData = data.monthly_ohlc;
    
    // Calculate moving averages
    const ma20 = [];
    for (let i = 0; i < monthlyData.length; i++) {
        const start = Math.max(0, i - 2);
        const subset = monthlyData.slice(start, i + 1);
        const avg = subset.reduce((sum, d) => sum + d.close, 0) / subset.length;
        ma20.push(avg);
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [
                {
                    label: 'Low-High Range',
                    data: monthlyData.map(d => [d.low, d.high]),
                    backgroundColor: monthlyData.map(d => 
                        d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'
                    ),
                    borderColor: monthlyData.map(d => 
                        d.close >= d.open ? '#22c55e' : '#ef4444'
                    ),
                    borderWidth: 2,
                    barThickness: 20
                },
                {
                    label: '3-Month MA',
                    type: 'line',
                    data: ma20,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    display: true,
                    labels: { color: '#e5e5e5' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const d = monthlyData[context.dataIndex];
                            if (context.datasetIndex === 0) {
                                return [
                                    `Open: $${(d.open/1000).toFixed(0)}K`,
                                    `High: $${(d.high/1000).toFixed(0)}K`,
                                    `Low: $${(d.low/1000).toFixed(0)}K`,
                                    `Close: $${(d.close/1000).toFixed(0)}K`,
                                    `Volume: $${d.volume}`
                                ];
                            }
                            return `MA: $${(context.parsed.y/1000).toFixed(0)}K`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { 
                        color: '#737373',
                        callback: v => `$${(v/1000).toFixed(0)}K`
                    },
                    grid: { color: '#2a2a2a' }
                },
                x: {
                    ticks: { color: '#737373' },
                    grid: { display: false }
                }
            }
        }
    });
}

// Chart 6: Gauge Chart (Progress to $1M)
function initGaugeChart(data) {
    const ctx = document.getElementById('gaugeChart');
    if (!ctx) { console.log('gaugeChart canvas not found, skipping'); return; }
    const percentage = (data.current_value / data.target) * 100;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Progress', 'Remaining'],
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [
                    percentage < 40 ? '#ef4444' :
                    percentage < 70 ? '#eab308' :
                    '#22c55e',
                    '#2a2a2a'
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            if (context.dataIndex === 0) {
                                return `$${(data.current_value/1000).toFixed(0)}K of $${(data.target/1000).toFixed(0)}K (${percentage.toFixed(1)}%)`;
                            }
                            return `$${((data.target - data.current_value)/1000).toFixed(0)}K remaining`;
                        }
                    }
                }
            }
        }
    });
}

// Chart 7: Waterfall Chart (Monthly Cash Flow)
function initWaterfallChart(data) {
    const ctx = document.getElementById('waterfallChart');
    if (!ctx) { return; }
    const categories = data.monthly.map(d => d.category);
    const amounts = data.monthly.map(d => d.amount);
    
    // Calculate running totals for waterfall
    let runningTotal = 0;
    const barData = amounts.map((amt, i) => {
        const start = runningTotal;
        runningTotal += amt;
        return {
            x: i,
            y: [start, runningTotal],
            amt: amt
        };
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Cash Flow',
                data: barData.map(d => [d.y[0], d.y[1]]),
                backgroundColor: barData.map(d => {
                    const amt = d.amt;
                    if (amt > 0) return 'rgba(34,197,94,0.6)';
                    if (amt < 0) return 'rgba(239,68,68,0.6)';
                    return 'rgba(59,130,246,0.6)';
                }),
                borderColor: barData.map(d => {
                    const amt = d.amt;
                    if (amt > 0) return '#22c55e';
                    if (amt < 0) return '#ef4444';
                    return '#3b82f6';
                }),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const amt = amounts[context.dataIndex];
                            return `${amt > 0 ? '+' : ''}$${(amt/1000).toFixed(1)}K`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: '#737373',
                        callback: v => `$${(v/1000).toFixed(0)}K`
                    },
                    grid: { color: '#2a2a2a' }
                },
                y: {
                    ticks: { color: '#737373' },
                    grid: { display: false }
                }
            }
        }
    });
}

// Chart 8: Sankey Diagram (Money Flow)
function initSankeyChart(data) {
    const container = document.getElementById('sankeyChart');
    if (!container || typeof d3.sankey !== 'function') { console.log('Sankey: missing container or d3-sankey plugin'); return; }
    const width = container.clientWidth;
    const height = 400;
    
    const svg = d3.select('#sankeyChart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);
    
    const {nodes, links} = sankey({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d))
    });
    
    // Color scale
    const color = d3.scaleOrdinal()
        .domain(['Income', 'Expenses', 'Deploy', 'Investments', 'Growth'])
        .range(['#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#eab308']);
    
    // Draw links
    svg.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', d => {
            const sourceName = d.source.name;
            if (sourceName.includes('Income')) return color('Income');
            if (sourceName.includes('Expenses')) return color('Expenses');
            if (sourceName === 'Deploy Fund') return color('Deploy');
            return color('Investments');
        })
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('fill', 'none')
        .append('title')
        .text(d => `${d.source.name} â†’ ${d.target.name}: $${(d.value/1000).toFixed(1)}K`);
    
    // Draw nodes
    svg.append('g')
        .selectAll('rect')
        .data(nodes)
        .join('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => {
            if (d.name.includes('Income')) return color('Income');
            if (d.name.includes('Expenses')) return color('Expenses');
            if (d.name.includes('Deploy')) return color('Deploy');
            if (d.name.includes('Growth')) return color('Growth');
            return color('Investments');
        })
        .attr('stroke', '#0f0f0f')
        .append('title')
        .text(d => `${d.name}: $${(d.value/1000).toFixed(1)}K`);
    
    // Draw labels
    svg.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
        .attr('font-size', 11)
        .attr('fill', '#e5e5e5')
        .text(d => d.name);
}

// Chart 9: Gantt Chart (Sprint Goals Timeline)
function initGanttChart(data) {
    const container = document.getElementById('ganttChart');
    if (!container) { return; }
    const width = container.clientWidth;
    if (!width || width <= 0) { return; }
    const height = 300;
    
    const svg = d3.select('#ganttChart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const margin = {top: 20, right: 100, bottom: 30, left: 200};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    data.forEach(d => {
        d.startDate = parseDate(d.start);
        d.endDate = parseDate(d.end);
    });
    
    const today = new Date();
    const minDate = d3.min(data, d => d.startDate);
    const maxDate = d3.max(data, d => d.endDate);
    
    // Scales
    const x = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, innerWidth]);
    
    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, innerHeight])
        .padding(0.2);
    
    // Color by status
    const colorMap = {
        'not_started': '#737373',
        'in_progress': '#3b82f6',
        'completed': '#22c55e'
    };
    
    // Draw bars
    g.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', d => x(d.startDate))
        .attr('y', d => y(d.name))
        .attr('width', d => x(d.endDate) - x(d.startDate))
        .attr('height', y.bandwidth())
        .attr('fill', d => colorMap[d.status])
        .attr('stroke', '#0f0f0f')
        .attr('stroke-width', 1)
        .attr('rx', 3);
    
    // Today marker
    g.append('line')
        .attr('x1', x(today))
        .attr('x2', x(today))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#eab308')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');
    
    // Axes
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(6))
        .attr('color', '#737373');
    
    g.append('g')
        .call(d3.axisLeft(y))
        .attr('color', '#737373');
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 90}, 20)`);
    
    ['Today'].forEach((label, i) => {
        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', i * 20)
            .attr('y2', i * 20)
            .attr('stroke', '#eab308')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4');
        
        legend.append('text')
            .attr('x', 25)
            .attr('y', i * 20)
            .attr('dy', '0.35em')
            .attr('fill', '#e5e5e5')
            .attr('font-size', 11)
            .text(label);
    });
}

// Chart 10: Heatmap (Performance Calendar)
function initHeatmapChart(data) {
    const container = document.getElementById('heatmapChart');
    if (!container) { return; }
    const width = container.clientWidth;
    if (!width || width <= 0) { return; }
    const height = 300;
    
    const svg = d3.select('#heatmapChart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create 30-day grid (4 weeks + 2 days)
    const days = [];
    for (let i = 0; i < 30; i++) {
        const week = Math.floor(i / 7);
        const dayOfWeek = i % 7;
        days.push({
            week: week,
            day: dayOfWeek,
            value: data.daily_returns[i]
        });
    }
    
    const cellWidth = innerWidth / 5;
    const cellHeight = innerHeight / 7;
    
    // Color scale
    const colorScale = d3.scaleSequential()
        .domain([-0.5, 1])
        .interpolator(d3.interpolateRdYlGn);
    
    // Draw cells
    g.selectAll('rect')
        .data(days)
        .join('rect')
        .attr('x', d => d.week * cellWidth)
        .attr('y', d => d.day * cellHeight)
        .attr('width', cellWidth - 2)
        .attr('height', cellHeight - 2)
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#0f0f0f')
        .attr('rx', 3)
        .append('title')
        .text(d => `Day ${days.indexOf(d) + 1}: ${d.value > 0 ? '+' : ''}${d.value.toFixed(1)}%`);
    
    // Week labels
    const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    g.selectAll('.week-label')
        .data(weekLabels)
        .join('text')
        .attr('class', 'week-label')
        .attr('x', (d, i) => i * cellWidth + cellWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#737373')
        .attr('font-size', 11)
        .text(d => d);
    
    // Day labels
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    g.selectAll('.day-label')
        .data(dayLabels)
        .join('text')
        .attr('class', 'day-label')
        .attr('x', -5)
        .attr('y', (d, i) => i * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dy', '0.35em')
        .attr('fill', '#737373')
        .attr('font-size', 11)
        .text(d => d);
}

} catch(e) {
  console.warn('[charts.js] Non-fatal error:', e.message);
}
})();

