---
title: LGH OS 2.0 Specification
status: draft
domain: client
the_three: shared
owner: codex
client: lgh
created: 2026-05-03
updated: 2026-05-03
---

# LGH OS 2.0 Specification

## Purpose

LGH OS 2.0 is the next version of Trevor Calais' revenue operating system for Let's Geaux Hustle. It is not just a dashboard, an agent, or a collection of automations. It is one operating layer that knows the business, watches the funnel, executes revenue SOPs, and reports the truth.

The system must answer one question every day:

> What is making or blocking money today, and what did the OS do about it?

## Source Inputs

- Working OS methodology from Nate Herk's "Build & Sell Claude Code Operating Systems" course, reviewed by transcript on 2026-05-03.
- LGH Master Context Doc from Google Docs, exported on 2026-05-03.
- Existing LGH audit docs in shared memory, especially `acquisition-os-audit-2026-05-02.md`.
- Current live system state verified during the May 3 operational test.

## North Star

Trevor should be able to open the dashboard or message Commander and immediately know:

- How many leads came in.
- Which ads produced real webinar registrations, not vanity clicks.
- Who watched the webinar and who did not.
- Who is hot enough for AI follow-up or human sales attention.
- How many calls were booked, showed, and closed.
- Which revenue came from which campaign, adset, ad, or source.
- What broke, what the OS fixed, and what still needs account access or approval.

The OS should be usable by an ADHD CEO: simple labels, no technical noise, no internal tool chatter, and one clear next move.

## Operating Method

LGH OS 2.0 follows the 4 C's model.

### 1. Context

The OS needs a clean company brain, not scattered memory.

Required LGH business context:

- Company: Let's Geaux Hustle.
- Founder and CEO: Trevor Calais.
- Mission: help people escape 9-5 limits, build cash-flowing assets, improve credit/fundability, and build wealth.
- Core audience:
  - Hustlers trapped in a job.
  - Veterans and active duty military.
  - People with poor credit or limited capital.
  - People who want Turo, private rentals, Airbnb, credit repair, or business funding.
- Core offer framework:
  - Credit optimization.
  - Business/personal funding.
  - Business launch and mentorship.
- Main product paths:
  - High-ticket mentorship/community.
  - Low-ticket Turo Power Play / SLO offer.
  - Webinar funnel that pushes to booked strategy calls.
- Brand voice:
  - Direct.
  - High-energy.
  - Entrepreneurial.
  - Military/veteran friendly.
  - Focused on action, cash flow, freedom, and accountability.

### 2. Connections

Connections should be lean and revenue-specific. Avoid broad tool access that wastes context.

Current source-of-truth map:

| System | Purpose | Source of Truth |
|---|---|---|
| Pipeboard | Ad spend, clicks, impressions, ad names, CPL | Pipeboard only |
| WebinarKit | Registration, attendance, watch percent, CTA click | WebinarKit webhook/export into Supabase |
| GHL | Contacts, tags, pipelines, bookings, closed deals, SMS/email | GHL location `I4UCxgBVksYMkvTqUnmy` |
| Retell | AI call activity and outcomes | `retell_call_log` plus Retell API/webhook |
| Supabase | Canonical revenue ledger and dashboard data | `wrrfrhuocbftgqqfpaoz.supabase.co` |
| Netlify | Funnel, webhook functions, dashboard hosting | LGH Netlify sites |
| Telegram/Discord | Commander user surfaces | Hermes gateway |
| DigitalFlo app | Learning loop and acquisition brain | DigitalFlo production app |

Hard rule: Ads Commander uses Pipeboard only. No direct Meta Graph API code, references, or fallback instructions.

### 3. Capabilities

Capabilities are reusable skills/SOPs. Commander should not improvise the same process every time.

Required skills:

| Skill | Owner Agent | Purpose |
|---|---|---|
| `audit-os` | General Commander | Score LGH OS against the 4 C's and report gaps. |
| `level-up-os` | General Commander | Find the next highest-leverage capability to add or improve. |
| `daily-revenue-report` | General Commander | Morning report with leads, webinar, calls, revenue, hot leads, and problems. |
| `pipeline-health-doctor` | General Commander | Detect stale sources, attempt repair, verify, then report. |
| `pipeboard-ad-attribution` | Ads Commander | Answer best ad and best converting ad using Pipeboard plus Supabase registrations/revenue. |
| `creative-learning-loop` | Ads Commander | Identify winning hooks, losing ads, and next creative tests. |
| `webinar-leak-audit` | Strategy Commander | Find registration-to-attendance and watch-percent leaks. |
| `hot-lead-prioritization` | Strategy Commander | Rank leads by watch percent, CTA click, booking/no-show, and recency. |
| `follow-up-execution` | Strategy Commander | Send/queue 10-15 touches in 48 hours while respecting DND and stop conditions. |
| `no-show-recovery` | Strategy Commander | Trigger fast no-show recovery sequence and AI dialer path. |
| `closed-deal-attribution` | General Commander | Ensure closed deals carry `contact_id`, source, amount, and campaign lineage. |
| `weekly-closed-loop` | General Commander | Run weekly intelligence, create/propose fixes, email/post summary, and log decisions. |

