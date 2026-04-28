/**
 * wealth_charts_init.js - Initializes Advanced Analytics charts in Wealth tab
 * Uses real data from window.PORTFOLIO_DATA (portfolio-data.js)
 * Called after DOM ready + data loaded
 */
(function() {
  'use strict';

  function fmt$(v) {
    if (!v && v !== 0) return '$0';
    if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
    if (v >= 1000) return '$' + (v/1000).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }

  function initWealthCharts() {
    var pd = window.PORTFOLIO_DATA || {};
    if (!pd.positions && pd.thesis && pd.thesis.positions) pd.positions = pd.thesis.positions;
    var positions = pd.positions || [];
    var thesis = (pd.thesis && pd.thesis.thesis_themes) || {};
    var liquid = pd.liquid_net_worth || 403833;
    var target = pd.target_net_worth || 1000000;

    // ── 1. Portfolio Treemap (D3) ─────────────────────────────────────────
    var treemapEl = document.getElementById('chart-treemap');
    if (treemapEl && window.d3 && positions.length > 0) {
      try {
        treemapEl.innerHTML = '';
        var w = treemapEl.clientWidth || 380, h = 380;
        var svg = d3.select(treemapEl).append('svg')
          .attr('width', w).attr('height', h);

        // Group by theme
        var themeData = Object.entries(thesis).map(function(kv) {
          return { name: kv[0], value: kv[1].value || 0, color: kv[1].color || '#888', pct: kv[1].pct || 0 };
        }).filter(function(d) { return d.value > 100; });

        if (themeData.length === 0) {
          // Fall back to individual positions
          themeData = positions.slice(0, 12).map(function(p) {
            return { name: p.ticker, value: p.value || 0, color: '#3b82f6', pct: p.pct_portfolio || 0 };
          });
        }

        var total = themeData.reduce(function(s, d) { return s + d.value; }, 0);
        var root = d3.hierarchy({ children: themeData }).sum(function(d) { return d.value; });
        d3.treemap().size([w, h]).padding(2)(root);

        root.leaves().forEach(function(leaf) {
          var d = leaf.data;
          var lw = leaf.x1 - leaf.x0, lh = leaf.y1 - leaf.y0;
          if (lw < 5 || lh < 5) return;
          var g = svg.append('g').attr('transform', 'translate(' + leaf.x0 + ',' + leaf.y0 + ')');
          g.append('rect').attr('width', lw).attr('height', lh)
            .attr('fill', d.color || '#3b82f6').attr('opacity', 0.75).attr('rx', 4);
          if (lw > 50 && lh > 30) {
            g.append('text').attr('x', 6).attr('y', 16).attr('fill', '#fff')
              .attr('font-size', '11px').attr('font-weight', '700').text(d.name.length > 16 ? d.name.slice(0,16)+'…' : d.name);
            if (lh > 44) {
              g.append('text').attr('x', 6).attr('y', 30).attr('fill', 'rgba(255,255,255,0.75)')
                .attr('font-size', '10px').text(fmt$(d.value) + ' (' + (d.pct||Math.round(d.value/total*100)) + '%)');
            }
          }
        });
      } catch(e) {
        treemapEl.innerHTML = '<div style="padding:20px;color:var(--muted);font-size:12px">Treemap unavailable: ' + e.message + '</div>';
      }
    } else if (treemapEl && positions.length === 0) {
      treemapEl.innerHTML = '<div style="padding:20px;color:var(--muted);font-size:13px;text-align:center">No position data loaded</div>';
    }

    // ── 2. Wealth History Sparkline ───────────────────────────────────────
    var sparkEl = document.getElementById('chart-sparkline');
    if (sparkEl && window.Chart) {
      try {
        sparkEl.innerHTML = '';
        var sparkCanvas = document.createElement('canvas');
        sparkEl.appendChild(sparkCanvas);
        var whData = window.WEALTH_HISTORY_DATA || {};
        var snapshots = whData.snapshots || [];

        // Build sparkline data — use snapshots or build from current + projected
        var labels, values;
        if (snapshots.length > 1) {
          labels = snapshots.map(function(s) { return s.date || ''; });
          values = snapshots.map(function(s) { return s.liquid_nw || s.total_nw || 0; });
        } else {
          // Generate 12-month projection from current
          var now = new Date();
          labels = []; values = [];
          var cur = liquid;
          for (var i = -3; i <= 9; i++) {
            var d = new Date(now); d.setMonth(d.getMonth() + i);
            labels.push(d.toLocaleDateString('en-US', {month:'short', year:'2-digit'}));
            values.push(Math.round(cur + i * 4167));
          }
        }

        new Chart(sparkCanvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#3b82f6'
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: {
              callbacks: { label: function(ctx) { return fmt$(ctx.raw); } }
            }},
            scales: {
              x: { ticks: { color: '#888', font: { size: 10 } }, grid: { display: false } },
              y: { ticks: { color: '#888', font: { size: 10 }, callback: function(v) { return fmt$(v); } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      } catch(e) {
        console.log('Sparkline error:', e.message);
      }
    }

    // ── 3. Progress to $1M Gauge ──────────────────────────────────────────
    var gaugeEl = document.getElementById('chart-gauge');
    if (gaugeEl && window.Chart) {
      try {
        gaugeEl.innerHTML = '';
        var gaugeCanvas = document.createElement('canvas');
        gaugeEl.appendChild(gaugeCanvas);
        var pct = Math.min(100, (liquid / target) * 100);
        new Chart(gaugeCanvas, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [pct, 100 - pct],
              backgroundColor: ['#3b82f6', 'rgba(255,255,255,0.06)'],
              borderWidth: 0,
              circumference: 180,
              rotation: -90
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            },
            cutout: '72%'
          },
          plugins: [{
            id: 'gaugeLabel',
            afterDraw: function(chart) {
              var ctx2 = chart.ctx;
              var cx = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
              var cy = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) * 0.85;
              ctx2.save();
              ctx2.fillStyle = '#e5e5e5';
              ctx2.font = 'bold 22px system-ui';
              ctx2.textAlign = 'center';
              ctx2.fillText(pct.toFixed(1) + '%', cx, cy);
              ctx2.font = '12px system-ui';
              ctx2.fillStyle = '#888';
              ctx2.fillText(fmt$(liquid) + ' of ' + fmt$(target), cx, cy + 18);
              ctx2.restore();
            }
          }]
        });
      } catch(e) { console.log('Gauge error:', e.message); }
    }

    // ── 4. Monthly Net Worth Waterfall ────────────────────────────────────
    var waterfallEl = document.getElementById('chart-waterfall');
    if (waterfallEl && window.Chart) {
      try {
        waterfallEl.innerHTML = '';
        var wfCanvas = document.createElement('canvas');
        waterfallEl.appendChild(wfCanvas);
        var dm = window.DEPLOY_MONITOR_DATA || {};
        var hist = dm.history || [];
        var months = hist.length > 0 ? hist.map(function(h) { return h.month || h.date || ''; }) : ['Apr 2026'];
        var amounts = hist.length > 0 ? hist.map(function(h) { return h.amount || h.deployed || 0; }) : [3583];
        new Chart(wfCanvas, {
          type: 'bar',
          data: {
            labels: months,
            datasets: [{
              label: 'Monthly Deploy',
              data: amounts,
              backgroundColor: 'rgba(34,197,94,0.6)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: {
              callbacks: { label: function(ctx) { return fmt$(ctx.raw); } }
            }},
            scales: {
              x: { ticks: { color: '#888' }, grid: { display: false } },
              y: { ticks: { color: '#888', callback: function(v) { return fmt$(v); } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      } catch(e) { console.log('Waterfall error:', e.message); }
    }

    // ── 5. Allocation vs Target Radar ─────────────────────────────────────
    var radarEl = document.getElementById('chart-radar');
    if (!radarEl) radarEl = document.getElementById('chart-allocation-radar');
    if (radarEl && window.Chart) {
      try {
        radarEl.innerHTML = '';
        var radarCanvas = document.createElement('canvas');
        radarEl.appendChild(radarCanvas);
        // Use thesis themes vs target allocation
        var themePct = Object.entries(thesis).map(function(kv) { return Math.min(50, kv[1].pct || 0); });
        var themeNames = Object.keys(thesis);
        // Target allocation
        var targets = themeNames.map(function(n) {
          if (n.includes('EV')) return 30;
          if (n.includes('Nuclear')) return 15;
          if (n.includes('AI')) return 25;
          if (n.includes('Income')) return 20;
          return 5;
        });
        new Chart(radarCanvas, {
          type: 'radar',
          data: {
            labels: themeNames.map(function(n) { return n.length > 18 ? n.slice(0,18)+'…' : n; }),
            datasets: [
              { label: 'Current', data: themePct, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', pointBackgroundColor: '#3b82f6' },
              { label: 'Target', data: targets, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.10)', pointBackgroundColor: '#22c55e', borderDash: [4,4] }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#e5e5e5', font: { size: 11 } } }, tooltip: {
              callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + ctx.raw + '%'; } }
            }},
            scales: { r: { ticks: { color: '#888', backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.08)' }, pointLabels: { color: '#e5e5e5', font: { size: 10 } } } }
          }
        });
      } catch(e) { console.log('Radar error:', e.message); }
    }

    // ── 6. Cash Flow Sankey (D3 text fallback) ────────────────────────────
    var sankeyEl = document.getElementById('chart-sankey');
    if (sankeyEl) {
      try {
        var pi = pd.passive_income || {};
        var sources = pi.sources || [];
        var totalMonthly = pi.total_monthly || 521;
        var html = '<div style="padding:16px">';
        html += '<div style="font-size:13px;color:var(--muted);margin-bottom:12px">Monthly Cash Flow Breakdown</div>';
        html += '<div style="display:flex;flex-direction:column;gap:6px">';
        sources.forEach(function(s) {
          var pct = totalMonthly > 0 ? Math.min(100, (s.monthly_income / totalMonthly) * 100) : 0;
          var color = s.type === 'hysa' ? '#eab308' : '#3b82f6';
          html += '<div>';
          html += '<div style="display:flex;justify-content:space-between;margin-bottom:3px">';
          html += '<span style="font-size:12px;color:var(--text)">' + (s.name || s.source) + '</span>';
          html += '<span style="font-size:12px;font-weight:700;color:' + color + '">$' + Math.round(s.monthly_income || 0).toLocaleString() + '/mo</span>';
          html += '</div>';
          html += '<div style="background:rgba(255,255,255,0.06);border-radius:3px;height:6px">';
          html += '<div style="width:' + pct + '%;height:6px;background:' + color + ';border-radius:3px;opacity:0.7"></div>';
          html += '</div></div>';
        });
        html += '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:4px;display:flex;justify-content:space-between">';
        html += '<span style="font-size:13px;font-weight:700;color:var(--text)">Total Monthly Passive</span>';
        html += '<span style="font-size:13px;font-weight:700;color:#22c55e">$' + Math.round(totalMonthly).toLocaleString() + '/mo</span>';
        html += '</div></div></div>';
        sankeyEl.innerHTML = html;
      } catch(e) { console.log('Sankey error:', e.message); }
    }

    // ── 7. Deployment Activity Heatmap (label-only fallback) ─────────────
    var heatmapEl = document.getElementById('chart-deploy-heatmap');
    if (heatmapEl) {
      var dm2 = window.DEPLOY_MONITOR_DATA || {};
      var hist2 = dm2.history || [];
      if (hist2.length === 0) {
        heatmapEl.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px;text-align:center">No deploy history yet. Monthly deploys will appear here.</div>';
      } else {
        var html2 = '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">';
        hist2.forEach(function(h) {
          var amt = h.amount || h.deployed || 0;
          var intensity = Math.min(1, amt / 5000);
          var bg = 'rgba(34,197,94,' + (0.15 + intensity * 0.7) + ')';
          html2 += '<div style="background:' + bg + ';border-radius:6px;padding:8px 12px;text-align:center">';
          html2 += '<div style="font-size:11px;color:var(--text);font-weight:700">' + (h.month || h.date || '') + '</div>';
          html2 += '<div style="font-size:12px;color:#22c55e;font-weight:700">$' + Math.round(amt).toLocaleString() + '</div>';
          html2 += '</div>';
        });
        html2 += '</div>';
        heatmapEl.innerHTML = html2;
      }
    }
  }

  // Run on tab switch + on load
  var _chartsInitialized = false;
  function maybeInitCharts() {
    var wealthPanel = document.getElementById('panel-wealth');
    if (wealthPanel && !wealthPanel.classList.contains('hidden') && !_chartsInitialized) {
      _chartsInitialized = true;
      setTimeout(initWealthCharts, 150);
    }
  }

  // Hook into showTab
  var _origShowTab = window.showTab;
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.showTab === 'function') {
      var _orig = window.showTab;
      window.showTab = function(tab) {
        _orig(tab);
        if (tab === 'wealth') setTimeout(initWealthCharts, 200);
      };
    }
    // Also try on load
    setTimeout(function() {
      var wealthPanel = document.getElementById('panel-wealth');
      if (wealthPanel && !wealthPanel.classList.contains('hidden')) initWealthCharts();
    }, 1000);
  });

})();
