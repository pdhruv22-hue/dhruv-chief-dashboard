/**
 * Mobile Gestures - Swipe & Pull-to-Refresh
 * No dependencies - vanilla JS touch events
 */

(function() {
  'use strict';

  // ============================================================================
  // SWIPE NAVIGATION (Left/Right between tabs)
  // ============================================================================
  
  let touchStartX = 0;
  let touchEndX = 0;
  const swipeThreshold = 100; // Minimum swipe distance in px
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) < swipeThreshold) return;

    const tabs = Array.from(document.querySelectorAll('.tab'));
    const activeTab = document.querySelector('.tab.active');
    const activeIndex = tabs.indexOf(activeTab);

    if (swipeDistance > 0) {
      // Swipe right → previous tab
      if (activeIndex > 0) {
        tabs[activeIndex - 1].click();
      }
    } else {
      // Swipe left → next tab
      if (activeIndex < tabs.length - 1) {
        tabs[activeIndex + 1].click();
      }
    }
  }

  // ============================================================================
  // PULL-TO-REFRESH
  // ============================================================================
  
  let pullStartY = 0;
  let pullDistance = 0;
  let isPulling = false;
  let refreshIndicator = null;

  function createRefreshIndicator() {
    if (refreshIndicator) return;
    
    refreshIndicator = document.createElement('div');
    refreshIndicator.id = 'refresh-indicator';
    refreshIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
      z-index: 1000;
      font-size: 13px;
      color: var(--muted);
    `;
    refreshIndicator.innerHTML = '<span style="margin-right: 8px;">↓</span> Pull to refresh';
    document.body.appendChild(refreshIndicator);
  }

  function updateRefreshIndicator(distance) {
    if (!refreshIndicator) return;
    
    const maxPull = 120;
    const progress = Math.min(distance / maxPull, 1);
    
    if (progress > 0.8) {
      refreshIndicator.innerHTML = '<span style="margin-right: 8px;">↑</span> Release to refresh';
      refreshIndicator.style.color = 'var(--accent)';
    } else {
      refreshIndicator.innerHTML = '<span style="margin-right: 8px;">↓</span> Pull to refresh';
      refreshIndicator.style.color = 'var(--muted)';
    }
    
    refreshIndicator.style.transform = `translateY(${-60 + (60 * progress)}px)`;
  }

  function triggerRefresh() {
    if (!refreshIndicator) return;
    
    refreshIndicator.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span> Refreshing...';
    refreshIndicator.style.transform = 'translateY(0)';
    
    // Reload current tab data
    reloadActiveTab().then(() => {
      setTimeout(() => {
        refreshIndicator.style.transform = 'translateY(-100%)';
        setTimeout(() => {
          refreshIndicator.innerHTML = '<span style="margin-right: 8px;"></span> Updated';
        }, 150);
      }, 500);
    });
  }

  async function reloadActiveTab() {
    const activePanel = document.querySelector('.tab-panel.active');
    if (!activePanel) return;
    
    const panelId = activePanel.id;
    console.log(`Refreshing ${panelId}...`);
    
    // Trigger data reload
    if (window.loadAllCharts) {
      await window.loadAllCharts();
    }
    
    // Dispatch custom event for tab-specific refresh logic
    document.dispatchEvent(new CustomEvent('tab-refresh', { detail: { panelId } }));
  }

  // Pull-to-refresh touch handlers
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      pullStartY = e.touches[0].clientY;
      isPulling = true;
      createRefreshIndicator();
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    pullDistance = currentY - pullStartY;
    
    if (pullDistance > 0 && window.scrollY === 0) {
      updateRefreshIndicator(pullDistance);
      
      // Add slight resistance
      if (pullDistance > 80) {
        e.preventDefault();
      }
    } else {
      isPulling = false;
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!isPulling) return;
    
    isPulling = false;
    
    if (pullDistance > 100) {
      triggerRefresh();
    } else if (refreshIndicator) {
      refreshIndicator.style.transform = 'translateY(-100%)';
    }
    
    pullDistance = 0;
  }, { passive: true });

  // ============================================================================
  // LONG-PRESS (Context Menu Trigger)
  // ============================================================================
  
  let longPressTimer = null;
  let longPressTarget = null;

  document.addEventListener('touchstart', (e) => {
    const target = e.target.closest('[data-long-press]');
    if (!target) return;
    
    longPressTarget = target;
    longPressTimer = setTimeout(() => {
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Trigger custom long-press event
      target.dispatchEvent(new CustomEvent('long-press', { bubbles: true }));
      longPressTarget = null;
    }, 500);
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressTarget = null;
  }, { passive: true });

  document.addEventListener('touchmove', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });

  // ============================================================================
  // DOUBLE-TAP TO ZOOM (Charts)
  // ============================================================================
  
  let lastTapTime = 0;
  
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      const target = e.target.closest('canvas, svg, [data-zoomable]');
      if (target) {
        // Trigger zoom/fullscreen
        if (target.requestFullscreen) {
          target.requestFullscreen().catch(() => {
            // Fallback: add fullscreen class for CSS-based zoom
            target.classList.toggle('zoomed');
          });
        } else {
          target.classList.toggle('zoomed');
        }
      }
    }
    
    lastTapTime = now;
  }, { passive: true });

  // CSS for zoomed state
  const style = document.createElement('style');
  style.textContent = `
    .zoomed {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9999 !important;
      background: var(--bg) !important;
      padding: 20px !important;
    }
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--muted);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  console.log(' Mobile gestures initialized');
})();
