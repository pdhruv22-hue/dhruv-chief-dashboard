/**
 * Iteration 6: Long-Press Context Menus + Bloomberg Features
 */

// ==================== Context Menu System ====================

let contextMenuState = {
    currentMenu: null,
    longPressTimer: null,
    longPressTarget: null,
    longPressStartX: 0,
    longPressStartY: 0
};

// Context menu templates
const CONTEXT_MENUS = {
    chart: {
        items: [
            { icon: '', label: 'Export PDF', action: 'export-pdf' },
            { icon: '', label: 'Export PNG', action: 'export-png' },
            { icon: '', label: 'Share', action: 'share' },
            { icon: '', label: 'Fullscreen', action: 'fullscreen' },
            { icon: '', label: 'Configure', action: 'configure' }
        ]
    },
    goal: {
        items: [
            { icon: '', label: 'Edit', action: 'edit' },
            { icon: '', label: 'Mark Complete', action: 'complete' },
            { icon: '', label: 'Set Reminder', action: 'reminder' },
            { icon: '', label: 'View Details', action: 'details' },
            { icon: '', label: 'Delete', action: 'delete', destructive: true }
        ]
    },
    deal: {
        items: [
            { icon: '', label: 'Save to Favorites', action: 'favorite' },
            { icon: '', label: 'Archive', action: 'archive' },
            { icon: '', label: 'Compare', action: 'compare' },
            { icon: '', label: 'View Full OM', action: 'view-om' },
            { icon: '', label: 'Contact Broker', action: 'contact' }
        ]
    },
    position: {
        items: [
            { icon: '', label: 'Buy More', action: 'buy' },
            { icon: '', label: 'Sell', action: 'sell', destructive: true },
            { icon: '', label: 'Set Alert', action: 'alert' },
            { icon: '', label: 'View Analysis', action: 'analysis' },
            { icon: '', label: 'News', action: 'news' }
        ]
    }
};

// Initialize context menu system
function initContextMenus() {
    // Prevent default browser context menu
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('[data-contextmenu]')) {
            e.preventDefault();
        }
    });
    
    // Touch events for long-press
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Mouse events for right-click (keyboard accessibility)
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Close menu on backdrop click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            closeContextMenu();
        }
    });
    
    console.log(' Context menu system initialized');
}

function handleTouchStart(e) {
    const target = e.target.closest('[data-contextmenu]');
    if (!target) return;
    
    contextMenuState.longPressTarget = target;
    contextMenuState.longPressStartX = e.touches[0].clientX;
    contextMenuState.longPressStartY = e.touches[0].clientY;
    
    // Start long-press timer (500ms)
    contextMenuState.longPressTimer = setTimeout(() => {
        triggerContextMenu(target, e.touches[0].clientX, e.touches[0].clientY);
    }, 500);
}

function handleTouchMove(e) {
    if (!contextMenuState.longPressTimer) return;
    
    // Cancel if moved more than 10px
    const moveThreshold = 10;
    const deltaX = Math.abs(e.touches[0].clientX - contextMenuState.longPressStartX);
    const deltaY = Math.abs(e.touches[0].clientY - contextMenuState.longPressStartY);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimeout(contextMenuState.longPressTimer);
        contextMenuState.longPressTimer = null;
    }
}

function handleTouchEnd(e) {
    if (contextMenuState.longPressTimer) {
        clearTimeout(contextMenuState.longPressTimer);
        contextMenuState.longPressTimer = null;
    }
}

function handleMouseDown(e) {
    // Right-click support
    if (e.button === 2) {
        const target = e.target.closest('[data-contextmenu]');
        if (target) {
            e.preventDefault();
            contextMenuState.longPressTarget = target;
        }
    }
}

function handleMouseUp(e) {
    if (e.button === 2 && contextMenuState.longPressTarget) {
        e.preventDefault();
        triggerContextMenu(contextMenuState.longPressTarget, e.clientX, e.clientY);
        contextMenuState.longPressTarget = null;
    }
}

function triggerContextMenu(target, x, y) {
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    const menuType = target.dataset.contextmenu;
    const menuConfig = CONTEXT_MENUS[menuType];
    
    if (!menuConfig) {
        console.warn(`No context menu config for type: ${menuType}`);
        return;
    }
    
    showContextMenu(menuConfig, x, y, target);
}