Capability behavior standard:

1. Query live source.
2. Compare to expected state.
3. Fix what it can.
4. Verify with a new row/log/result.
5. Report what changed and what remains.

Commander must not default to "ask Byram" or "tag someone." Escalation is allowed only for missing credentials, billing/account quota, legal/payment risk, or an explicit approval gate.

### 4. Cadence

The OS should act before Trevor asks.

Required cadence:

| Frequency | Routine | Expected Outcome |
|---|---|---|
| Every 5 minutes | GHL/WebinarKit registration sync guard | New registrants appear in Supabase/dashboard even if page capture fails. |
| Every 10 minutes | Canonical event sync | `lead_events` and acquisition rows stay current. |
| Every 15 minutes | Strategy Commander | Active leads are segmented, tagged, and followed up. |
| Hourly | Pipeboard ad metrics sync | Spend/CPL/ROAS do not go stale. |
| Every 2 hours | Pipeline health check | Stale systems trigger alerts and repair attempts. |
| Daily morning | CEO revenue report | Trevor knows what happened and where to focus. |
| Daily afternoon | Hot lead and no-show push | Closest-to-money leads get worked before cooling off. |
| Weekly Monday | Closed-loop intelligence | Trends, leaks, proposed fixes, executed fixes, and next tests. |
| Monthly | OS audit | Score context, connections, capabilities, cadence, and data quality. |

## Agent Model

LGH keeps exactly 3 revenue agents.

### 1. General Commander

Role: Chief of staff and operating system owner.

Responsibilities:

- Own the truth.
- Run reports.
- Watch health.
- Detect stale data.
- Coordinate repairs.
- Keep Trevor focused on the next money move.
- Maintain the brain vault and decision log.

Primary KPIs:

- Data freshness.
- Report accuracy.
- Repair completion rate.
- Time to detect/fix broken pipeline.
- Revenue attribution completeness.

### 2. Strategy Commander

Role: Money maker for lead conversion.

Responsibilities:

- Segment every lead.
- Work opt-ins, non-watchers, partial watchers, high watchers, CTA clickers, booked calls, no-shows, and follow-ups.
- Trigger AI setter/dialer paths.
- Prioritize highest-intent leads.
- Stop outreach when booked/closed/DND.

Primary KPIs:

- Show rate.
- Watch rate.
- CTA click rate.
- Booked calls.
- Showed calls.
- Revenue per lead.

### 3. Ads Commander

Role: Qualified traffic and creative intelligence.

Responsibilities:

- Use Pipeboard for ad truth.
- Compare spend to real webinar registrations and revenue.
- Identify best ad, best converting ad, and bad spend.
- Recommend/produce new creative tests.
- Never reference direct Meta API.

Primary KPIs:

- Cost per qualified lead.
- Cost per webinar registration.
- Registration quality.
- Cost per booked call.
- Cost per closed deal.

## Brain Vault

The LGH brain should live as a simple markdown vault. Keep it boring, searchable, and source-linked.

Proposed path:

`~/.claude/shared-memory/wiki/clients/lgh/os-v2/`

Structure:

```text
os-v2/
  index.md
  hot-cache.md
  log.md
  raw/
    master-context-doc.md
    webinar-framework.md
    offer-scope.md
    transcript-notes.md
  wiki/
    company.md
    avatar.md
    offer-ladder.md
    sales-process.md
    webinar-funnel.md
    ad-strategy.md
    team-roles.md
    agents.md
    tools.md
    kpi-definitions.md
    data-contracts.md
    routines.md
    decision-log.md
    incident-log.md
```

Rules:

- `hot-cache.md` contains only the current facts Commander needs often.
- `index.md` tells agents where to look.
- `log.md` records imports, updates, repairs, and audits.
- The agent reads only the needed file, not the whole vault.
- Stale claims must be marked with date and verification state.

## Data Architecture

The canonical chain is:

```text
ad_click
  -> page_visit
  -> webinar_registration
  -> ghl_contact_created
  -> webinar_attendance/watch_progress
  -> cta_click
  -> ai_follow_up_touch
  -> ai_voice_call
  -> booked_call
  -> showed_call
  -> closed_deal
  -> revenue_attributed
```

Required Supabase surfaces:

