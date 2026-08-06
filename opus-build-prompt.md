# Build Prompt for Claude Opus 5 — "DealerDesk" Platform MVP

> Copy everything below the line into a fresh Claude Code session (Opus 5) started in an empty repository. It is self-contained — no other context needed. Recommended: run it in plan mode first, approve the plan, then let it build.

---

Build a production-quality web platform called **DealerDesk** for my dealer-licensing services business. I am a solo non-technical operator, so favor boring, maintainable technology, clear code, and working software over cleverness. Build it phase by phase as described in the Milestones section, committing after each phase with the app in a runnable state.

## Business context (bake this into copy and logic)

I run a two-sided business:
1. **License filing service (OpCo):** I prepare and file used-car dealer license applications for clients in **Georgia, Florida, and North Carolina**, plus ongoing compliance (renewal/bond/insurance deadline tracking). Clients are car flippers, brokers, exporters, and online wholesalers who want dealer-auction access.
2. **Dealer suites (PropCo):** I rent license-compliant micro-office suites in my Atlanta-area building to these same clients as their state-required "established place of business."

Positioning against incumbents (who hide prices, hold deposits, add surprise fees, and file slowly): **published transparent pricing, fast automated filings, no hidden fees.** The website must show all prices openly.

### Products & published pricing
- **License Filing Package** — $995 one-time (launch price $795): application preparation for GA, FL, or NC; document checklist; bond & insurance referrals; inspection-prep guidance; filing logistics. **The client signs and submits everything as the applicant.**
- **Compliance Subscription** — $59/month: renewal calendar, bond/insurance expiry monitoring, occupation-tax reminders, document vault, renewal packet prep.
- **Suite + Compliance Bundle** — $549/month + $995 setup: 250 sq ft Atlanta suite (state-compliant office), signage, compliance subscription included.
- **Add-ons:** LLC/EIN setup assistance $199; pre-inspection photo review $99; occupation-tax certificate handling $149/yr.

### Legal guardrails (hard requirements, not suggestions)
- We are **not a law firm and never give legal advice**. Footer disclaimer on every page; explicit acknowledgment checkbox at checkout and at intake completion.
- The AI intake assistant and all generated content must **never** answer individualized legal questions (e.g., "will my felony disqualify me?", "how should I structure my LLC to avoid X?"). Detect such questions and respond with a polite deferral plus an "attorney referral requested" flag on the lead record. Build this as a server-side guardrail in the system prompt AND a post-response check — not just UI copy.
- Clients are always the applicant and signatory. Nothing in the product may sign, submit, or attest on a client's behalf. Generated packets are drafts for the client's review and signature.
- Collect only data needed for the workflow. No SSNs in the MVP — where a state form needs one, the field in our packet output is left blank for the client to complete on their signed copy.

## What to build

### Tech stack (use exactly this unless something is impossible)
- **Next.js (App Router, TypeScript) + Tailwind CSS**, deployed-ready for Vercel.
- **SQLite via Prisma** for the MVP (single-operator scale; design the schema so a later Postgres swap is trivial).
- **Auth:** simple email magic-link auth (e.g., Auth.js) with two roles: `admin` (me) and `client`.
- **Payments:** Stripe Checkout + customer portal (one-time products and the $59 subscription). Use test mode; read keys from env vars.
- **AI:** Anthropic API. Model `claude-sonnet-5` for the intake assistant and document-completeness checks; make the model name a config value. All AI calls server-side. If `ANTHROPIC_API_KEY` is unset, degrade gracefully to a static form flow — every AI feature must have a non-AI fallback path.
- **Email:** abstraction layer with a console/log driver for dev and a Resend driver behind an env var.
- **PDF generation:** produce completed application *packets* as clean, printable PDFs (pdf-lib or similar) from our own templates that mirror each state's required data fields (see below). Do not attempt to fetch or fill official state PDFs in the MVP — generate a "prepared application data packet" the client transcribes/reviews, plus a per-state filing instructions sheet.

### Site & features

