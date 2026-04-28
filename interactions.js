// ===================================
// ITERATION 4: MOBILE GESTURES, THEMES, SHORTCUTS, EXPORTS
// ===================================

// ===================================
// FEATURE 1: MOBILE GESTURES
// ===================================

// Tab Navigation with Swipe
let touchStartX = 0;
let touchEndX = 0;
let currentTab = 0;
const tabs = ['overview', 'portfolio', 'cashflow', 'goals', 'wealth', 'cre', 'performance'];

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentTab < tabs.length - 1) {
            // Swipe left - next tab
            currentTab++;
            switchToTab(tabs[currentTab]);
        } else if (diff < 0 && currentTab > 0) {
            // Swipe right - previous tab
            currentTab--;
            switchToTab(tabs[currentTab]);
        }
    }
}

document.querySelector('.tab-container').addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.querySelector('.tab-container').addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function switchToTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Update current tab index
    currentTab = tabs.indexOf(tabName);
}

// Tab button clicks
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchToTab(btn.dataset.tab);
    });
});

// Pull to Refresh
let pullStartY = 0;
let pullDistance = 0;
const pullThreshold = 100;
const pullIndicator = document.getElementById('pullToRefresh');

document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) {
        pullStartY = e.touches[0].clientY;
    }
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (pullStartY > 0) {
        pullDistance = e.touches[0].clientY - pullStartY;
        
        if (pullDistance > 20) {
            pullIndicator.classList.add('visible');
        }
    }
}, { passive: true });

document.addEventListener('touchend', e => {
    if (pullDistance > pullThreshold) {
        refreshDashboard();
    }
    
    pullStartY = 0;
    pullDistance = 0;
    setTimeout(() => {
        pullIndicator.classList.remove('visible');
    }, 300);
}, { passive: true });

function refreshDashboard() {
    pullIndicator.classList.add('loading');
    
    // Simulate data refresh
    setTimeout(() => {
        pullIndicator.classList.remove('loading');
        pullIndicator.classList.remove('visible');
        
        // Show success feedback
        showToast('Dashboard refreshed! ');
    }, 1500);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes slideUp {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
    }
`;
document.head.appendChild(style);

// Long Press Context Menu
let longPressTimer;
let longPressTarget;
const contextMenu = document.getElementById('contextMenu');

document.querySelectorAll('.chart-container').forEach(container => {
    container.addEventListener('touchstart', e => {
        longPressTarget = container;
        longPressTimer = setTimeout(() => {
            showContextMenu(e.touches[0].clientX, e.touches[0].clientY);
            navigator.vibrate && navigator.vibrate(50); // Haptic feedback
        }, 500);
    }, { passive: true });
    
    container.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    }, { passive: true });
    
    container.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    }, { passive: true });
});

function showContextMenu(x, y) {
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.add('visible');
}

// Hide context menu when clicking outside
document.addEventListener('click', e => {
    if (!contextMenu.contains(e.target)) {
        contextMenu.classList.remove('visible');
    }
});

// Context menu actions
document.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        
        switch(action) {
            case 'export':
                openModal('exportModal');
                break;
            case 'share':
                shareChart();
                break;
            case 'fullscreen':
                toggleFullscreen(longPressTarget);
                break;
        }
        
        contextMenu.classList.remove('visible');
    });
});

function shareChart() {
    if (navigator.share) {
        navigator.share({
            title: 'Chief Dashboard',
            text: 'Check out my dashboard',
            url: window.location.href
        });
    } else {
        showToast('Share not supported on this device');
    }
}

function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        element.requestFullscreen && element.requestFullscreen();
    } else {
        document.exitFullscreen && document.exitFullscreen();
    }
}

// Pinch Zoom (basic implementation)
let initialDistance = 0;
let currentScale = 1;

document.querySelectorAll('.chart-container').forEach(container => {
    container.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches[0], e.touches[1]);
        }
    }, { passive: true });
    
    container.addEventListener('touchmove', e => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const distance = getDistance(e.touches[0], e.touches[1]);
            const scale = distance / initialDistance;
            currentScale = Math.min(Math.max(scale, 0.5), 3);
            
            const canvas = container.querySelector('canvas');
            if (canvas) {
                canvas.style.transform = `scale(${currentScale})`;
                canvas.style.transformOrigin = 'center';
            }
        }
    });
    
    // Reset zoom on double tap
    container.addEventListener('dblclick', () => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.style.transform = 'scale(1)';
            currentScale = 1;
        }
    });
});

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// ===================================
// FEATURE 2: THEME SYSTEM
// ===================================

function loadTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'dark';
    const savedAccent = localStorage.getItem('dashboard-accent') || 'blue';
    
    applyTheme(savedTheme, savedAccent);
}

function applyTheme(theme, accent) {
    const body = document.body;
    
    // Handle auto theme
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    
    body.setAttribute('data-theme', theme);
    body.setAttribute('data-accent', accent);
    
    // Update UI
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === localStorage.getItem('dashboard-theme'));
    });
    
    document.querySelectorAll('.accent-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.dataset.accent === accent);
    });
    
    // Re-render charts with new colors
    if (window.chartsInitialized) {
        setTimeout(() => {
            location.reload(); // Simple way to update all charts
        }, 300);
    }
}

// Theme picker
document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        localStorage.setItem('dashboard-theme', theme);
        
        const accent = localStorage.getItem('dashboard-accent') || 'blue';
        applyTheme(theme, accent);
    });
});

// Accent picker
document.querySelectorAll('.accent-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        const accent = swatch.dataset.accent;
        localStorage.setItem('dashboard-accent', accent);
        
        const theme = localStorage.getItem('dashboard-theme') || 'dark';
        applyTheme(theme, accent);
    });
});

// Bottom nav theme button
document.getElementById('themeBtn').addEventListener('click', () => {
    openModal('themeModal');
});

// Load theme on startup
loadTheme();

// ===================================
// FEATURE 3: KEYBOARD SHORTCUTS
// ===================================

document.addEventListener('keydown', e => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    const key = e.key.toLowerCase();
    
    switch(key) {
        case '1':
            switchToTab('overview');
            break;
        case '2':
            switchToTab('portfolio');
            break;
        case '3':
            switchToTab('cashflow');
            break;
        case '4':
            switchToTab('goals');
            break;
        case '5':
            switchToTab('wealth');
            break;
        case '6':
            switchToTab('cre');
            break;
        case '7':
            switchToTab('performance');
            break;
        case 'r':
            e.preventDefault();
            refreshDashboard();
            break;
        case 't':
            e.preventDefault();
            toggleThemeQuick();
            break;
        case 'e':
            e.preventDefault();
            openModal('exportModal');
            break;
        case '?':
            e.preventDefault();
            openModal('shortcutsModal');
            break;
    }
});

function toggleThemeQuick() {
    const current = document.body.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem('dashboard-theme', newTheme);
    const accent = localStorage.getItem('dashboard-accent') || 'blue';
    applyTheme(newTheme, accent);
    
    showToast(`Switched to ${newTheme} theme`);
}

// Bottom nav shortcuts button
document.getElementById('shortcutsBtn').addEventListener('click', () => {
    openModal('shortcutsModal');
});

// ===================================
// FEATURE 4: EXPORT SYSTEM
// ===================================

// Bottom nav export button
document.getElementById('exportBtn').addEventListener('click', () => {
    openModal('exportModal');
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    refreshDashboard();
});

async function exportAs(format) {
    const activeTab = document.querySelector('.tab-content.active');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard_${currentTab}_${timestamp}`;
    
    showToast(`Exporting as ${format.toUpperCase()}...`);
    
    switch(format) {
        case 'pdf':
            await exportPDF(activeTab, filename);
            break;
        case 'png':
            await exportPNG(activeTab, filename);
            break;
        case 'csv':
            exportCSV(filename);
            break;
        case 'json':
            exportJSON(filename);
            break;
    }
    
    closeModal('exportModal');
}

