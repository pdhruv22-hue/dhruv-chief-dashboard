/**
 * Natural Language Query Interface
 * Chat-style data exploration using DeepSeek Chat via OpenRouter
 */

class NLPQuery {
  constructor() {
    this.apiKey = null;
    this.model = 'anthropic/claude-haiku-4-5';
    this.queryHistory = [];
    this.maxHistory = 10;
    this.isProcessing = false;
    
    this.init();
  }
  
  async init() {
    this.apiKey = await this.loadApiKey();
    this.loadHistory();
    this.createUI();
  }
  
  async loadApiKey() {
    try {
      const response = await fetch('/api/config/openrouter-key');
      if (response.ok) {
        const data = await response.json();
        return data.key;
      }
    } catch (e) {
      console.warn('OpenRouter API key not configured');
    }
    return null;
  }
  
  loadHistory() {
    const saved = localStorage.getItem('nlp-query-history');
    if (saved) {
      try {
        this.queryHistory = JSON.parse(saved);
      } catch (e) {
        this.queryHistory = [];
      }
    }
  }
  
  saveHistory() {
    localStorage.setItem('nlp-query-history', JSON.stringify(this.queryHistory.slice(-this.maxHistory)));
  }
  
  createUI() {
    const container = document.createElement('div');
    container.id = 'nlp-query-panel';
    container.innerHTML = `
      <div class="nlp-panel" style="display: none;">
        <div class="nlp-header">
          <div class="nlp-title"> Ask Your Dashboard</div>
          <button class="nlp-close" onclick="nlpQuery.hide()">Ã—</button>
        </div>
        
        <div class="nlp-chat" id="nlp-chat"></div>
        
        <div class="nlp-suggestions" id="nlp-suggestions">
          <div class="nlp-suggestion-label">Try asking:</div>
          <button class="nlp-suggest-btn" onclick="nlpQuery.askSuggestion(this.textContent)">
            Show me CRE deals above 9% cap
          </button>
          <button class="nlp-suggest-btn" onclick="nlpQuery.askSuggestion(this.textContent)">
            What's my portfolio allocation to tech?
          </button>
          <button class="nlp-suggest-btn" onclick="nlpQuery.askSuggestion(this.textContent)">
            When is my next goal deadline?
          </button>
          <button class="nlp-suggest-btn" onclick="nlpQuery.askSuggestion(this.textContent)">
            Compare this month vs last month deploy
          </button>
        </div>
        
        <div class="nlp-input-row">
          <input type="text" id="nlp-input" placeholder="Ask about your data..." 
                 onkeypress="if(event.key==='Enter') nlpQuery.ask()">
          <button class="btn btn-primary" onclick="nlpQuery.ask()" id="nlp-send-btn">
            Send
          </button>
        </div>
        
        <div class="nlp-history" id="nlp-history"></div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.updateHistory();
    
    // Add NLP button to header
    this.addHeaderButton();
  }
  
  addHeaderButton() {
    const tabs = document.querySelector('.tabs');
    if (tabs) {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.innerHTML = '';
      btn.title = 'Natural Language Query';
      btn.onclick = () => this.show();
      tabs.appendChild(btn);
    }
  }
  
  show() {
    const panel = document.querySelector('.nlp-panel');
    if (panel) {
      panel.style.display = 'block';
      document.getElementById('nlp-input')?.focus();
    }
  }
  
  hide() {
    const panel = document.querySelector('.nlp-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
  
  askSuggestion(text) {
    document.getElementById('nlp-input').value = text;
    this.ask();
  }
  
  async ask() {
    const input = document.getElementById('nlp-input');
    const query = input.value.trim();
    
    if (!query || this.isProcessing) return;
    
    this.isProcessing = true;
    this.updateSendButton(true);
    
    // Add user message to chat
    this.addChatMessage('user', query);
    input.value = '';
    
    try {
      const response = await this.queryLLM(query);
      this.addChatMessage('assistant', response);
      
      // Save to history
      this.queryHistory.push({
        query,
        response,
        timestamp: Date.now()
      });
      this.saveHistory();
      this.updateHistory();
      
    } catch (e) {
      console.error('NLP query failed:', e);
      this.addChatMessage('error', 'Sorry, I encountered an error processing your query.');
    }
    
    this.isProcessing = false;
    this.updateSendButton(false);
  }
  
  async queryLLM(query) {
    if (!this.apiKey) {
      return 'OpenRouter API key not configured. Please set it in dashboard config.';
    }
    
    // Gather dashboard data context
    const context = this.buildContext();
    
    const systemPrompt = `You are a financial dashboard assistant helping Dhruv Patel analyze his wealth, investments, and goals.

Current dashboard data:
${JSON.stringify(context, null, 2)}

Answer questions concisely and accurately based on this data. Format numbers with appropriate currency/percentage symbols. If data is missing, say so clearly.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Chief Dashboard'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated.';
  }
  
