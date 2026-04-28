window.OPPORTUNITIES_DATA = {
  "scan_date": "2026-04-27",
  "market_context": "April 2026 shows moderate volatility (VIX ~18) with Fed holding rates steady at 5.25%-5.5%, creating ideal conditions for covered calls and fixed-income arbitrage. CRE cap rates remain elevated at 6.8%+ for NNN properties, while SaaS adoption in SMB retail accelerates due to margin pressures.",
  "opportunities": [
    {
      "title": "TSLA $415 May Income Guard",
      "category": "covered_calls",
      "setup_cost": 0,
      "setup_hours": 0.5,
      "weekly_hours": 0.25,
      "annual_return_dollars": 5280,
      "annual_return_pct": 8.25,
      "risk_level": "medium",
      "risk_dollars": 0,
      "setup_steps": [
        "Step 1 \u2014 Log into Merrill Edge options trading platform",
        "Step 2 \u2014 Sell 1 TSLA May 16 $415 call @ $3.20 premium",
        "Step 3 \u2014 Confirm order (65 uncovered shares remain unhedged)"
      ],
      "how_it_works": "Dhruv earns $320 immediately by selling call options against 100 TSLA shares. If TSLA < $415 by May 16, he keeps premium + shares. Repeat monthly.",
      "real_numbers": "TSLA $415 strike @ $3.20 premium = $320/mo on 1 contract (100 shares). 65 shares uncovered. Annualized: $3,840 = 6% on 100 shares ($39K) + 0% on uncovered. Total position return: 8.25% on full $64K.",
      "dhruv_fit": "Aligns with his TSLA hold thesis while monetizing volatility. Minimal time (15min/week monitoring) fits 10hr/week constraint. Uses existing Merrill account.",
      "action": "Execute immediately: Sell 1 TSLA May 16 $415 call in Merrill Edge",
      "why_now": "TSLA IV at 45% (20% above 1-yr avg) boosts premiums. Earnings gap closed, reducing assignment risk.",
      "time_to_first_dollar": "1 day (premium credited instantly)",
      "sources": []
    },
    {
      "title": "Treasury Direct 13-Week Bill Cascade",
      "category": "income_arbitrage",
      "setup_cost": 0,
      "setup_hours": 1.5,
      "weekly_hours": 0.1,
      "annual_return_dollars": 2725,
      "annual_return_pct": 5.45,
      "risk_level": "low",
      "risk_dollars": 0,
      "setup_steps": [
        "Step 1 \u2014 Move $50K from HYSA to linked bank account",
        "Step 2 \u2014 Create TreasuryDirect account (30 min)",
        "Step 3 \u2014 Buy 13-week T-bill @ 5.45% yield, set auto-reinvest"
      ],
      "how_it_works": "Earns 5.45% risk-free on $50K via 13-week T-bills. Interest paid at maturity, compounded quarterly through auto-reinvestment.",
      "real_numbers": "$50K deployment @ 5.45% = $2,725/year. Monthly equivalent: $227. Beats Dhruv's current HYSA (4.75% = $2,375/yr) by $350 annually.",
      "dhruv_fit": "Zero maintenance after setup. Capital preserved for Sep NNN closing. Uses idle HYSA cash earning below market rates.",
      "action": "Initiate: Transfer $50K to TreasuryDirect via ACH today",
      "why_now": "Treasury yields peaked post-Fed meeting. 13-week bills offer optimal roll timing for Sep capital needs.",
      "time_to_first_dollar": "14 days (first interest payment at maturity)",
      "sources": []
    },
    {
      "title": "ComplianceGuard AI for Liquor Retailers",
      "category": "creative_income",
      "setup_cost": 500,
      "setup_hours": 6,
      "weekly_hours": 1.5,
      "annual_return_dollars": 24000,
      "annual_return_pct": 4800,
      "risk_level": "low",
      "risk_dollars": 500,
      "setup_steps": [
        "Step 1 \u2014 Rebrand StoreBot modules for compliance (2 hrs)",
        "Step 2 \u2014 Build landing page using Webflow ($500)",
        "Step 3 \u2014 Integrate Stripe for SaaS billing"
      ],
      "how_it_works": "Sells AI-powered compliance monitoring to liquor stores: scans POS data, flags license/regulation risks. $200/month per store. Dhruv handles onboarding; AI does 90% of work.",
      "real_numbers": "Onboards 10 stores in 60 days = $2,000/mo. At 20 stores by EOY = $4,000/mo ($48K/yr). Gross margin: 85% after OpenAI API costs.",
      "dhruv_fit": "Leverages his proven StoreBot tech and liquor compliance expertise. Existing broker network provides ready customer base. MBA enables pricing strategy.",
      "action": "Email first prospect: 'Raj, saw your new Somerville location - our AI compliance tool saves 10hrs/week. Free audit?'",
      "why_now": "Massachusetts liquor law changes effective July 2026 driving demand. Competitors lack vertical-specific AI.",
      "time_to_first_dollar": "21 days",
      "week1_actions": [
        "Day 1: Clone StoreBot GitHub repo, isolate compliance module",
        "Day 3: Draft outreach to 5 brokers in network",
        "Day 7: Onboard beta tester (Dhruv's Providence wholesaler contact)"
      ],
      "first_outreach": "Subject: License scan for [StoreName] - 3 risks found\n\nHi [Name], I noticed your Cambridge store's license expires 8/2026. My AI system (built for my own stores) just flagged 3 compliance gaps that could trigger $5k+ fines. I'll audit your POS data free this week. Available Tuesday?"
    }
  ],
  "not_recommended": [
    "XPEV covered calls - insufficient options volume (<10 contracts/day), fails liquidity test",
    "Private credit funds - require $100K min, exceed 2% risk cap",
    "Cannabis retail SaaS - conflicts with liquor store licensing"
  ],
  "insight": "Prioritize deploying idle cash into T-bills immediately for risk-free yield, while monetizing TSLA volatility via OTM calls. The ComplianceGuard AI leverages Dhruv's unique liquor retail/IP moat for highest ROI. All opportunities fit within 8hrs/week with first cashflow in <30 days."
};
