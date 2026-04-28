// ===================================
// CRE SESSION MANAGER
// Integrates with existing CRE_PIPELINE_DATA
// ===================================

let creSessionData = {
    deals: [],
    watchList: [],
    notes: [],
    sessionHistory: [],
    filters: {
        capMin: 0,
        geography: 'All',
        sort: 'date_new',
        watchOnly: false
    }
};

let currentSession = null;
let sessionTimer = null;
let sessionStartTime = null;

// Initialize from existing pipeline data
function initCRESession() {
    if (window.CRE_PIPELINE_DATA && window.CRE_PIPELINE_DATA.deals) {
        creSessionData.deals = window.CRE_PIPELINE_DATA.deals.map(deal => ({
            ...deal,
            watched: false,
            user_notes: deal.notes || '',
            rent_annual: (deal.monthly_rent || 0) * 12
        }));
    }
    
    // Load from localStorage first (fast)
    const stored = localStorage.getItem('cre_session_data');
    if (stored) {
        const parsed = JSON.parse(stored);
        creSessionData.watchList = parsed.watchList || [];
        creSessionData.notes = parsed.notes || [];
        creSessionData.sessionHistory = parsed.sessionHistory || [];
        
        // Merge watch status
        creSessionData.watchList.forEach(watchedId => {
            const deal = creSessionData.deals.find(d => d.id === watchedId);
            if (deal) deal.watched = true;
        });
    }
    
    renderCRETab();

    // Then overlay with server state (async, non-blocking)
    if (window.API && window.API.token) {
        window.API.get('/api/actions/cre-watch').then(data => {
            if (!data || !data.ok || !data.deals.length) return;
            const serverWatched = data.deals.map(d => d.deal_id);
            creSessionData.watchList = serverWatched;
            creSessionData.deals.forEach(deal => {
                deal.watched = serverWatched.includes(deal.id);
                // Restore server notes
                const serverDeal = data.deals.find(d => d.deal_id === deal.id);
                if (serverDeal && serverDeal.notes) deal.user_notes = serverDeal.notes;
            });
            saveCRESession();
            renderCRETab();
            renderCREWatchList();
        });
    }
}

function saveCRESession() {
    localStorage.setItem('cre_session_data', JSON.stringify({
        watchList: creSessionData.watchList,
        notes: creSessionData.notes,
        sessionHistory: creSessionData.sessionHistory
    }));
}

// ===================================
// DEAL CARD RENDERING
// ===================================

function createDealCard(deal) {
    const capColor = deal.cap_rate >= 8.5 ? 'var(--green)' : deal.cap_rate >= 7.5 ? 'var(--yellow)' : 'var(--muted)';
    const starIcon = deal.watched ? '' : '';
    const starClass = deal.watched ? 'watched' : '';
    
    return `
        <div class="deal-card cre-deal-card" data-deal-id="${deal.id}" style="background: var(--surface); padding: 20px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <strong style="font-size: 16px;">${deal.name}</strong>
                    <div style="color: var(--muted); font-size: 13px; margin-top: 4px;">
                        ${deal.lease_years}-year lease • ${deal.tenant_credit || 'N/A'} tenant
                    </div>
                    <div style="color: var(--muted); font-size: 12px; margin-top: 2px;">
                         ${deal.address || deal.state || 'Location TBD'}
                    </div>
                </div>
                <div style="background: ${capColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                    ${deal.cap_rate}% Cap
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                <div>
                    <div style="color: var(--muted); font-size: 11px;">Price</div>
                    <div style="font-weight: 600; margin-top: 2px;">$${(deal.asking_price / 1000000).toFixed(2)}M</div>
                </div>
                <div>
                    <div style="color: var(--muted); font-size: 11px;">NOI</div>
                    <div style="font-weight: 600; margin-top: 2px;">$${(deal.noi / 1000).toFixed(0)}K/yr</div>
                </div>
                <div>
                    <div style="color: var(--muted); font-size: 11px;">Monthly</div>
                    <div style="font-weight: 600; margin-top: 2px;">$${(deal.monthly_rent || 0).toLocaleString()}</div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border);">
                <button class="cre-action-btn call-broker" onclick="creCallBroker('${deal.id}')" 
                    style="background: var(--accent); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    
                </button>
                <button class="cre-action-btn request-om" onclick="creRequestOM('${deal.id}')"
                    style="background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    
                </button>
                <button class="cre-action-btn watch-btn ${starClass}" onclick="creToggleWatch('${deal.id}')"
                    style="background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    ${starIcon}
                </button>
                <button class="cre-action-btn run-numbers" onclick="creOpenProForma('${deal.id}')"
                    style="background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    
                </button>
                <button class="cre-action-btn add-note" onclick="creToggleNote('${deal.id}')"
                    style="background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    
                </button>
            </div>
            
            <!-- Note Field -->
            <div class="cre-note-field" id="cre-note-${deal.id}" style="display: none; margin-top: 12px;">
                <textarea 
                    style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; min-height: 60px; resize: vertical;"
                    placeholder="Add notes about this deal..."
                    onchange="creSaveNote('${deal.id}', this.value)"
                >${deal.user_notes || ''}</textarea>
            </div>
        </div>
    `;
}

