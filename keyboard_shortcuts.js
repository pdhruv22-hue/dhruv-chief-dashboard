/**
 * Keyboard Shortcuts
 * Global hotkeys for power users
 */

(function() {
  'use strict';

  const shortcuts = {
    // Tab navigation
    '1': () => switchTab(0),
    '2': () => switchTab(1),
    '3': () => switchTab(2),
    '4': () => switchTab(3),
    '5': () => switchTab(4),
    '6': () => switchTab(5),
    '7': () => switchTab(6),
    '8': () => switchTab(7),
    '9': () => switchTab(8),

    // Actions
    'r': () => refreshCurrentTab(),
    't': () => toggleTheme(),
    '?': () => showHelp(),
    '/': () => focusSearch(),
    'Escape': () => closeModals(),
    'n': () => newItem(),

    // Navigation
    'ArrowLeft': () => previousTab(),
    'ArrowRight': () => nextTab(),
    'h': () => previousTab(),
    'l': () => nextTab(),

    // Export
    'e': () => exportCurrent(),
    'p': () => printCurrent()
  };

  function switchTab(index) {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    if (tabs[index]) {
      tabs[index].click();
    }
  }

  function refreshCurrentTab() {
    const refreshIndicator = document.getElementById('refresh-indicator');
    if (refreshIndicator) {
      refreshIndicator.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span> Refreshing...';
      refreshIndicator.style.transform = 'translateY(0)';
    }

    if (window.loadAllCharts) {
      window.loadAllCharts().then(() => {
        if (refreshIndicator) {
          setTimeout(() => {
            refreshIndicator.innerHTML = '<span style="margin-right: 8px;"></span> Refreshed';
            setTimeout(() => {
              refreshIndicator.style.transform = 'translateY(-100%)';
            }, 800);
          }, 300);
        }
      });
    }

    showToast(' Refreshing data...');
  }

  function toggleTheme() {
    if (window.themeManager) {
      window.themeManager.toggle();
      showToast(window.themeManager.currentTheme === 'dark' ? ' Dark mode' : ' Light mode');
    }
  }

  function showHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'keyboard-help-modal';
    helpModal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    `;

    helpModal.innerHTML = `
      <div style="
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 28px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      ">
        <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">⌨ Keyboard Shortcuts</h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px;">Navigation</h3>
          ${shortcutRow('1-9', 'Jump to tab')}
          ${shortcutRow('←/→ or h/l', 'Previous/Next tab')}
          ${shortcutRow('/', 'Focus search')}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px;">Actions</h3>
          ${shortcutRow('r', 'Refresh data')}
          ${shortcutRow('t', 'Toggle theme')}
          ${shortcutRow('n', 'New item (context-aware)')}
          ${shortcutRow('e', 'Export current view')}
          ${shortcutRow('p', 'Print')}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px;">General</h3>
          ${shortcutRow('Esc', 'Close modals')}
          ${shortcutRow('?', 'Show this help')}
        </div>

        <button 
          onclick="this.closest('.keyboard-help-modal').remove()"
          style="
            width: 100%;
            padding: 10px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
          "
        >Got it</button>
      </div>
    `;

    document.body.appendChild(helpModal);

    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.remove();
    });
  }

  function shortcutRow(key, desc) {
    return `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(42,42,42,0.3);
      ">
        <span style="font-size: 13px;">${desc}</span>
        <kbd style="
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          color: var(--accent);
        ">${key}</kbd>
      </div>
    `;
  }

  function focusSearch() {
    const searchInput = document.querySelector('input[type="search"], input[type="text"]');
    if (searchInput) {
      searchInput.focus();
    } else {
      showToast('No search box on this tab');
    }
  }

  function closeModals() {
    // Close any open modals/panels
    document.querySelectorAll('.slide-panel.open, .overlay.open, .keyboard-help-modal, .accent-picker-overlay').forEach(el => {
      el.classList.remove('open');
      setTimeout(() => el.remove(), 300);
    });
  }

  function newItem() {
    const activePanel = document.querySelector('.tab-panel.active');
    if (!activePanel) return;

    const panelId = activePanel.id;

    const actions = {
      'wealth-panel': () => showToast(' Add transaction via Telegram'),
      'goals-panel': () => showToast(' Add goal via Telegram'),
      'cre-panel': () => showToast(' Add deal via Telegram'),
      'deploy-panel': () => showToast(' Log deploy via Telegram'),
      'opportunities-panel': () => showToast(' Submit idea via Telegram')
    };

    const action = actions[panelId];
    if (action) {
      action();
    } else {
      showToast('ℹ Use Telegram to add items');
    }
  }

  function exportCurrent() {
    const activePanel = document.querySelector('.tab-panel.active');
    if (!activePanel) return;

    showToast(' Export feature coming soon');
  }

  function printCurrent() {
    window.print();
  }

  function previousTab() {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const activeTab = document.querySelector('.tab.active');
    const index = tabs.indexOf(activeTab);
    if (index > 0) {
      tabs[index - 1].click();
    }
  }

  function nextTab() {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const activeTab = document.querySelector('.tab.active');
    const index = tabs.indexOf(activeTab);
    if (index < tabs.length - 1) {
      tabs[index + 1].click();
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // Global keydown handler
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      // Except for Escape
      if (e.key !== 'Escape') return;
    }

    // Check for shortcut
    const handler = shortcuts[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  });

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Show hint on first load
  if (!localStorage.getItem('shortcuts_hint_shown')) {
    setTimeout(() => {
      showToast(' Press ? for keyboard shortcuts');
      localStorage.setItem('shortcuts_hint_shown', 'true');
    }, 2000);
  }

  console.log(' Keyboard shortcuts initialized');
})();