| Layer | Tables/Views |
|---|---|
| Raw events | `webinar_registrations`, `webinar_attendance_events`, `retell_call_log`, `closed_deals`, `ad_metrics` |
| Canonical ledger | `lead_events` |
| Source/revenue rollup | `acquisition_sources`, `acquisition_source_daily` |
| Commander work queue | `v_strategy_commander_leads`, `lgh_strategy_lead_state`, `lgh_strategy_touch_log` |
| Dashboard views | `v_today_snapshot`, `v_kpi_daily`, `v_attribution_source`, `v_call_queue`, `v_funnel_journey` |

Minimum event fields:

| Field | Required For |
|---|---|
| `ghl_contact_id` | Joining lead, call, booking, and deal |
| `email` | Fallback contact matching |
| `phone` | Fallback contact matching and dialer |
| `utm_source` | Channel attribution |
| `utm_campaign` | Campaign attribution |
| `campaign_id` | Pipeboard campaign join |
| `adset_id` | Pipeboard adset join |
| `ad_id` | Best ad and creative join |
| `event_timestamp` | Time-window reporting |
| `amount/cash_collected` | Revenue attribution |

## Dashboard 2.0 Page Map

Dashboard should stay simple and executive-readable.

### Dashboard

First screen:

- Greeting for Trevor.
- Scoreboard: leads, watched, booked, showed, deals, cash, spend, cost per lead.
- Today's one biggest leak.
- Hot lead count.

### Intelligence

Weekly closed-loop page:

- What changed week over week.
- Biggest leak.
- Fixes AI Flo/Commander already executed.
- Fixes proposed for approval.
- Content/offer recommendations only when the OS cannot execute directly.

### Funnel

Visual funnel:

- Ad click.
- Page visit.
- Registered.
- Watched.
- CTA clicked.
- Booked.
- Showed.
- Closed.

Each step shows count, conversion rate, and drop-off.

### Ads

Pipeboard-only:

- Spend.
- CTR.
- CPL.
- Cost per registration.
- Registrations by campaign/ad/adset.
- Bookings and revenue by source where available.
- Winning creative and next test.

### Calls

AI setter and dialer:

- Calls made.
- Answered.
- Booked.
- No-answer.
- No-show recovery.
- Hot leads needing manual action.

### Deals

Revenue:

- Closed deals.
- Cash collected.
- Contact attribution status.
- Source attribution status.
- Orphan deals requiring repair.

### Health

Operational truth:

- Last ad sync.
- Last registration.
- Last attendance/watch event.
- Last Retell call.
- Last closed deal.
- Last Strategy Commander run.
- Last learning-loop report.

## KPI Definitions

Definitions must be visible in the brain vault and used consistently by dashboard and Commander.

| KPI | Definition |
|---|---|
| New leads | New GHL contacts or webinar registrants in selected period. |
| Webinar registrations | Rows in `webinar_registrations` for selected period. |
| Attendance | Any current `webinar_attendance_events` joined to registration/contact. |
| Show rate | Attended / registered. |
| Watch rate | Count by watch percent thresholds: `<50`, `50-75`, `75-100`. |
| CTA click rate | CTA clicked / attended. |
| Book rate | Booked calls / registered or booked calls / watched, depending page context. |
| Call show rate | Showed calls / booked calls. |
| Close rate | Closed deals / showed calls. |
| CPL | Ad spend / leads. |
| Cost per registration | Ad spend / webinar registrations. |
| CAC | Ad spend / closed deals. |
| ROAS | Revenue / ad spend. |
| Revenue per lead | Revenue / registrations or leads. |

## Business Context For Agent Reasoning

Commander should understand the offer enough to prioritize leads and answer Trevor clearly.

Offer ladder:

- Low-ticket Turo Power Play / SLO offer around the webinar funnel.
- Recruit package: entry-level yearly community/DIY launch.
- Warrior package: structured guidance with some DFY support.
- Champion package: higher-ticket DFY scaling and fleet/funding support.
- Legendary package: full transformation with high funding, fleet buildout, brand/media, VA, and wealth-building support.

Core sales logic:

- Credit repair/optimization creates fundability.
- Funding unlocks business launch.
- Turo/private rentals/Airbnb/credit repair become the business vehicle.
- Community and mentorship create implementation support.
- Veterans are a strong avatar because they understand discipline and systems.

Lead intent signals:

- Watched 75 percent or more.
- Clicked CTA/offer.
- Asked about funding.
- Asked about credit score.
- Asked about Turo/private rental.
- Booked but no-showed.
- Replied with timing, money, spouse, or trust objection.

## Behavior Rules

Commander must:

