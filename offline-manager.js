/**
 * Offline Manager for Progressive Web App Features
 * Handles offline detection, IndexedDB sync, and install prompts
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.db = null;
    this.deferredPrompt = null;
    this.syncQueue = [];
    
    this.init();
  }
  
  async init() {
    await this.initDB();
    this.registerServiceWorker();
    this.setupEventListeners();
    this.checkOnlineStatus();
    this.setupInstallPrompt();
    this.createUI();
  }
  
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChiefDashboard', 1);
      
      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Offline] IndexedDB initialized');
        resolve();
      };
      
      request.onupgradeneeded = event => {
        const db = event.target.result;
        
        // Action queue for offline actions
        if (!db.objectStoreNames.contains('actionQueue')) {
          const actionStore = db.createObjectStore('actionQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Dashboard data cache
        if (!db.objectStoreNames.contains('dashboardData')) {
          db.createObjectStore('dashboardData', { keyPath: 'key' });
        }
      };
    });
  }
  
  registerServiceWorker() { /* DISABLED - causes caching issues 2026-04-23 */ return; }
  
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.syncQueuedActions();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
    });
    
    // Intercept fetch for queuing
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'BACKGROUND_SYNC_COMPLETE') {
          this.syncQueuedActions();
        }
      });
    }
  }
  
  checkOnlineStatus() {
    this.updateOnlineStatus();
  }
  
  updateOnlineStatus() {
    const indicator = document.getElementById('offline-indicator');
    if (!indicator) return;
    
    if (this.isOnline) {
      indicator.classList.remove('offline');
      indicator.classList.add('online');
      indicator.textContent = ' Online';
    } else {
      indicator.classList.remove('online');
      indicator.classList.add('offline');
      indicator.textContent = ' Offline';
    }
  }
  
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('[Offline] PWA installed');
      this.deferredPrompt = null;
      this.hideInstallButton();
    });
  }
  
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      alert('Install prompt not available. Try adding to home screen manually.');
      return;
    }
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[Offline] Install outcome:', outcome);
    
    this.deferredPrompt = null;
    this.hideInstallButton();
  }
  
  createUI() {
    // Offline indicator
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    document.body.appendChild(indicator);
    
    // Install button
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.className = 'pwa-install-btn';
    installBtn.innerHTML = ' Install App';
    installBtn.onclick = () => this.showInstallPrompt();
    installBtn.style.display = 'none';
    document.body.appendChild(installBtn);
    
    this.updateOnlineStatus();
  }
  
  showInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'block';
  }
  
  hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'none';
  }
  
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-message">
         New version available!
        <button onclick="offlineManager.updateApp()">Update Now</button>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
  }
  
  updateApp() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
  
  // Queue action for offline execution
  async queueAction(action) {
    if (!this.db) {
      console.error('[Offline] DB not initialized');
      return;
    }
    
    const tx = this.db.transaction('actionQueue', 'readwrite');
    const store = tx.objectStore('actionQueue');
    
    await store.add({
      ...action,
      timestamp: Date.now()
    });
    
    console.log('[Offline] Action queued:', action);
    
    // Try to sync if online
    if (this.isOnline) {
      this.syncQueuedActions();
    }
  }
  
  // Sync queued actions when back online
  async syncQueuedActions() {
    if (!this.db || !this.isOnline) return;
    
    const tx = this.db.transaction('actionQueue', 'readonly');
    const store = tx.objectStore('actionQueue');
    const actions = await this.getAllFromStore(store);
    
    if (actions.length === 0) return;
    
    console.log('[Offline] Syncing', actions.length, 'queued actions');
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...action.headers
          },
          body: action.body
        });
        
        if (response.ok) {
          // Remove from queue
          await this.removeFromQueue(action.id);
          console.log('[Offline] Synced action:', action.id);
        } else {
          console.error('[Offline] Sync failed for action:', action.id, response.status);
        }
      } catch (e) {
        console.error('[Offline] Network error syncing action:', action.id, e);
      }
    }
    
    // Request background sync if supported
    if ('sync' in registration) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-dashboard-actions');
    }
  }
  
  async removeFromQueue(id) {
    if (!this.db) return;
    
    const tx = this.db.transaction('actionQueue', 'readwrite');
    const store = tx.objectStore('actionQueue');
    await store.delete(id);
  }
  
  getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Cache dashboard data locally
  async cacheDashboardData(data) {
    if (!this.db) return;
    
    const tx = this.db.transaction('dashboardData', 'readwrite');
    const store = tx.objectStore('dashboardData');
    
    await store.put({
      key: 'latest',
      data,
      timestamp: Date.now()
    });
    
    console.log('[Offline] Dashboard data cached');
  }
  
  // Get cached dashboard data
  async getCachedDashboardData() {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('dashboardData', 'readonly');
      const store = tx.objectStore('dashboardData');
      const request = store.get('latest');
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
          // Cache valid for 24 hours
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize offline manager
const offlineManager = new OfflineManager();

// Expose queue action globally for other modules
window.queueOfflineAction = (action) => offlineManager.queueAction(action);