function showContextMenu(config, x, y, target) {
    closeContextMenu(); // Close any existing menu
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    config.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'context-menu-item' + (item.destructive ? ' destructive' : '');
        itemEl.innerHTML = `
            <span class="context-menu-icon">${item.icon}</span>
            <span class="context-menu-label">${item.label}</span>
        `;
        
        itemEl.addEventListener('click', () => {
            handleContextMenuAction(item.action, target);
            closeContextMenu();
        });
        
        menu.appendChild(itemEl);
    });
    
    document.body.appendChild(menu);
    contextMenuState.currentMenu = menu;
    
    // Position adjustment to keep on screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
    
    // Animate in
    setTimeout(() => menu.classList.add('visible'), 10);
}

function closeContextMenu() {
    if (contextMenuState.currentMenu) {
        contextMenuState.currentMenu.classList.remove('visible');
        setTimeout(() => {
            if (contextMenuState.currentMenu) {
                contextMenuState.currentMenu.remove();
                contextMenuState.currentMenu = null;
            }
        }, 200);
    }
}

function handleContextMenuAction(action, target) {
    console.log('Context menu action:', action, target);
    
    // Chart actions
    if (action === 'export-pdf') {
        exportChartAsPDF(target);
    } else if (action === 'export-png') {
        exportChartAsPNG(target);
    } else if (action === 'share') {
        shareChart(target);
    } else if (action === 'fullscreen') {
        enterFullscreen(target);
    } else if (action === 'configure') {
        openChartConfig(target);
    }
    
    // Goal actions
    else if (action === 'edit') {
        editGoal(target);
    } else if (action === 'complete') {
        markGoalComplete(target);
    } else if (action === 'reminder') {
        setGoalReminder(target);
    } else if (action === 'details') {
        viewGoalDetails(target);
    } else if (action === 'delete') {
        confirmDelete(() => deleteGoal(target));
    }
    
    // Deal actions
    else if (action === 'favorite') {
        toggleDealFavorite(target);
    } else if (action === 'archive') {
        archiveDeal(target);
    } else if (action === 'compare') {
        compareDeal(target);
    } else if (action === 'view-om') {
        viewDealOM(target);
    } else if (action === 'contact') {
        contactBroker(target);
    }
    
    // Position actions
    else if (action === 'buy') {
        buyPosition(target);
    } else if (action === 'sell') {
        confirmDelete(() => sellPosition(target));
    } else if (action === 'alert') {
        setPositionAlert(target);
    } else if (action === 'analysis') {
        viewPositionAnalysis(target);
    } else if (action === 'news') {
        viewPositionNews(target);
    }
}

function confirmDelete(callback) {
    const modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3> Confirm Action</h3>
            <p>This action cannot be undone. Continue?</p>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-danger" id="confirmBtn">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    document.getElementById('confirmBtn').addEventListener('click', () => {
        callback();
        modal.remove();
    });
}

// Action implementations (stubs for now, will be connected to real data)
function exportChartAsPDF(target) { showToast(' Exporting chart as PDF...'); }
function exportChartAsPNG(target) { showToast(' Exporting chart as PNG...'); }
function shareChart(target) { showToast(' Share link copied!'); }
function enterFullscreen(target) { 
    if (target.requestFullscreen) {
        target.requestFullscreen();
    }
}
function openChartConfig(target) { showToast(' Chart configuration coming soon'); }

function editGoal(target) { showToast(' Edit goal modal would open'); }
function markGoalComplete(target) { 
    target.style.opacity = '0.5';
    showToast(' Goal marked complete!'); 
}
function setGoalReminder(target) { showToast(' Reminder set for goal'); }
function viewGoalDetails(target) { showToast(' Goal details modal would open'); }
function deleteGoal(target) { 
    target.style.display = 'none';
    showToast(' Goal deleted'); 
}

function toggleDealFavorite(target) { showToast(' Deal saved to favorites'); }
function archiveDeal(target) { showToast(' Deal archived'); }
function compareDeal(target) { showToast(' Compare view would open'); }
function viewDealOM(target) { showToast(' Opening offering memorandum...'); }
function contactBroker(target) { showToast(' Opening contact form...'); }

