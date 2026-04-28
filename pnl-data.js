window.PNL_DATA = {
  "generated_at": "2026-04-19T19:35:26.179141",
  "system_costs": {
    "daily_estimate_usd": 0.392,
    "monthly_estimate_usd": 11.76,
    "cost_breakdown": [
      {
        "script": "health_tips_generator.py",
        "model": "DeepSeek",
        "schedule": "daily",
        "cost_per_day": 0.002
      },
      {
        "script": "cre_daily_scan.py",
        "model": "Perplexity + DeepSeek R1",
        "schedule": "daily",
        "cost_per_day": 0.08
      },
      {
        "script": "ai_income_scan.py",
        "model": "DeepSeek",
        "schedule": "daily",
        "cost_per_day": 0.03
      },
      {
        "script": "stocks_analysis.py",
        "model": "DeepSeek R1",
        "schedule": "2x daily",
        "cost_per_day": 0.1
      },
      {
        "script": "session_prep.py",
        "model": "Perplexity + DeepSeek R1",
        "schedule": "8 blocks/day",
        "cost_per_day": 0.15
      },
      {
        "script": "opportunity_scanner",
        "model": "DeepSeek",
        "schedule": "weekly (~0.21/7)",
        "cost_per_day": 0.03
      }
    ]
  },
  "projects": [
    {
      "id": "chief-system",
      "name": "Chief of Staff System",
      "description": "AI orchestration layer - morning briefings, CRE scans, wealth tracking, opportunity scanning",
      "status": "operational",
      "start_date": "2026-04-01",
      "target_monthly": 0.0,
      "total_revenue": 0,
      "total_cost": 0,
      "pnl": 0,
      "roi_pct": 0,
      "transactions": []
    },
    {
      "id": "storebot-ai",
      "name": "StoreBot AI",
      "description": "AI ops layer for AMDA liquor store - Dhruv owns sales, Harsh owns dev",
      "status": "pre-revenue",
      "start_date": "2026-04-19",
      "target_monthly": 2000.0,
      "total_revenue": 0,
      "total_cost": 0.0,
      "pnl": 0.0,
      "roi_pct": 0,
      "transactions": [
        {
          "id": 1,
          "project_id": "storebot-ai",
          "type": "expense",
          "amount": 0.0,
          "description": "No cost yet - Harsh covers dev",
          "date": "2026-04-19",
          "created_at": "2026-04-19T19:35:26.175140"
        }
      ]
    }
  ]
};