**1. Public marketing site**
- Home page: value proposition, transparent pricing table, "how it works" (4 steps), trust points (published prices, no hidden fees, you sign everything, fast turnaround), FAQ, disclaimer footer.
- **Three state guide pages** (GA, FL, NC): requirements summary, costs table, timeline, office/premises rules, our service CTA. Write accurate placeholder content from the facts below and mark clearly in code comments: `// CONTENT: verify against current state rules before launch`.
  - **Georgia:** Used Motor Vehicle Dealer license (State Board under the SOS). Broker-style operation from an office suite permitted (no display lot). Office minimum ~250 sq ft under 2026 rules (verify). Requirements: pre-license seminar, fingerprint background (GAPS), application ~$170 + license ~$170, biennial renewal ~$150 (expires Mar 31, even years), surety bond $50,000 (as of July 2026), dedicated business landline in dealer's name, compliant sign, county/city occupation-tax certificate. Dealer plates available via DOR Form MV-6.
  - **Florida:** VW (wholesale) license via FLHSMV. Office ≥100 sq ft interior, 7-ft ceiling, exclusive use, separate entrance/address, permanent sign, zoning approval letter. $300 application, $25,000 bond, 16-hr pre-license course, LiveScan fingerprints, renewal $75/yr (Apr 30). **No dealer plates on a wholesale license** — auction access only; say this honestly on the page.
  - **North Carolina:** Wholesale dealer license via NCDMV License & Theft Bureau. Office ≥96 sq ft in a permanent building, sign with 3-inch letters, listed phone, reasonable hours, zoning compliance. ~$115.50/yr license, $50,000 bond. No pre-license course for wholesalers. Local inspector pre-approves the location.
- Suites page: Atlanta suite offering, bundle pricing, photo placeholders, availability inquiry form.
- Pricing page: every price above, plainly. Blog scaffold (MDX) for future SEO guides.
- SEO: metadata, OpenGraph, sitemap, JSON-LD for LocalBusiness; fast Core Web Vitals.

**2. Intake funnel**
- Multi-step wizard: contact info → state (GA/FL/NC) → license goal (auction access / retail / wholesale / suite needed?) → timeline → structured eligibility screen (age 18+, has or will form business entity, can obtain surety bond, residency state) → package selection → Stripe Checkout.
- Screening logic per state runs from a **declarative rules file** (`/config/states/*.ts`) — requirements, fees, documents, deadlines as data, not scattered code — so I can update rules without touching logic.
- A **criminal-history question is a soft flag only**: any "yes" or free-text legal question routes the lead to "attorney referral" status with a kind explanatory message. Never evaluate or advise.
- Optional AI chat assist on the intake pages (Claude-powered, with the guardrail system prompt): answers process/pricing/document questions from a knowledge base of our own content, refuses legal questions, offers to book a call. Falls back to static FAQ if no API key.

**3. Client portal** (magic-link login)
- Dashboard: application status tracker (stages: Intake → Documents → Packet Ready → Client Filed → Inspection → Licensed), outstanding tasks, deadline calendar.
- Document checklist with uploads (store locally in MVP; abstract storage for later S3 swap). AI completeness pass on uploads where feasible (e.g., "bond certificate present? matches state minimum?") with human-review flag — never auto-approve.
- Generated packet download (PDF): all client-provided data organized per that state's application requirements + filing instructions sheet + inspection-prep photo checklist.
- Compliance tab (subscribers): license/bond/insurance/occupation-tax expiry dates with 90/60/30-day automated email reminders (cron route or scheduled function).

**4. Admin dashboard** (me only)
- Pipeline board of leads/clients by stage with notes, tasks, and attorney-referral flags surfaced loudly.
- Client detail: documents, packet regeneration, deadline overrides, manual status changes, activity log.
- Metrics: leads by source/state, conversion, MRR (subscriptions), open filings by stage, upcoming deadlines across all clients.
- Suite management (lightweight): suite list with status (vacant/reserved/occupied), tenant link, lease dates, monthly rent — no full property-management accounting; I'll use dedicated PM software for that later.
- CSV export of any table.

**5. Ops & quality**
- Seed script with demo data (3 states, ~8 fake clients across stages, suites).
- `.env.example` documenting every variable. README with setup, run, deploy (Vercel), and Stripe test instructions written for a non-developer.
- Tests for the core business logic: state rules engine, deadline calculator, screening/flag routing, packet data assembly. Playwright smoke test of the intake funnel happy path.
- Accessible (labels, keyboard nav, contrast), responsive, and clean visual design — professional/trustworthy, not flashy. Light and dark friendly if easy.
- All copy in English, professional but plainspoken; every page carries the not-a-law-firm disclaimer.

## Milestones (build in this order; commit after each)
1. **Scaffold + marketing site + pricing + state guides** (fully static, deployable).
2. **Intake funnel + rules engine + Stripe test checkout + email abstraction.**
3. **Client portal: statuses, uploads, packet PDF generation, deadline reminders.**
4. **Admin dashboard + metrics + suite tracker + seed data.**
5. **AI layer: intake assistant + completeness checks with guardrails + fallbacks.**
6. **Tests, README polish, deploy checklist.**

Ask me clarifying questions only if something genuinely blocks you; otherwise make sensible defaults and note them in the README's "Decisions" section. When done, give me a punch list of what a human must do before real launch (Stripe live keys, domain, Resend, content verification against current state rules, attorney review of all copy).