async function exportPDF(element, filename) {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg'),
            scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${filename}.pdf`);
        
        showToast('PDF exported successfully! ');
    } catch (error) {
        console.error('PDF export failed:', error);
        showToast('PDF export failed ');
    }
}

async function exportPNG(element, filename) {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg'),
            scale: 3 // High resolution
        });
        
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
        
        showToast('PNG exported successfully! ');
    } catch (error) {
        console.error('PNG export failed:', error);
        showToast('PNG export failed ');
    }
}

function exportCSV(filename) {
    // Export sample data structure
    const data = [
        ['Metric', 'Value', 'Target', 'Progress'],
        ['Net Worth', '$518,000', '$1,000,000', '51.8%'],
        ['Monthly Deploy', '$4,167', '$4,167', '100%'],
        ['HYSA Balance', '$240,000', '$75,000', '320%'],
        ['TSLA Position', '$155,000', 'HOLD', '30%'],
        ['CRE Deals', '0', '1', '0%']
    ];
    
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('CSV exported successfully! ');
}

function exportJSON(filename) {
    // Export sample data structure
    const data = {
        timestamp: new Date().toISOString(),
        tab: tabs[currentTab],
        metrics: {
            netWorth: 518000,
            target: 1000000,
            progress: 0.518,
            monthlyDeploy: 4167,
            hysaBalance: 240000,
            tslaPosition: 155000,
            creDeals: 0
        },
        theme: {
            mode: localStorage.getItem('dashboard-theme') || 'dark',
            accent: localStorage.getItem('dashboard-accent') || 'blue'
        }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('JSON exported successfully! ');
}

// ===================================
// MODAL UTILITIES
// ===================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('visible');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('visible');
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.visible').forEach(modal => {
            modal.classList.remove('visible');
        });
    }
});

// ===================================
// INITIALIZATION
// ===================================

console.log(' Iteration 4: All interactive features loaded');
console.log(' Mobile gestures: Swipe, pull-to-refresh, long-press, pinch-zoom');
console.log(' Theme system: Dark/Light/Auto + 6 accent colors');
console.log('⌨  Keyboard shortcuts: 1-7, R, T, E, ?');
console.log(' Export system: PDF, PNG, CSV, JSON');