- Use plain language.
- Say what is verified and what is inferred.
- Use dates/time windows.
- Query live data before answering metrics.
- Fix what it can before reporting failure.
- Explain one next best move, not ten generic tasks.
- Keep internal tool/progress chatter out of Telegram/Discord.
- Call the external agent "Commander," "AI Flo," or "Trevor's agent" depending surface.

Commander must not:

- Reference direct Meta API.
- Tell Trevor to ask Byram by default.
- Invent data.
- Use stale memory when live data exists.
- Report vanity metrics as business truth.
- Overload Trevor with technical database names unless asked.

## Build Phases

### Phase 1 - Spec and Brain

- Save this spec.
- Import LGH Master Context into `raw/master-context-doc.md`.
- Create `index.md`, `hot-cache.md`, and starter wiki pages.
- Update Commander memory to reference the brain vault path.
- Add a monthly `audit-os` routine.

Acceptance:

- Commander can answer "What does LGH sell?" from the brain vault.
- Commander can answer "What is the current revenue path?" from the current system map.

### Phase 2 - Skills

- Create/upgrade skills listed in this spec.
- Ensure Ads Commander is Pipeboard-only.
- Ensure Strategy Commander uses behavior segmentation.
- Ensure General Commander owns health and reporting.

Acceptance:

- Best-ad question returns Pipeboard plus verified registration/revenue attribution.
- Funnel leak question returns a specific leak and one fix.
- Health question runs repair checks before reporting.

### Phase 3 - Data Contracts

- Lock required event fields.
- Add validation queries for missing `ghl_contact_id`, `ad_id`, `amount`, and attendance joins.
- Add alert thresholds:
  - registration stale > 30 minutes during active ad periods.
  - attendance stale > 24 hours.
  - ad metrics stale > 24 hours.
  - Retell stale > 24 hours.
  - closed deal `contact_id` missing > 0 on new deals.

Acceptance:

- A fresh test lead can be traced through registration, GHL contact, Supabase, strategy view, and attendance event.
- Dashboard and Commander read the same counts.

### Phase 4 - Dashboard 2.0

- Keep LGH visual brand.
- Add CEO-simple labels.
- Keep each section as its own page.
- Add Intelligence page for weekly closed-loop.
- Add Health page with repair state.
- Add source drilldowns for campaigns/adsets/ads.

Acceptance:

- Trevor can identify the biggest leak in under 30 seconds.
- Trevor can identify hot leads in under 30 seconds.
- Trevor can identify best ad by registration and downstream conversion in under 60 seconds.

### Phase 5 - Closed-Loop Execution

- Weekly report becomes a fix queue, not a homework list.
- System executes safe fixes automatically.
- System proposes risky changes for approval.
- Content/offer decisions are separated from technical fixes.

Acceptance:

- Weekly report includes: fixed this week, proposed next, cannot fix without approval, measured impact.
- Report is posted to Telegram, emailed, and visible on dashboard.

## Current Known Gaps

As of the May 3 operational test:

- Live funnel registration redirects to SLO correctly.
- GHL contact creation works.
- Supabase registration capture works through the new 5-minute GHL fallback sync.
- Direct v3 page call to `/.netlify/functions/register` is still missing on the live v3 site.
- Permanent fix should point WebinarKit/GHL registration events directly to `https://lgh-voice-api.netlify.app/api/webinarkit-bridge?stage=registration`.
- Attendance/watch path works by API test and backfilled data, but real production WebinarKit attendance webhook behavior still needs continued monitoring.
- Closed-deal workflow still needs confirmed GHL UI setup so every new Won Opportunity sends `contact_id`, amount, opportunity id, and source fields.
- Historical revenue attribution remains imperfect where old data lacks contact/source identity.

## OS 2.0 Success Criteria

The OS is working when:

- Trevor messages Commander instead of digging through tools.
- Commander answers with live numbers and source windows.
- The dashboard and Commander agree.
- New leads show source, campaign, and contact id.
- New attendance/watch events update lead stage automatically.
- Strategy Commander works hot leads without Trevor asking.
- Ads Commander identifies best ad by registration and conversion, not just spend/clicks.
- Weekly learning loop proposes or executes fixes, instead of giving the client homework.
- Pipeline health alerts fire before Trevor notices a problem.

## Immediate Next Build Actions

1. Create the LGH OS 2.0 brain vault from the master context doc.
2. Add `audit-os` and `level-up-os` skills for Commander.
3. Add `hot-cache.md` with the current live system facts.
4. Update Commander memory to read the vault only when needed.
5. Add dashboard Intelligence page source links to weekly learning-loop reports.
6. Add validation script for ad-to-registration-to-attendance-to-call-to-close trace.
7. Finish permanent webhook wiring so the 5-minute fallback becomes backup, not primary.