// ===================================
// ACTION HANDLERS
// ===================================

function creCallBroker(dealId) {
    const deal = creSessionData.deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const phone = deal.broker_phone || 'Not available';
    const broker = deal.broker_name || 'Unknown broker';
    
    if (phone && phone !== 'Not available') {
        navigator.clipboard.writeText(phone).then(() => {
            showCREToast(` ${broker}'s number copied: ${phone}`);
        }).catch(() => {
            showCREToast(` ${broker}: ${phone}`, 'info');
        });
    } else {
        showCREToast(` No phone number for ${broker}`, 'warning');
    }
    
    if (currentSession) {
        currentSession.broker_called = true;
        updateCRESessionProgress();
    }
}

function creRequestOM(dealId) {
    const deal = creSessionData.deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const subject = `OM Request - ${deal.name}`;
    const body = `Hi ${deal.broker_name || 'there'},

I'm interested in learning more about the ${deal.name} property. Could you please send me the Offering Memorandum?

Property: ${deal.name}
Address: ${deal.address || 'N/A'}
Cap Rate: ${deal.cap_rate}%
Price: $${(deal.asking_price / 1000000).toFixed(2)}M

Thank you,
Dhruv Patel`;
    
    const emailTemplate = `Subject: ${subject}\n\n${body}`;
    
    navigator.clipboard.writeText(emailTemplate).then(() => {
        showCREToast(' Email template copied to clipboard!');
        
        if (deal.broker_email) {
            const mailto = `mailto:${deal.broker_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
        }
    });
    
    if (currentSession) {
        currentSession.om_requested = true;
        updateCRESessionProgress();
    }
}

function creToggleWatch(dealId) {
    const deal = creSessionData.deals.find(d => d.id === dealId);
    if (!deal) return;
    
    deal.watched = !deal.watched;
    
    if (deal.watched) {
        if (!creSessionData.watchList.includes(dealId)) {
            creSessionData.watchList.push(dealId);
        }
        showCREToast(` Added ${deal.name} to watch list`);
        
        if (currentSession) {
            currentSession.deal_watched = true;
            updateCRESessionProgress();
        }
        // Persist to server
        if (window.API && window.API.token) {
            window.API.post('/api/actions/cre-watch', {
                deal_id: dealId,
                title: deal.name || dealId,
                cap_rate: deal.cap_rate || null,
                notes: deal.user_notes || ''
            });
        }
    } else {
        creSessionData.watchList = creSessionData.watchList.filter(id => id !== dealId);
        showCREToast(`Removed ${deal.name} from watch list`);
        // Remove from server
        if (window.API && window.API.token) {
            window.API.post('/api/actions/cre-watch', { deal_id: dealId, remove: true });
        }
    }
    
    saveCRESession();
    renderCRETab();
    renderCREWatchList();
}

function creToggleNote(dealId) {
    const noteField = document.getElementById(`cre-note-${dealId}`);
    if (noteField) {
        const isHidden = noteField.style.display === 'none';
        noteField.style.display = isHidden ? 'block' : 'none';
        
        if (isHidden) {
            noteField.querySelector('textarea').focus();
        }
    }
}

function creSaveNote(dealId, noteText) {
    const deal = creSessionData.deals.find(d => d.id === dealId);
    if (!deal) return;
    
    deal.user_notes = noteText;
    saveCRESession();
    showCREToast('Note saved');
    
    if (currentSession) {
        currentSession.notes_taken = true;
        updateCRESessionProgress();
    }
    // Persist to server (update watchlist notes + generic notes)
    if (window.API && window.API.token) {
        window.API.post('/api/actions/note', { tab: 'cre', item_id: dealId, content: noteText });
        if (deal.watched) {
            window.API.post('/api/actions/cre-watch', {
                deal_id: dealId,
                title: deal.name || dealId,
                cap_rate: deal.cap_rate || null,
                notes: noteText
            });
        }
    }
}

// ===================================
// PRO FORMA CALCULATOR
// ===================================

function creOpenProForma(dealId) {
    const deal = creSessionData.deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const modal = document.getElementById('creProFormaModal');
    if (!modal) return;
    
    document.getElementById('cre_pf_price').value = deal.asking_price;
    document.getElementById('cre_pf_rent').value = deal.rent_annual || (deal.monthly_rent * 12);
    document.getElementById('cre_pf_down').value = 25;
    document.getElementById('cre_pf_rate').value = 6.5;
    document.getElementById('cre_pf_term').value = 30;
    
    modal.style.display = 'flex';
    creCalculateProForma();
    
    if (currentSession) {
        currentSession.numbers_run = true;
        updateCRESessionProgress();
    }
}

function creCalculateProForma() {
    const price = parseFloat(document.getElementById('cre_pf_price').value) || 0;
    const rent = parseFloat(document.getElementById('cre_pf_rent').value) || 0;
    const downPct = parseFloat(document.getElementById('cre_pf_down').value) || 25;
    const rate = parseFloat(document.getElementById('cre_pf_rate').value) || 6.5;
    const term = parseFloat(document.getElementById('cre_pf_term').value) || 30;
    
    const capRate = price > 0 ? ((rent / price) * 100) : 0;
    const downPayment = price * (downPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = (rate / 100) / 12;
    const numPayments = term * 12;
    
    const monthlyPayment = loanAmount > 0 
        ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : 0;
    
    const annualDebt = monthlyPayment * 12;
    const noi = rent;
    const annualCashFlow = noi - annualDebt;
    const monthlyCashFlow = annualCashFlow / 12;
    const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
    const totalROI = price > 0 ? (annualCashFlow / price) * 100 : 0;
    
    document.getElementById('cre_pf_caprate').textContent = capRate.toFixed(2) + '%';
    document.getElementById('cre_pf_noi').textContent = '$' + noi.toLocaleString();
    document.getElementById('cre_pf_annual_cf').textContent = '$' + annualCashFlow.toLocaleString();
    document.getElementById('cre_pf_monthly_cf').textContent = '$' + monthlyCashFlow.toLocaleString();
    document.getElementById('cre_pf_coc').textContent = cashOnCash.toFixed(2) + '%';
    document.getElementById('cre_pf_roi').textContent = totalROI.toFixed(2) + '%';
    
    const verdict = document.getElementById('cre_pf_verdict');
    if (cashOnCash >= 8) {
        verdict.textContent = ' Good Deal!';
        verdict.style.color = 'var(--green)';
    } else if (cashOnCash >= 5) {
        verdict.textContent = ' Marginal';
        verdict.style.color = 'var(--yellow)';
    } else {
        verdict.textContent = ' Below Target';
        verdict.style.color = 'var(--red)';
    }
}

function creCloseProForma() {
    const modal = document.getElementById('creProFormaModal');
    if (modal) modal.style.display = 'none';
}

// ===================================
// SESSION MANAGEMENT
// ===================================

function creStartSession() {
    currentSession = {
        start_time: new Date().toISOString(),
        deals_reviewed: 0,
        broker_called: false,
        om_requested: false,
        deal_watched: false,
        numbers_run: false,
        notes_taken: false
    };
    
    sessionStartTime = Date.now();
    
    const modal = document.getElementById('creSessionModal');
    if (modal) {
        modal.style.display = 'flex';
        creStartSessionTimer();
        showCREToast(' CRE Session started! 60 minutes on the clock.');
    }
}

function creStartSessionTimer() {
    const timerDisplay = document.getElementById('creSessionTimer');
    if (!timerDisplay) return;
    
    const duration = 60 * 60 * 1000;
    
    sessionTimer = setInterval(() => {
        const elapsed = Date.now() - sessionStartTime;
        const remaining = Math.max(0, duration - elapsed);
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining === 0) {
            clearInterval(sessionTimer);
            showCREToast(' Session time complete!');
        }
    }, 1000);
}

function updateCRESessionProgress() {
    if (!currentSession) return;
    
    const checklist = [
        currentSession.deals_reviewed >= 3,
        currentSession.broker_called,
        currentSession.om_requested,
        currentSession.deal_watched,
        currentSession.numbers_run,
        currentSession.notes_taken
    ];
    
    const completed = checklist.filter(Boolean).length;
    const total = checklist.length;
    
    checklist.forEach((done, index) => {
        const checkbox = document.getElementById(`cre_check_${index}`);
        if (checkbox) checkbox.checked = done;
    });
    
    const progress = document.getElementById('creSessionProgress');
    if (progress) progress.textContent = `${completed}/${total}`;
    
    const progressBar = document.getElementById('creProgressBar');
    if (progressBar) {
        const progressPct = (completed / total) * 100;
        progressBar.style.width = progressPct + '%';
    }
}

function creEndSession() {
    if (!currentSession) return;
    
    clearInterval(sessionTimer);
    
    currentSession.end_time = new Date().toISOString();
    currentSession.duration_minutes = Math.round((Date.now() - sessionStartTime) / 60000);
    
    const checklist = [
        currentSession.deals_reviewed >= 3,
        currentSession.broker_called,
        currentSession.om_requested,
        currentSession.deal_watched,
        currentSession.numbers_run,
        currentSession.notes_taken
    ];
    
    const completed = checklist.filter(Boolean).length;
    const total = checklist.length;
    
    currentSession.completion = `${completed}/${total}`;
    
    creSessionData.sessionHistory.push(currentSession);
    saveCRESession();
    
    const summary = ` CRE Session Summary\n\nDuration: ${currentSession.duration_minutes} minutes\nCompletion: ${currentSession.completion}\n\n Good session!`;
    
    alert(summary);
    
    const modal = document.getElementById('creSessionModal');
    if (modal) modal.style.display = 'none';
    
    currentSession = null;
    sessionStartTime = null;
}

// ===================================
// QUICK CAPTURE
// ===================================

function creOpenQuickCapture() {
    const modal = document.getElementById('creCaptureModal');
    if (modal) {
        modal.style.display = 'flex';
        const textarea = document.getElementById('creCaptureText');
        if (textarea) textarea.focus();
    }
}

function creCloseQuickCapture() {
    const modal = document.getElementById('creCaptureModal');
    if (modal) {
        modal.style.display = 'none';
        const textarea = document.getElementById('creCaptureText');
        if (textarea) textarea.value = '';
    }
}

function creSaveCapture() {
    const textarea = document.getElementById('creCaptureText');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) return;
    
    const note = {
        id: 'note_' + Date.now(),
        text: text,
        timestamp: new Date().toISOString(),
        type: 'cre'
    };
    
    creSessionData.notes.push(note);
    saveCRESession();
    
    renderCRESessionNotes();
    creCloseQuickCapture();
    showCREToast(' Note captured');
    // Persist to server
    if (window.API && window.API.token) {
        window.API.post('/api/actions/capture', { content: text, type: 'cre', tab: 'cre' });
    }
}

function renderCRESessionNotes() {
    const container = document.getElementById('creSessionNotes');
    if (!container) return;
    
    const notes = creSessionData.notes.filter(n => n.type === 'cre').slice(-10).reverse();
    
    if (notes.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); padding: 10px;">No notes yet</p>';
        return;
    }
    
    container.innerHTML = notes.map(note => {
        const date = new Date(note.timestamp);
        return `
            <div style="background: var(--surface); padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid var(--accent);">
                <div style="font-size: 13px; color: var(--text); margin-bottom: 4px;">${note.text}</div>
                <div style="font-size: 11px; color: var(--muted);">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
            </div>
        `;
    }).join('');
}

// ===================================
// WATCH LIST
// ===================================

function creToggleWatchList() {
    const panel = document.getElementById('creWatchListPanel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

function renderCREWatchList() {
    const container = document.getElementById('creWatchListContainer');
    const countEl = document.getElementById('creWatchCount');
    
    if (!container) return;
    
    const watchedDeals = creSessionData.deals.filter(d => d.watched);
    
    if (countEl) countEl.textContent = watchedDeals.length;
    
    if (watchedDeals.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">No deals on watch list yet</p>';
        return;
    }
    
    container.innerHTML = watchedDeals.map(deal => `
        <div style="background: var(--surface); padding: 15px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <strong style="font-size: 14px;">${deal.name}</strong>
                <span style="color: var(--green); font-weight: 600; font-size: 13px;">${deal.cap_rate}%</span>
            </div>
            <div style="color: var(--muted); font-size: 12px; margin-bottom: 10px;">
                ${deal.state} • $${(deal.asking_price / 1000000).toFixed(2)}M
            </div>
            <div style="display: flex; gap: 6px;">
                <button onclick="creCallBroker('${deal.id}')" style="flex: 1; background: var(--accent); color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 11px;"> Call</button>
                <button onclick="creRequestOM('${deal.id}')" style="flex: 1; background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 6px; border-radius: 4px; cursor: pointer; font-size: 11px;"> OM</button>
                <button onclick="creToggleWatch('${deal.id}')" style="background: var(--red); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">Remove</button>
            </div>
        </div>
    `).join('');
}

// ===================================
// FILTERING & SORTING
// ===================================

function creApplyFilters() {
    const capFilter = document.getElementById('creFilterCap');
    const geoFilter = document.getElementById('creFilterGeo');
    const sortFilter = document.getElementById('creFilterSort');
    const watchFilter = document.getElementById('creFilterWatchOnly');
    
    if (capFilter) creSessionData.filters.capMin = parseFloat(capFilter.value) || 0;
    if (geoFilter) creSessionData.filters.geography = geoFilter.value;
    if (sortFilter) creSessionData.filters.sort = sortFilter.value;
    if (watchFilter) creSessionData.filters.watchOnly = watchFilter.checked;
    
    renderCREDeals();
}

function renderCREDeals() {
    const container = document.getElementById('creDealsContainer');
    if (!container) return;
    
    let deals = [...creSessionData.deals];
    
    // Apply filters
    if (creSessionData.filters.capMin > 0) {
        deals = deals.filter(d => d.cap_rate >= creSessionData.filters.capMin);
    }
    
    if (creSessionData.filters.geography !== 'All') {
        deals = deals.filter(d => d.state === creSessionData.filters.geography);
    }
    
    if (creSessionData.filters.watchOnly) {
        deals = deals.filter(d => d.watched);
    }
    
    // Apply sort
    if (creSessionData.filters.sort === 'cap_high') {
        deals.sort((a, b) => b.cap_rate - a.cap_rate);
    } else if (creSessionData.filters.sort === 'price_low') {
        deals.sort((a, b) => a.asking_price - b.asking_price);
    }
    
    if (deals.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">No deals match your filters</p>';
        return;
    }
    
    container.innerHTML = deals.map(deal => createDealCard(deal)).join('');
}

function renderCRETab() {
    renderCREDeals();
    renderCREWatchList();
    renderCRESessionNotes();
}

// ===================================
// TOAST NOTIFICATIONS
// ===================================

function showCREToast(message, type = 'success') {
    const toast = document.getElementById('creToast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'cre-toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===================================
// INITIALIZATION
// ===================================

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCRESession);
} else {
    initCRESession();
}

// Re-initialize when CRE tab becomes active
document.addEventListener('tab-changed', (e) => {
    if (e.detail && e.detail.tab === 'cre') {
        renderCRETab();
    }
});