  buildContext() {
    const data = window.dashboardData || {};
    
    return {
      wealth: {
        total_net_worth: data.wealth?.total_net_worth,
        liquid: data.wealth?.liquid,
        crypto: data.wealth?.crypto,
        holdings: data.holdings || []
      },
      cre_pipeline: {
        deals: (data.cre_pipeline?.deals || []).map(d => ({
          tenant: d.tenant,
          cap_rate: d.cap_rate,
          price: d.price,
          property_type: d.property_type,
          location: d.location,
          status: d.status
        }))
      },
      sprint_goals: (data.sprint_goals || []).map(g => ({
        title: g.title,
        deadline: g.deadline,
        status: g.status,
        progress: g.progress
      })),
      deploy_history: data.deploy_history || [],
      market_data: data.market_data || {}
    };
  }
  
  addChatMessage(role, content) {
    const chat = document.getElementById('nlp-chat');
    if (!chat) return;
    
    const msg = document.createElement('div');
    msg.className = `nlp-message nlp-message-${role}`;
    
    if (role === 'user') {
      msg.innerHTML = `<div class="nlp-msg-label">You:</div><div class="nlp-msg-content">${this.escapeHtml(content)}</div>`;
    } else if (role === 'assistant') {
      msg.innerHTML = `<div class="nlp-msg-label">Assistant:</div><div class="nlp-msg-content">${this.formatResponse(content)}</div>`;
    } else if (role === 'error') {
      msg.innerHTML = `<div class="nlp-msg-label">Error:</div><div class="nlp-msg-content">${this.escapeHtml(content)}</div>`;
    }
    
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }
  
  formatResponse(text) {
    // Basic markdown-like formatting
    return this.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  updateHistory() {
    const historyEl = document.getElementById('nlp-history');
    if (!historyEl) return;
    
    if (this.queryHistory.length === 0) {
      historyEl.innerHTML = '';
      return;
    }
    
    historyEl.innerHTML = '<div class="nlp-history-title">Recent Queries:</div>';
    
    // Show last 5 queries
    const recent = this.queryHistory.slice(-5).reverse();
    recent.forEach(item => {
      const div = document.createElement('div');
      div.className = 'nlp-history-item';
      div.textContent = item.query;
      div.onclick = () => {
        document.getElementById('nlp-input').value = item.query;
      };
      historyEl.appendChild(div);
    });
  }
  
  updateSendButton(processing) {
    const btn = document.getElementById('nlp-send-btn');
    if (btn) {
      btn.disabled = processing;
      btn.textContent = processing ? '...' : 'Send';
    }
  }
}

// Auto-complete suggestions based on dashboard data
class NLPAutoComplete {
  constructor(nlpQuery) {
    this.nlp = nlpQuery;
    this.suggestions = [];
    this.generateSuggestions();
  }
  
  generateSuggestions() {
    const data = window.dashboardData || {};
    
    this.suggestions = [
      'Show me all CRE deals',
      'What is my net worth?',
      'List my top holdings',
      'Show deals above 8% cap rate',
      'What goals are overdue?',
      'Compare my deploy progress',
      'What is my TSLA allocation?',
      'Show me tech stocks',
      'When is my next deadline?',
      'What is my liquid cash?'
    ];
    
    // Add dynamic suggestions based on actual data
    if (data.holdings) {
      const tickers = data.holdings.map(h => h.ticker).slice(0, 3);
      tickers.forEach(t => {
        this.suggestions.push(`What is my ${t} position?`);
      });
    }
  }
  
  getSuggestions(partial) {
    if (!partial || partial.length < 2) return [];
    
    const lower = partial.toLowerCase();
    return this.suggestions
      .filter(s => s.toLowerCase().includes(lower))
      .slice(0, 5);
  }
}

// Initialize NLP Query
const nlpQuery = new NLPQuery();