function buyPosition(target) { showToast(' Buy order form would open'); }
function sellPosition(target) { showToast(' Sell order placed'); }
function setPositionAlert(target) { showToast(' Price alert set'); }
function viewPositionAnalysis(target) { showToast(' Analysis view would open'); }
function viewPositionNews(target) { showToast(' Fetching latest news...'); }

// ==================== Bloomberg-Style Features ====================

// Advanced keyboard shortcuts
function initBloombergKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt+1 through Alt+7: Jump to tabs
        if (e.altKey && e.key >= '1' && e.key <= '7') {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            const tabs = ['overview', 'portfolio', 'cashflow', 'goals', 'wealth', 'cre', 'performance'];
            if (tabs[tabIndex]) {
                switchToTab(tabs[tabIndex]);
            }
        }
        
        // Ctrl+F: Find/search
        else if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            openSearch();
        }
        
        // Ctrl+N: New note/annotation
        else if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openNoteCreator();
        }
        
        // Ctrl+Shift+E: Export all data
        else if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportAllData();
        }
        
        // Ctrl+Shift+T: Toggle theme quickly
        else if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            quickToggleTheme();
        }
        
        // M: Macro dashboard overlay
        else if (e.key === 'm' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            const activeEl = document.activeElement;
            if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMacroOverlay();
            }
        }
    });
    
    console.log(' Bloomberg keyboard shortcuts initialized');
}

function openSearch() {
    const searchBox = document.getElementById('globalSearch');
    if (searchBox) {
        searchBox.focus();
    } else {
        createSearchModal();
    }
}

function createSearchModal() {
    const modal = document.createElement('div');
    modal.className = 'modal search-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3> Search Dashboard</h3>
            <input type="text" id="dashboardSearchInput" placeholder="Search metrics, goals, deals..." class="search-input">
            <div id="searchResults" class="search-results"></div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    const input = document.getElementById('dashboardSearchInput');
    input.focus();
    
    input.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });
    
    // Close on Escape
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function performSearch(query) {
    const resultsDiv = document.getElementById('searchResults');
    if (!query) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    // Simulate search (would search actual data in production)
    const mockResults = [
        { type: 'metric', label: 'Net Worth', value: '$353,918' },
        { type: 'goal', label: 'CRE Deal by Sep 30', status: 'In Progress' },
        { type: 'position', label: 'TSLA', value: '1,346 shares' },
    ].filter(r => r.label.toLowerCase().includes(query.toLowerCase()));
    
    resultsDiv.innerHTML = mockResults.map(r => `
        <div class="search-result-item">
            <span>${r.type === 'metric' ? '' : r.type === 'goal' ? '' : ''}</span>
            <strong>${r.label}</strong>
            <span class="muted">${r.value || r.status}</span>
        </div>
    `).join('');
}

function openNoteCreator() {
    const modal = document.createElement('div');
    modal.className = 'modal note-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3> New Annotation</h3>
            <textarea id="noteContent" placeholder="Add a note or observation..." rows="5" style="width: 100%; padding: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); border-radius: 8px; font-family: inherit;"></textarea>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="saveNote()">Save Note</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
    document.getElementById('noteContent').focus();
}

function saveNote() {
    const content = document.getElementById('noteContent').value;
    if (content) {
        // Save to localStorage or backend
        const notes = JSON.parse(localStorage.getItem('dashboard-notes') || '[]');
        notes.push({ content, timestamp: Date.now(), tab: window.currentTab });
        localStorage.setItem('dashboard-notes', JSON.stringify(notes));
        showToast(' Note saved!');
    }
    document.querySelector('.note-modal').remove();
}

