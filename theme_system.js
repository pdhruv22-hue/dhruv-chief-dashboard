/**
 * Theme System - Dark/Light Mode + Custom Accents
 * Persists to localStorage, auto-detects system preference
 */

(function() {
  'use strict';

  const THEMES = {
    dark: {
      bg: '#0f0f0f',
      surface: '#1a1a1a',
      surface2: '#242424',
      border: '#2a2a2a',
      text: '#e5e5e5',
      muted: '#888888'
    },
    light: {
      bg: '#ffffff',
      surface: '#f5f5f5',
      surface2: '#e5e5e5',
      border: '#d4d4d4',
      text: '#171717',
      muted: '#737373'
    }
  };

  const ACCENTS = {
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f59e0b',
    pink: '#ec4899',
    teal: '#14b8a6'
  };

  class ThemeManager {
    constructor() {
      this.currentTheme = this.loadTheme();
      this.currentAccent = this.loadAccent();
      this.apply();
      this.createToggle();
    }

    loadTheme() {
      // Check localStorage (explicit user override only)
      const saved = localStorage.getItem('dashboard_theme');
      if (saved && THEMES[saved]) return saved;

      // Default to dark — this is a dark-mode dashboard
      return 'dark';
    }

    loadAccent() {
      const saved = localStorage.getItem('dashboard_accent');
      return (saved && ACCENTS[saved]) ? saved : 'blue';
    }

    apply() {
      const theme = THEMES[this.currentTheme];
      const accent = ACCENTS[this.currentAccent];

      const root = document.documentElement;
      root.style.setProperty('--bg', theme.bg);
      root.style.setProperty('--surface', theme.surface);
      root.style.setProperty('--surface2', theme.surface2);
      root.style.setProperty('--border', theme.border);
      root.style.setProperty('--text', theme.text);
      root.style.setProperty('--muted', theme.muted);
      root.style.setProperty('--accent', accent);

      // Update meta theme-color
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme.bg);
      }

      // Update Chart.js defaults
      if (window.Chart) {
        Chart.defaults.color = theme.text;
        Chart.defaults.borderColor = theme.border;
      }

      // Store preference
      localStorage.setItem('dashboard_theme', this.currentTheme);
      localStorage.setItem('dashboard_accent', this.currentAccent);
    }

    toggle() {
      this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.apply();
      
      // Reload charts with new theme
      if (window.loadAllCharts) {
        setTimeout(() => window.loadAllCharts(), 100);
      }
    }

    setAccent(accentKey) {
      if (!ACCENTS[accentKey]) return;
      this.currentAccent = accentKey;
      this.apply();

      // Reload charts
      if (window.loadAllCharts) {
        setTimeout(() => window.loadAllCharts(), 100);
      }
    }

    createToggle() {
      // Add theme toggle button to header
      const tabs = document.querySelector('.tabs');
      if (!tabs) return;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'theme-toggle';
      toggleBtn.innerHTML = this.currentTheme === 'dark' ? '' : '';
      toggleBtn.title = 'Toggle theme';
      toggleBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--text);
        font-size: 18px;
        cursor: pointer;
        padding: 14px 18px;
        margin-left: auto;
        transition: opacity 0.15s;
      `;
      toggleBtn.addEventListener('click', () => {
        this.toggle();
        toggleBtn.innerHTML = this.currentTheme === 'dark' ? '' : '';
      });

      tabs.appendChild(toggleBtn);

      // Add accent picker (long-press theme toggle)
      toggleBtn.addEventListener('long-press', () => {
        this.showAccentPicker();
      });

      // Regular click as fallback
      toggleBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showAccentPicker();
      });
    }

    showAccentPicker() {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'accent-picker-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        max-width: 90%;
        width: 400px;
        animation: slideUp 0.3s ease;
      `;

      modal.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Choose Accent Color</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          ${Object.entries(ACCENTS).map(([key, color]) => `
            <button 
              class="accent-option"
              data-accent="${key}"
              style="
                background: ${color};
                border: 3px solid ${this.currentAccent === key ? 'white' : 'transparent'};
                border-radius: 8px;
                height: 60px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
                color: white;
                font-weight: 600;
                text-transform: capitalize;
              "
            >${key}</button>
          `).join('')}
        </div>
        <button 
          class="close-picker"
          style="
            margin-top: 16px;
            width: 100%;
            padding: 10px;
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
          "
        >Close</button>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Handle accent selection
      modal.querySelectorAll('.accent-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const accent = btn.dataset.accent;
          this.setAccent(accent);
          overlay.remove();
        });
      });

      // Close handlers
      modal.querySelector('.close-picker').addEventListener('click', () => {
        overlay.remove();
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });

      // Add animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Auto-detect system theme changes
  if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('dashboard_theme')) {
        window.themeManager = new ThemeManager();
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.themeManager = new ThemeManager();
    });
  } else {
    window.themeManager = new ThemeManager();
  }

  console.log(' Theme system initialized');
})();
