/**
 * Export System - PDF, CSV, PNG, JSON
 * Uses html2canvas for screenshots, jsPDF for PDF generation
 */

(function() {
  'use strict';

  class ExportManager {
    constructor() {
      this.createExportButton();
      this.loadLibraries();
    }

    async loadLibraries() {
      // Load html2canvas for screenshots
      if (!window.html2canvas) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      }

      // Load jsPDF for PDF generation
      if (!window.jspdf) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      }
    }

    loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    createExportButton() {
      const tabs = document.querySelector('.tabs');
      if (!tabs) return;

      const exportBtn = document.createElement('button');
      exportBtn.className = 'export-btn';
      exportBtn.innerHTML = '';
      exportBtn.title = 'Export (E)';
      exportBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--text);
        font-size: 16px;
        cursor: pointer;
        padding: 14px 18px;
        transition: opacity 0.15s;
      `;
      exportBtn.addEventListener('click', () => {
        this.showExportMenu();
      });

      tabs.appendChild(exportBtn);
    }

    showExportMenu() {
      const overlay = document.createElement('div');
      overlay.className = 'export-menu-overlay';
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

      const menu = document.createElement('div');
      menu.style.cssText = `
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 400px;
        animation: slideUp 0.3s ease;
      `;

      const activePanel = document.querySelector('.tab-panel.active');
      const panelName = activePanel ? activePanel.id.replace('-panel', '') : 'current';

      menu.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Export ${panelName.toUpperCase()} Tab</h3>
        
        <button class="export-option" data-type="pdf" style="${this.buttonStyle()}">
           Export as PDF
        </button>

        <button class="export-option" data-type="png" style="${this.buttonStyle()}">
           Export as PNG
        </button>

        <button class="export-option" data-type="csv" style="${this.buttonStyle()}">
           Export tables as CSV
        </button>

        <button class="export-option" data-type="json" style="${this.buttonStyle()}">
           Export data as JSON
        </button>

        <button class="close-export" style="${this.buttonStyle('var(--surface2)')}">
          Cancel
        </button>
      `;

      overlay.appendChild(menu);
      document.body.appendChild(overlay);

      // Handle export type selection
      menu.querySelectorAll('.export-option').forEach(btn => {
        btn.addEventListener('click', async () => {
          const type = btn.dataset.type;
          overlay.remove();
          await this.export(type, activePanel);
        });
      });

      // Close handler
      menu.querySelector('.close-export').addEventListener('click', () => {
        overlay.remove();
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });
    }

    buttonStyle(bg = 'var(--accent)') {
      return `
        width: 100%;
        padding: 12px;
        background: ${bg};
        color: ${bg === 'var(--accent)' ? 'white' : 'var(--text)'};
        border: ${bg === 'var(--surface2)' ? '1px solid var(--border)' : 'none'};
        border-radius: 6px;
        margin-bottom: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        text-align: left;
        transition: opacity 0.2s;
      `;
    }

    async export(type, panel) {
      const panelName = panel ? panel.id.replace('-panel', '') : 'dashboard';

      this.showLoadingToast('Preparing export...');

      try {
        switch (type) {
          case 'pdf':
            await this.exportPDF(panel, panelName);
            break;
          case 'png':
            await this.exportPNG(panel, panelName);
            break;
          case 'csv':
            await this.exportCSV(panel, panelName);
            break;
          case 'json':
            await this.exportJSON(panel, panelName);
            break;
        }
      } catch (error) {
        console.error('Export error:', error);
        this.showToast(' Export failed. Check console.');
      }
    }

    async exportPDF(panel, name) {
      if (!window.html2canvas || !window.jspdf) {
        this.showToast(' Export libraries not loaded');
        return;
      }

      // Capture panel as canvas
      const canvas = await html2canvas(panel, {
        scale: 2,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg'),
        logging: false
      });

      // Convert to PDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);

      // Download
      const filename = `${name}_${this.timestamp()}.pdf`;
      pdf.save(filename);

      this.showToast(` PDF exported: ${filename}`);
    }

    async exportPNG(panel, name) {
      if (!window.html2canvas) {
        this.showToast(' Export library not loaded');
        return;
      }

      const canvas = await html2canvas(panel, {
        scale: 2,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg'),
        logging: false
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}_${this.timestamp()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        this.showToast(` PNG exported`);
      });
    }

    async exportCSV(panel, name) {
      // Find all tables in panel
      const tables = panel.querySelectorAll('.data-table, table');
      
      if (tables.length === 0) {
        this.showToast('No tables found to export');
        return;
      }

      let csvContent = '';

      tables.forEach((table, index) => {
        if (index > 0) csvContent += '\n\n';

        // Extract table data
        const rows = table.querySelectorAll('tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td, th');
          const rowData = Array.from(cells).map(cell => {
            // Clean cell content
            let text = cell.textContent.trim();
            // Escape quotes
            text = text.replace(/"/g, '""');
            return `"${text}"`;
          });
          csvContent += rowData.join(',') + '\n';
        });
      });

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}_${this.timestamp()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      this.showToast(` CSV exported (${tables.length} table${tables.length > 1 ? 's' : ''})`);
    }

    async exportJSON(panel, name) {
      // Get current tab data from API
      const token = localStorage.getItem('dashboard_token') || sessionStorage.getItem('dashboard_token') || '';
      
      try {
        const response = await fetch(`/api/${name}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('API call failed');

        const data = await response.json();

        // Pretty-print JSON
        const jsonStr = JSON.stringify(data, null, 2);

        // Download
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}_${this.timestamp()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        this.showToast(` JSON exported`);
      } catch (error) {
        this.showToast(` Failed to fetch data for ${name}`);
      }
    }

    timestamp() {
      return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }

    showLoadingToast(message) {
      const toast = document.createElement('div');
      toast.id = 'export-loading-toast';
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
      `;

      document.body.appendChild(toast);
    }

    showToast(message) {
      const existingToast = document.getElementById('export-loading-toast');
      if (existingToast) existingToast.remove();

      const toast = document.createElement('div');
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
      }, 3000);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.exportManager = new ExportManager();
    });
  } else {
    window.exportManager = new ExportManager();
  }

  console.log(' Export system initialized');
})();
