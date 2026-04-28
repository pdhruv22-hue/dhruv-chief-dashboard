/**
 * Charts Configuration & Factory
 * 10 institutional-grade charts for Chief Dashboard
 * Uses Chart.js + custom D3.js components
 */

// Chart.js global defaults
Chart.defaults.color = '#e5e5e5';
Chart.defaults.borderColor = '#2a2a2a';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
Chart.defaults.plugins.legend.display = false; // Custom legends
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Color palette
const COLORS = {
  accent: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a855f7',
  orange: '#f59e0b',
  teal: '#14b8a6',
  pink: '#ec4899',
  gray: '#737373',
  muted: '#888888'
};

const THESIS_COLORS = {
  'EV/Tesla Ecosystem': COLORS.accent,
  'Nuclear/Clean Energy': COLORS.green,
  'AI/Tech Growth': COLORS.purple,
  'Speculative/Early': COLORS.orange,
  'Income/Stability': COLORS.yellow,
  'Other': COLORS.gray
};

// Chart utilities
const ChartUtils = {
  formatCurrency(value) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  },

  formatPercent(value) {
    return `${value.toFixed(1)}%`;
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  animationConfig(duration = 800) {
    return {
      duration,
      easing: 'easeOutQuart'
    };
  },

  tooltipConfig() {
    return {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      titleColor: '#e5e5e5',
      bodyColor: '#e5e5e5',
      borderColor: '#2a2a2a',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      cornerRadius: 8
    };
  }
};

// Export for global use
window.ChartUtils = ChartUtils;
window.COLORS = COLORS;
window.THESIS_COLORS = THESIS_COLORS;
