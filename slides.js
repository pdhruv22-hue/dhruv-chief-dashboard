/**
 * slides.js — Command Center Slideshow + Expandable Cards
 * Injected into dashboard without touching existing layout.
 * Each tab gets:
 *   1. A rotating headline card (auto-advances every 5s, click to pause/next)
 *   2. Expandable detail panels on any card (click card title to expand)
 */

window.ChiefSlides = {

  //  Slide builders per tab 

  buildSlides(tabId, d) {
    const slides = {
      wealth: () => this._wealthSlides(d),
      goals:  () => this._goalsSlides(d),
      habits: () => this._habitsSlides(d),
      review: () => this._reviewSlides(d),
      partner:() => this._partnerSlides(d),
      deploy: () => this._deploySlides(d),
      cre:    () => this._creSlides(d),
      thesis: () => this._thesisSlides(d),
      hysa:   () => this._hysaSlides(d),
      schedule:()=> this._scheduleSlides(d),
      captures:()=> this._capturesSlides(d),
    };
    const fn = slides[tabId];
    return fn ? fn() : [];
  },

  fmt(n) {
    if (!n && n !== 0) return '—';
    n = parseFloat(n);
    if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n/1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  },

  ago(ts) {
    if (!ts) return '';
    try {
      const d = new Date(ts), s = Math.floor((Date.now()-d)/1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s/60)+'m ago';
      if (s < 86400) return Math.floor(s/3600)+'h ago';
      return Math.floor(s/86400)+'d ago';
    } catch { return ''; }
  },

  _wealthSlides(d) {
    const w = d.wealth || {};
    if (w.empty) return [{icon:'', title:'No wealth data yet', body:'Run the wealth tracker to get started.', accent:false}];
    const liquid = w.liquid || 0;
    const pct = (w.pct_to_target || 0).toFixed(1);
    const gap = this.fmt(w.gap || 0);
    const tsla = (w.positions||[]).find(p=>p.symbol==='TSLA');
    const xpev = (w.positions||[]).find(p=>p.symbol==='XPEV');
    return [
      { icon:'', title:`${this.fmt(liquid)}`, body:`${pct}% to $1M target · ${gap} gap`, accent:true, sub:'Liquid net worth' },
      { icon:'', title:'TSLA & XPEV — HOLD', body:`TSLA ${this.fmt(tsla?.value||0)} · XPEV ${(xpev?.shares||0).toFixed(0)}sh locked · Merger + China thesis`, accent:false, sub:'Locked positions' },
      { icon:'', title:'HYSA War Chest', body:`Axos ${this.fmt(w.hysa_axos||75000)} + SoFi ${this.fmt(w.hysa_sofi||25000)} = $100K`, accent:false, sub:'Tax reserve' },
      { icon:'', title:'$1M by 2031', body:`${pct}% there · Adding $50K/yr · Need 10-12% CAGR`, accent:false, sub:'5-year target' },
    ];
  },

  _goalsSlides(d) {
    const g = d.goals || {};
    if (g.empty) return [{icon:'', title:'No goals loaded', body:'Sprint goals will appear here.', accent:false}];
    const active = g.active || [];
    const urgent = g.urgent || [];
    const pct = g.pct_complete || 0;
    const next = urgent[0] || active[0];
    return [
      { icon:'', title:`${active.length} active goals`, body:`${pct}% complete · ${urgent.length} due in 14 days`, accent:true, sub:'Sprint 1 · Apr–Oct 2026' },
      next ? { icon:'', title:next.title?.slice(0,50)||'—', body:`${next.days_left}d left · ${next.category}`, accent:urgent.length>0, sub:'Next up' } : null,
      { icon:'', title:'Sep 30 — First NNN close', body:`${(d.cre?.total||0)} deals evaluated · Pipeline building`, accent:false, sub:'CRE deadline' },
      { icon:'', title:`${urgent.length} urgent this week`, body:(urgent.slice(0,3).map(u=>u.title?.slice(0,30)).join(' · '))||'All clear', accent:urgent.length>0, sub:'Due in 14 days' },
    ].filter(Boolean);
  },

  _habitsSlides(d) {
    const h = d.habits || {};
    if (h.empty) return [{icon:'', title:'No habit data', body:'Log habits in Telegram to start tracking.', accent:false}];
    const pct = Math.round((h.total_week||0)/(h.total_target||32)*100);
    const habits = h.habits || [];
    const best = habits.reduce((a,b)=>b.streak>a.streak?b:a, {streak:0,name:'—'});
    const worst = habits.filter(h=>!h.on_track)[0];
    return [
      { icon:'', title:`${h.total_week||0}/${h.total_target||32} this week`, body:`${pct}% completion · ${pct>=80?'On track':'Needs work'}`, accent:pct>=80, sub:'Weekly habits' },
      { icon:'', title:`${best.name} — ${best.streak}d streak`, body:'Keep it going. Consistency compounds.', accent:true, sub:'Longest streak' },
      worst ? { icon:'', title:`${worst.name} behind`, body:`${worst.week_count}/${worst.week_target} this week · ${worst.streak}d streak`, accent:false, sub:'Needs attention' } : { icon:'', title:'All habits on track', body:'Clean week across all 5.', accent:true, sub:'Status' },
      { icon:'', title:'Gym · Sleep · Plan · Wife · Read', body:'5 habits. 32 targets/week. Foundation of the plan.', accent:false, sub:'Your system' },
    ];
  },

  _reviewSlides(d) {
    const r = d.weekly_review || {};
    if (r.empty || !r.latest) return [{icon:'', title:'No review yet', body:"Say 'weekly review' in Telegram to generate.", accent:false}];
    const l = r.latest;
    const obs = (l.observation||'').slice(0,100);
    return [
      { icon:'', title:`Week of ${l.week_start||'—'}`, body:obs, accent:false, sub:'Weekly observation' },
      { icon:'', title:'What happened', body:(l.happened||'').replace(/•/g,'').slice(0,120), accent:false, sub:'This week' },
      { icon:'', title:'Open next week', body:(l.open_items||'').replace(/•/g,'').slice(0,120), accent:true, sub:'Coming up' },
      { icon:'', title:`Source: ${l.source||'AI'}`, body:`Updated ${this.ago(l.created_at)}`, accent:false, sub:'Review metadata' },
    ];
  },

  _partnerSlides(d) {
    const p = d.partner || {};
    if (p.empty) return [{icon:'', title:"No notes yet", body:"Say 'wife says: ...' in Telegram to log conversation points.", accent:false}];
    const notes = p.notes || [];
    const latest = notes[0];
    const themes = notes.flatMap(n=>n.themes||[]).slice(0,5);
    return [
      { icon:'', title:`${p.total||0} notes logged`, body:latest?.raw?.slice(0,100)||'—', accent:false, sub:`Last: ${this.ago(latest?.created_at)}` },
      themes.length ? { icon:'', title:'Recurring themes', body:themes.join(' · '), accent:true, sub:'From her conversations' } : null,
      { icon:'', title:'How to use', body:"Drop points after conversations: 'wife says: concerned about RE timing with baby'", accent:false, sub:'Captures her input' },
    ].filter(Boolean);
  },

  _deploySlides(d) {
    const dep = d.deploy || {};
    if (dep.empty) return [{icon:'', title:'No scans yet', body:"Say 'deploy scan' to run the monthly $4,167 allocation.", accent:false}];
    const l = dep.latest || {};
    const allocs = l.allocations||[];
    const top = allocs[0];
    return [
      { icon:'', title:l.month_label||'—', body:l.regime||'—', accent:false, sub:'Monthly deploy scan' },
      top ? { icon:'', title:`${top.ticker} — $${(top.amount||0).toLocaleString()}`, body:top.reasoning?.slice(0,100)||'', accent:true, sub:'Top allocation' } : null,
      { icon:'', title:'Not financial advice', body:'Run every recommendation with Asha before executing.', accent:false, sub:'Guardrail' },
      { icon:'', title:`${(dep.history||[]).length} scans on record`, body:`Budget: $4,167/mo · Framework A/B/C blend`, accent:false, sub:'History' },
    ].filter(Boolean);
  },

  _creSlides(d) {
    const cre = d.cre || {};
    const go = cre.go||[], maybe = cre.maybe||[], pass = cre.pass||[];
    if (cre.empty) return [{icon:'', title:'Pipeline empty', body:"Paste a LoopNet URL or say 'eval: ...' in Telegram.", accent:false}];
    return [
      { icon:'', title:`${cre.total||0} deals evaluated`, body:`${go.length} GO · ${maybe.length} Needs info · ${pass.length} Pass`, accent:go.length>0, sub:'CRE Pipeline' },
      go[0] ? { icon:'', title:go[0].address||'—', body:`Cap: ${go[0].cap_rate?.toFixed(2)||'?'}% · Tenant: ${go[0].tenant||'—'}`, accent:true, sub:'Best deal' } : null,
      { icon:'', title:'Sep 30 deadline', body:'First NNN closed. Absolute NNN · 8-10% cap · $20K+/mo · BBB+ · 15yr+', accent:true, sub:'Hard deadline · 164 days' },
      { icon:'', title:'Hard filters', body:'Absolute NNN · 8-10% cap · $20K+/mo · 15yr+ · BBB+ · Escalations required', accent:false, sub:'Auto-reject if any fail' },
    ].filter(Boolean);
  },

  _thesisSlides(d) {
    const t = d.thesis || {};
    if (t.empty) return [{icon:'', title:'No portfolio data', body:'Run wealth tracker to populate thesis check.', accent:false}];
    const buckets = t.buckets||[];
    const locked = t.locked||{};
    const tsla = locked.TSLA||{};
    const xpev = locked.XPEV||{};
    return [
      { icon:'', title:'TSLA — HOLD forever', body:`${this.fmt(tsla.value||0)} · Merger/synergy thesis · Never trim`, accent:true, sub:'Locked position' },
      { icon:'', title:'XPEV — 1,346sh locked', body:`Tesla of China thesis · ${(xpev.shares||0).toFixed(0)} shares`, accent:false, sub:'Locked position' },
      buckets[0] ? { icon:'', title:`${buckets[0].bucket} — ${buckets[0].total_pct||0}%`, body:(buckets[0].positions||[]).map(p=>p.ticker).join(' · '), accent:false, sub:'Top bucket' } : null,
      { icon:'', title:'Thesis check cadence', body:'Quarterly review: Jul/Oct/Jan/Apr. Only Opus 4.7 touches this.', accent:false, sub:'Review schedule' },
    ].filter(Boolean);
  },

  _hysaSlides(d) {
    const h = d.hysa || {};
    if (h.empty) return [{icon:'', title:'No rate data', body:"Say 'hysa check' to run a rate comparison.", accent:false}];
    const c = h.current||{};
    const alert = c.alert_level;
    return [
      { icon:'', title:`Axos ${(c.axos_apy||0).toFixed(2)}% · SoFi ${(c.sofi_apy||0).toFixed(2)}%`, body:`Market top: ${c.market_top_bank||'—'} at ${(c.market_top_apy||0).toFixed(2)}%`, accent:alert==='none', sub:'Your HYSA rates' },
      { icon: alert==='red'?'':alert==='yellow'?'':'', title: alert==='red'?'Action needed':alert==='yellow'?'Watch closely':'Rates healthy', body: alert==='red'?'Consider moving $75K to higher-rate bank':'No action needed this month', accent:alert==='none', sub:'Alert status' },
      { icon:'', title:'$75K Axos + $25K SoFi', body:'$100K HYSA war chest · Tax reserve · Non-negotiable', accent:false, sub:'Allocation locked' },
    ];
  },

  _scheduleSlides(d) {
    const s = d.schedule || {};
    if (s.empty) return [{icon:'', title:'No schedule data', body:'Schedule blocks will appear here.', accent:false}];
    const blocks = (s.blocks||[]).filter(b=>b.day_type===s.today_type||b.day_type==='weekday');
    const locked = blocks.filter(b=>b.is_locked);
    const deepWork = blocks.find(b=>b.activity?.includes('Deep work'));
    return [
      { icon:'', title:`Today — ${s.today_type||'—'}`, body:`${blocks.length} blocks · ${locked.length} protected`, accent:false, sub:'Daily OS' },
      deepWork ? { icon:'', title:'Deep work 8:30–10:30', body:deepWork.activity||'', accent:true, sub:'Protected block' } : null,
      { icon:'', title:'AMDA hard stop — 12:30pm', body:'2hr cap enforced. StoreBot handles the rest.', accent:false, sub:'Daily boundary' },
      { icon:'', title:'Dinner 6:30–9pm · Date night Fri', body:'Non-negotiable. Phones off.', accent:false, sub:'Protected family time' },
    ].filter(Boolean);
  },

  _capturesSlides(d) {
    const c = d.captures || {};
    if (c.empty) return [{icon:'', title:'Nothing captured yet', body:"Say 'note: ...' in Telegram to capture thoughts.", accent:false}];
    const caps = c.captures||[];
    const latest = caps[0];
    const decisions = caps.filter(x=>x.category==='decision').length;
    return [
      { icon:'', title:`${c.total||0} captures`, body:latest?.content?.slice(0,100)||'—', accent:false, sub:`Last: ${this.ago(latest?.created_at)}` },
      decisions > 0 ? { icon:'', title:`${decisions} open decisions`, body:'Review before Sunday finance meeting.', accent:true, sub:'Decisions' } : null,
      { icon:'', title:'How to capture', body:"Say 'note: [anything]' in Telegram. Instant log, no friction.", accent:false, sub:'Quick capture' },
    ].filter(Boolean);
  },
};

//  Alpine component: Slideshow 
window.chiefSlideshow = (tabId, getData) => ({
  slides: [],
  current: 0,
  paused: false,
  expanded: false,
  timer: null,

  init() {
    this.$watch('tabId', () => this.rebuild());
    this.rebuild();
  },

  rebuild() {
    const d = typeof getData === 'function' ? getData() : getData;
    this.slides = window.ChiefSlides.buildSlides(tabId, d).filter(Boolean);
    this.current = 0;
    this.restart();
  },

  get slide() { return this.slides[this.current] || {}; },
  get total()  { return this.slides.length; },

  next() {
    this.current = (this.current + 1) % this.total;
    this.restart();
  },

  prev() {
    this.current = (this.current - 1 + this.total) % this.total;
    this.restart();
  },

  restart() {
    if (this.timer) clearInterval(this.timer);
    if (!this.paused) {
      this.timer = setInterval(() => { this.current = (this.current+1) % this.total; }, 5000);
    }
  },

  toggle() {
    this.paused = !this.paused;
    this.restart();
  },

  destroy() {
    if (this.timer) clearInterval(this.timer);
  },
});