function exportAllData() {
    showToast(' Exporting all dashboard data...');
    
    // Collect all data
    const allData = {
        timestamp: new Date().toISOString(),
        netWorth: '$353,918',
        portfolio: { /* would include real data */ },
        goals: { /* would include real data */ },
        deals: { /* would include real data */ },
        notes: JSON.parse(localStorage.getItem('dashboard-notes') || '[]'),
        theme: {
            mode: document.body.dataset.theme,
            accent: document.body.dataset.accent
        }
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_full_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function quickToggleTheme() {
    const currentTheme = document.body.dataset.theme || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('dashboard-theme', newTheme);
    showToast(` Theme: ${newTheme}`);
}

// ==================== Multi-Monitor Layout ====================

let layoutState = {
    splitView: false,
    syncScroll: false,
    layout: null
};

function initMultiMonitorLayout() {
    // Add layout controls to UI
    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'icon-btn layout-btn';
    layoutBtn.innerHTML = '';
    layoutBtn.title = 'Split View';
    layoutBtn.addEventListener('click', toggleSplitView);
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.appendChild(layoutBtn);
    }
    
    // Load saved layout preference
    layoutState.layout = localStorage.getItem('dashboard-layout') || 'single';
    
    console.log(' Multi-monitor layout initialized');
}

function toggleSplitView() {
    layoutState.splitView = !layoutState.splitView;
    
    if (layoutState.splitView) {
        enterSplitView();
    } else {
        exitSplitView();
    }
}

function enterSplitView() {
    const container = document.querySelector('.container');
    container.classList.add('split-view');
    
    // Clone current tab content to create split
    const currentTab = document.querySelector('.tab-content.active');
    const clone = currentTab.cloneNode(true);
    clone.classList.add('split-pane-right');
    currentTab.classList.add('split-pane-left');
    currentTab.after(clone);
    
    showToast(' Split view enabled');
}

function exitSplitView() {
    const container = document.querySelector('.container');
    container.classList.remove('split-view');
    
    const rightPane = document.querySelector('.split-pane-right');
    if (rightPane) rightPane.remove();
    
    const leftPane = document.querySelector('.split-pane-left');
    if (leftPane) leftPane.classList.remove('split-pane-left');
    
    showToast('Single view restored');
}

function popOutTab(tabId) {
    const tabContent = document.getElementById(tabId);
    if (!tabContent) return;
    
    const popupWindow = window.open('', tabId, 'width=1200,height=800');
    popupWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${tabId} - Dashboard</title>
            <style>${document.querySelector('style').textContent}</style>
        </head>
        <body data-theme="${document.body.dataset.theme}" data-accent="${document.body.dataset.accent}">
            ${tabContent.innerHTML}
        </body>
        </html>
    `);
    popupWindow.document.close();
}

// ==================== Real-Time Sentiment Analysis ====================

let sentimentState = {
    lastUpdate: 0,
    updateInterval: 15 * 60 * 1000, // 15 minutes
    sentiments: {}
};

async function initSentimentAnalysis() {
    // Fetch initial sentiment
    await updateSentiment();
    
    // Update every 15 minutes
    setInterval(updateSentiment, sentimentState.updateInterval);
    
    console.log(' Sentiment analysis initialized');
}

async function updateSentiment() {
    const holdings = ['TSLA', 'XPEV', 'LCID', 'VOO', 'VIG'];
    
    for (const ticker of holdings) {
        try {
            // In production, this would call Perplexity Sonar via OpenRouter
            // For now, simulate with mock data
            const sentiment = await fetchSentiment(ticker);
            sentimentState.sentiments[ticker] = sentiment;
            updateSentimentUI(ticker, sentiment);
        } catch (error) {
            console.error(`Failed to fetch sentiment for ${ticker}:`, error);
        }
    }
    
    sentimentState.lastUpdate = Date.now();
}

async function fetchSentiment(ticker) {
    // Mock sentiment (in production, call OpenRouter with Perplexity Sonar)
    const sentiments = ['positive', 'neutral', 'negative'];
    const random = Math.random();
    return {
        score: random,
        label: random > 0.6 ? 'positive' : random > 0.3 ? 'neutral' : 'negative',
        summary: `Recent news sentiment for ${ticker}`
    };
}

function updateSentimentUI(ticker, sentiment) {
    const elements = document.querySelectorAll(`[data-ticker="${ticker}"]`);
    elements.forEach(el => {
        const badge = el.querySelector('.sentiment-badge') || document.createElement('span');
        badge.className = 'sentiment-badge sentiment-' + sentiment.label;
        badge.textContent = sentiment.label === 'positive' ? '↗' : sentiment.label === 'negative' ? '↘' : '→';
        badge.title = sentiment.summary;
        
        if (!el.querySelector('.sentiment-badge')) {
            el.appendChild(badge);
        }
    });
}

// ==================== Insider Trading Tracker ====================

let insiderState = {
    trades: [],
    threshold: 1000000 // $1M
};

async function initInsiderTracker() {
    await fetchInsiderTrades();
    
    // Update daily
    setInterval(fetchInsiderTrades, 24 * 60 * 60 * 1000);
    
    console.log(' Insider trading tracker initialized');
}

async function fetchInsiderTrades() {
    const holdings = ['TSLA', 'XPEV', 'LCID'];
    
    // Mock data (in production, fetch from SEC API)
    insiderState.trades = [
        { ticker: 'TSLA', insider: 'Elon Musk', type: 'buy', amount: 5000000, date: '2026-04-20' },
        { ticker: 'XPEV', insider: 'He Xiaopeng', type: 'sell', amount: 2000000, date: '2026-04-18' }
    ];
    
    // Alert on significant activity
    insiderState.trades.forEach(trade => {
        if (trade.amount >= insiderState.threshold) {
            showInsiderAlert(trade);
        }
    });
}

function showInsiderAlert(trade) {
    const icon = trade.type === 'buy' ? '' : '';
    showToast(`${icon} ${trade.insider} ${trade.type} $${(trade.amount/1000000).toFixed(1)}M ${trade.ticker}`, 5000);
}

// ==================== Macro Dashboard Overlay ====================

let macroState = {
    visible: false,
    data: {},
    updateInterval: 60000 // 1 minute
};

function initMacroOverlay() {
    createMacroOverlay();
    updateMacroData();
    
    // Update during market hours (9:30 AM - 4 PM ET)
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 9 && hour < 16) {
            updateMacroData();
        }
    }, macroState.updateInterval);
    
    console.log(' Macro dashboard overlay initialized');
}

function createMacroOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'macroOverlay';
    overlay.className = 'macro-overlay';
    overlay.innerHTML = `
        <div class="macro-header">
            <h3> Macro Dashboard</h3>
            <button class="close-btn" onclick="toggleMacroOverlay()">×</button>
        </div>
        <div class="macro-grid">
            <div class="macro-item" data-symbol="SPY">
                <span class="macro-label">SPY</span>
                <span class="macro-value">—</span>
                <span class="macro-change">—</span>
            </div>
            <div class="macro-item" data-symbol="QQQ">
                <span class="macro-label">QQQ</span>
                <span class="macro-value">—</span>
                <span class="macro-change">—</span>
            </div>
            <div class="macro-item" data-symbol="VIX">
                <span class="macro-label">VIX</span>
                <span class="macro-value">—</span>
                <span class="macro-change">—</span>
            </div>
            <div class="macro-item" data-symbol="TNX">
                <span class="macro-label">10Y</span>
                <span class="macro-value">—</span>
                <span class="macro-change">—</span>
            </div>
            <div class="macro-item" data-symbol="DXY">
                <span class="macro-label">DXY</span>
                <span class="macro-value">—</span>
                <span class="macro-change">—</span>
            </div>
            <div class="macro-item" data-symbol="CL">
                <span class="macro-label">OIL</span>
                <span class="macro-value">—</span>
                <span class="macro-change">—</span>
            </div>
        </div>
        <div class="correlation-heatmap">
            <h4>Correlation to Portfolio</h4>
            <div id="correlationGrid"></div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function toggleMacroOverlay() {
    macroState.visible = !macroState.visible;
    const overlay = document.getElementById('macroOverlay');
    overlay.classList.toggle('visible', macroState.visible);
}

async function updateMacroData() {
    // Mock data (in production, fetch from real API)
    macroState.data = {
        SPY: { price: 521.34, change: 0.8 },
        QQQ: { price: 438.92, change: 1.2 },
        VIX: { price: 14.32, change: -2.1 },
        TNX: { price: 4.35, change: 0.05 },
        DXY: { price: 101.23, change: -0.3 },
        CL: { price: 81.45, change: 1.5 }
    };
    
    Object.keys(macroState.data).forEach(symbol => {
        const item = document.querySelector(`.macro-item[data-symbol="${symbol}"]`);
        if (item) {
            const data = macroState.data[symbol];
            item.querySelector('.macro-value').textContent = data.price.toFixed(2);
            
            const changeEl = item.querySelector('.macro-change');
            changeEl.textContent = (data.change > 0 ? '+' : '') + data.change.toFixed(2) + '%';
            changeEl.className = 'macro-change ' + (data.change > 0 ? 'positive' : data.change < 0 ? 'negative' : '');
        }
    });
    
    updateCorrelationHeatmap();
}

function updateCorrelationHeatmap() {
    // Mock correlation data
    const correlations = {
        SPY: 0.85,
        QQQ: 0.92,
        VIX: -0.65,
        TNX: -0.23,
        DXY: -0.41,
        CL: 0.34
    };
    
    const grid = document.getElementById('correlationGrid');
    grid.innerHTML = Object.keys(correlations).map(symbol => {
        const corr = correlations[symbol];
        const color = corr > 0 ? `rgba(34, 197, 94, ${Math.abs(corr)})` : `rgba(239, 68, 68, ${Math.abs(corr)})`;
        return `
            <div class="correlation-cell" style="background: ${color}">
                <span>${symbol}</span>
                <span>${corr.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

// ==================== Watchlists with Alerts ====================

let watchlistState = {
    lists: {},
    alerts: []
};

function initWatchlists() {
    loadWatchlists();
    checkAlerts();
    
    // Check alerts every minute
    setInterval(checkAlerts, 60000);
    
    console.log(' Watchlist system initialized');
}

function loadWatchlists() {
    const saved = localStorage.getItem('dashboard-watchlists');
    if (saved) {
        watchlistState.lists = JSON.parse(saved);
    } else {
        // Default watchlist
        watchlistState.lists = {
            'Main': ['TSLA', 'XPEV', 'LCID'],
            'Crypto': ['BTC', 'ETH']
        };
    }
}

function saveWatchlists() {
    localStorage.setItem('dashboard-watchlists', JSON.stringify(watchlistState.lists));
}

function addToWatchlist(ticker, listName = 'Main') {
    if (!watchlistState.lists[listName]) {
        watchlistState.lists[listName] = [];
    }
    if (!watchlistState.lists[listName].includes(ticker)) {
        watchlistState.lists[listName].push(ticker);
        saveWatchlists();
        showToast(` ${ticker} added to ${listName} watchlist`);
    }
}

function setAlert(ticker, condition, threshold) {
    const alert = {
        ticker,
        condition, // 'above', 'below', 'volume', 'news'
        threshold,
        active: true,
        created: Date.now()
    };
    
    watchlistState.alerts.push(alert);
    localStorage.setItem('dashboard-alerts', JSON.stringify(watchlistState.alerts));
    showToast(` Alert set for ${ticker}`);
}

function checkAlerts() {
    // In production, fetch real prices and check against alerts
    watchlistState.alerts.forEach(alert => {
        if (!alert.active) return;
        
        // Mock price check
        const currentPrice = Math.random() * 1000;
        
        if (alert.condition === 'above' && currentPrice > alert.threshold) {
            triggerAlert(alert, currentPrice);
        } else if (alert.condition === 'below' && currentPrice < alert.threshold) {
            triggerAlert(alert, currentPrice);
        }
    });
}

function triggerAlert(alert, currentPrice) {
    showToast(` ALERT: ${alert.ticker} ${alert.condition} ${alert.threshold} (now: ${currentPrice.toFixed(2)})`, 10000);
    
    // Mark as triggered
    alert.active = false;
    localStorage.setItem('dashboard-alerts', JSON.stringify(watchlistState.alerts));
    
    // Push notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${alert.ticker} Price Alert`, {
            body: `${alert.ticker} is ${alert.condition} ${alert.threshold}`,
            icon: '/favicon.ico'
        });
    }
}

// ==================== Initialize All ====================

function initIteration6Features() {
    initContextMenus();
    initBloombergKeyboardShortcuts();
    initMultiMonitorLayout();
    initSentimentAnalysis();
    initInsiderTracker();
    initMacroOverlay();
    initWatchlists();
    
    console.log(' Iteration 6: All Bloomberg features loaded');
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIteration6Features);
} else {
    initIteration6Features();
}
