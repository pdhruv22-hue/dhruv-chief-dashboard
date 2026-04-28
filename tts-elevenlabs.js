/**
 * ElevenLabs TTS Integration for Dashboard
 * Premium voice narration with advanced controls
 */

class DashboardTTS {
  constructor() {
    this.apiKey = null;
    this.voices = [];
    this.selectedVoice = null;
    this.audioQueue = [];
    this.currentAudio = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.speed = 1.0;
    this.pitch = 1.0;
    this.autoPlayNext = true;
    
    // Phonetic corrections for financial terms
    this.phoneticMap = {
      'TSLA': 'Tesla',
      'QQQ': 'triple Q',
      'SPY': 'S P Y',
      'VOO': 'V O O',
      'VIG': 'V I G',
      'XPEV': 'X peng',
      'LCID': 'Lucid',
      'VTI': 'V T I',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'NNN': 'triple net',
      'NOI': 'N O I',
      'HYSA': 'high yield savings account',
      'CRE': 'commercial real estate',
      'CAGR': 'C A G R',
      'YTD': 'year to date',
      'ATH': 'all time high'
    };
    
    this.init();
  }
  
  async init() {
    // Try to load API key from config
    const apiKey = await this.loadApiKey();
    if (apiKey) {
      this.apiKey = apiKey;
      await this.loadVoices();
    }
    this.createUI();
  }
  
  async loadApiKey() {
    try {
      const response = await fetch('/api/config/elevenlabs-key');
      if (response.ok) {
        const data = await response.json();
        return data.key;
      }
    } catch (e) {
      console.warn('ElevenLabs API key not configured');
    }
    return null;
  }
  
  async loadVoices() {
    if (!this.apiKey) return;
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.voices = data.voices || [];
        // Default to first voice
        if (this.voices.length > 0 && !this.selectedVoice) {
          this.selectedVoice = this.voices[0].voice_id;
        }
      }
    } catch (e) {
      console.error('Failed to load ElevenLabs voices:', e);
    }
  }
  
  createUI() {
    const container = document.createElement('div');
    container.id = 'tts-controls';
    container.innerHTML = `
      <div class="tts-panel" style="display: none;">
        <div class="tts-header">
          <div class="tts-title"> Voice Narration</div>
          <button class="tts-close" onclick="tts.hideControls()">×</button>
        </div>
        
        <div class="tts-section">
          <label>Voice</label>
          <select id="tts-voice-select" onchange="tts.changeVoice(this.value)">
            <option value="">-- Select Voice --</option>
          </select>
        </div>
        
        <div class="tts-section">
          <label>Speed: <span id="tts-speed-value">1.0</span>x</label>
          <input type="range" id="tts-speed" min="0.5" max="2.0" step="0.1" value="1.0" 
                 oninput="tts.setSpeed(this.value)">
        </div>
        
        <div class="tts-section">
          <label>Pitch: <span id="tts-pitch-value">1.0</span></label>
          <input type="range" id="tts-pitch" min="0.8" max="1.2" step="0.05" value="1.0"
                 oninput="tts.setPitch(this.value)">
        </div>
        
        <div class="tts-controls-row">
          <button class="btn btn-primary" onclick="tts.play()" id="tts-play-btn">
             Play
          </button>
          <button class="btn btn-outline" onclick="tts.pause()" id="tts-pause-btn" disabled>
             Pause
          </button>
          <button class="btn btn-outline" onclick="tts.stop()">
             Stop
          </button>
          <button class="btn btn-outline" onclick="tts.skip()">
             Skip
          </button>
        </div>
        
        <div class="tts-queue" id="tts-queue"></div>
        
        <div class="tts-section">
          <label>Quick Narrate</label>
          <div class="tts-quick-buttons">
            <button class="btn btn-sm btn-outline" onclick="tts.narrateBriefing()">
               Today's Briefing
            </button>
            <button class="btn btn-sm btn-outline" onclick="tts.narrateWealth()">
               Wealth Summary
            </button>
            <button class="btn btn-sm btn-outline" onclick="tts.narrateCRE()">
               CRE Deals
            </button>
            <button class="btn btn-sm btn-outline" onclick="tts.narrateGoals()">
               Sprint Goals
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.updateVoiceSelect();
    
    // Add TTS button to header
    this.addHeaderButton();
  }
  
  addHeaderButton() {
    const tabs = document.querySelector('.tabs');
    if (tabs) {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.innerHTML = '';
      btn.title = 'Voice Narration';
      btn.onclick = () => this.showControls();
      tabs.appendChild(btn);
    }
  }
  
  updateVoiceSelect() {
    const select = document.getElementById('tts-voice-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select Voice --</option>';
    this.voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voice_id;
      option.textContent = `${voice.name} (${voice.labels?.accent || 'default'})`;
      if (voice.voice_id === this.selectedVoice) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }
  
  showControls() {
    const panel = document.querySelector('.tts-panel');
    if (panel) {
      panel.style.display = 'block';
    }
  }
  
  hideControls() {
    const panel = document.querySelector('.tts-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
  
  changeVoice(voiceId) {
    this.selectedVoice = voiceId;
  }
  
  setSpeed(value) {
    this.speed = parseFloat(value);
    document.getElementById('tts-speed-value').textContent = value;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.speed;
    }
  }
  
  setPitch(value) {
    this.pitch = parseFloat(value);
    document.getElementById('tts-pitch-value').textContent = value;
  }
  
  applyPhoneticCorrections(text) {
    let corrected = text;
    for (const [ticker, spoken] of Object.entries(this.phoneticMap)) {
      const regex = new RegExp(`\\b${ticker}\\b`, 'g');
      corrected = corrected.replace(regex, spoken);
    }
    return corrected;
  }
  
  chunkText(text, maxWords = 200) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';
    let wordCount = 0;
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).length;
      if (wordCount + words > maxWords && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        wordCount = words;
      } else {
        currentChunk += ' ' + sentence;
        wordCount += words;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  addSSMLPauses(text) {
    // Add natural pauses after sentences
    let ssml = text
      .replace(/\.\s+/g, '. <break time="500ms"/> ')
      .replace(/!\s+/g, '! <break time="400ms"/> ')
      .replace(/\?\s+/g, '? <break time="500ms"/> ')
      .replace(/:\s+/g, ': <break time="300ms"/> ');
    
    return `<speak>${ssml}</speak>`;
  }
  
  async synthesize(text) {
    if (!this.apiKey || !this.selectedVoice) {
      throw new Error('TTS not configured');
    }
    
    const correctedText = this.applyPhoneticCorrections(text);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.selectedVoice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: correctedText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('TTS synthesis failed');
    }
    
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }
  
  async queueText(text, title = '') {
    const chunks = this.chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      this.audioQueue.push({
        text: chunks[i],
        title: title + (chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : ''),
        audioUrl: null
      });
    }
    this.updateQueueUI();
  }
  
  updateQueueUI() {
    const queueEl = document.getElementById('tts-queue');
    if (!queueEl) return;
    
    if (this.audioQueue.length === 0) {
      queueEl.innerHTML = '<div class="tts-queue-empty">Queue empty</div>';
      return;
    }
    
    queueEl.innerHTML = '<div class="tts-queue-title">Queue:</div>';
    this.audioQueue.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'tts-queue-item' + (i === 0 ? ' active' : '');
      div.textContent = item.title || `Chunk ${i + 1}`;
      queueEl.appendChild(div);
    });
  }
  
  async play() {
    if (this.isPaused && this.currentAudio) {
      this.currentAudio.play();
      this.isPaused = false;
      this.updatePlayButton(true);
      return;
    }
    
    if (this.audioQueue.length === 0) {
      alert('Nothing to play. Click a "Quick Narrate" button first.');
      return;
    }
    
    this.isPlaying = true;
    this.updatePlayButton(true);
    
    await this.playNext();
  }
  
  async playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.updatePlayButton(false);
      return;
    }
    
    const item = this.audioQueue.shift();
    this.updateQueueUI();
    
    try {
      if (!item.audioUrl) {
        item.audioUrl = await this.synthesize(item.text);
      }
      
      this.currentAudio = new Audio(item.audioUrl);
      this.currentAudio.playbackRate = this.speed;
      
      this.currentAudio.onended = () => {
        if (this.autoPlayNext && this.isPlaying) {
          this.playNext();
        } else {
          this.isPlaying = false;
          this.updatePlayButton(false);
        }
      };
      
      await this.currentAudio.play();
      
    } catch (e) {
      console.error('TTS playback error:', e);
      alert('Voice synthesis failed. Check API key.');
      this.isPlaying = false;
      this.updatePlayButton(false);
    }
  }
  
  pause() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPaused = true;
      this.updatePlayButton(false);
    }
  }
  
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.audioQueue = [];
    this.updateQueueUI();
    this.updatePlayButton(false);
  }
  
  skip() {
    if (this.isPlaying) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      this.playNext();
    }
  }
  
  updatePlayButton(playing) {
    const playBtn = document.getElementById('tts-play-btn');
    const pauseBtn = document.getElementById('tts-pause-btn');
    if (playBtn) playBtn.disabled = playing;
    if (pauseBtn) pauseBtn.disabled = !playing;
  }
  
  // Quick narrate functions
  async narrateBriefing() {
    const briefing = window.dashboardData?.briefing?.text || 
                    document.querySelector('#briefing-content')?.textContent;
    if (briefing) {
      await this.queueText(briefing, "Today's Briefing");
    }
  }
  
  async narrateWealth() {
    const netWorth = window.dashboardData?.wealth?.total_net_worth || 0;
    const liquid = window.dashboardData?.wealth?.liquid || 0;
    const text = `Your current net worth is ${this.formatCurrency(netWorth)}. ` +
                 `Liquid assets total ${this.formatCurrency(liquid)}.`;
    await this.queueText(text, 'Wealth Summary');
  }
  
  async narrateCRE() {
    const deals = window.dashboardData?.cre_pipeline?.deals || [];
    if (deals.length === 0) {
      await this.queueText('No CRE deals in pipeline.', 'CRE Deals');
      return;
    }
    
    let text = `You have ${deals.length} CRE deal${deals.length > 1 ? 's' : ''} in your pipeline. `;
    deals.slice(0, 3).forEach((deal, i) => {
      text += `Deal ${i + 1}: ${deal.property_type || 'Property'} with ${deal.tenant || 'tenant'}, ` +
              `cap rate ${deal.cap_rate}%, asking ${this.formatCurrency(deal.price)}. `;
    });
    
    await this.queueText(text, 'CRE Deals');
  }
  
  async narrateGoals() {
    const goals = window.dashboardData?.sprint_goals || [];
    if (goals.length === 0) {
      await this.queueText('No active sprint goals.', 'Sprint Goals');
      return;
    }
    
    let text = `You have ${goals.length} active sprint goals. `;
    goals.slice(0, 5).forEach((goal, i) => {
      text += `Goal ${i + 1}: ${goal.title}, deadline ${goal.deadline}. `;
    });
    
    await this.queueText(text, 'Sprint Goals');
  }
  
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}

// Initialize TTS
const tts = new DashboardTTS();
