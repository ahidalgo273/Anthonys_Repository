# DealerDesk

A web platform for a two-sided dealer-licensing business:

- **License filing** — preparing used-car dealer license applications for Georgia, Florida, and North Carolina, plus ongoing compliance tracking.
- **Dealer suites** — renting license-compliant micro-office suites in Atlanta to those same clients as their state-required established place of business.

Everything is built around one idea the incumbents do not offer: **published prices, no hidden fees, and the client stays the applicant on every form.**

---

## Table of contents

1. [Run it on your computer](#1-run-it-on-your-computer)
2. [Sign in](#2-sign-in)
3. [The files you will actually edit](#3-the-files-you-will-actually-edit)
4. [Connecting Stripe (test mode)](#4-connecting-stripe-test-mode)
5. [Connecting email](#5-connecting-email)
6. [Connecting the AI assistant](#6-connecting-the-ai-assistant)
7. [The daily reminder job](#7-the-daily-reminder-job)
8. [Deploying](#8-deploying)
9. [Running the tests](#9-running-the-tests)
10. [How the legal guardrails work](#10-how-the-legal-guardrails-work)
11. [Decisions](#11-decisions)
12. [Before you launch — punch list](#12-before-you-launch--punch-list)

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) version 20 or newer. Nothing else — no database to install, no accounts to create.

```bash
npm install                  # download the code's dependencies
cp .env.example .env         # create your settings file
npx prisma migrate dev       # create the database (one file: prisma/dev.db)
npm run seed                 # fill it with realistic demo clients
npm run dev                  # start the site
```

Open <http://localhost:3000>.

That is the whole setup. Payments, email, and AI all have working fallbacks, so the entire app — including checkout and the client portal — runs with no external accounts at all.

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site with live reload while you edit |
| `npm run build` | Build the production version |
| `npm run start` | Serve the production build |
| `npm test` | Run the business-logic tests |
| `npm run test:e2e` | Run the browser tests (needs `npx playwright install` once) |
| `npm run seed` | **Erase everything** and reload demo data |
| `npm run db:studio` | Open a spreadsheet-like view of your database |
| `npm run typecheck` | Check for programming errors |

> ⚠️ `npm run seed` deletes all data first. Never run it once you have real clients. It refuses to run in production.

---

## 2. Sign in

There are no passwords. You enter your email, we send you a link, and clicking it signs you in. The link works once and expires after 15 minutes.

**While developing, emails are not actually sent — they print in your terminal.** So:

1. Go to <http://localhost:3000/signin>
2. Enter `admin@example-dealerdesk.com` (created by the seed script)
3. Look at the terminal where `npm run dev` is running
4. Find the block that starts `📧 EMAIL (console driver...)` and copy the link
5. Paste it into your browser

You are now signed in as the admin. The seeded client accounts work the same way — `marcus.webb@example.com` and the others listed at the end of the seed output.

| Area | What is there |
| --- | --- |
| `/admin` | Your pipeline, clients, metrics, suites, deadlines, and settings |
| `/portal` | What a client sees: their status, documents, packet, and deadlines |
| `/` | The public marketing site |

---

## 3. The files you will actually edit

You do not need to touch most of the code. These are the files that hold your business's actual information:

| File | What it controls |
| --- | --- |
| `config/site.ts` | Business name, address, phone, email, and the legal disclaimer wording |
| `config/pricing.ts` | Every price you charge |
| `config/states/ga.ts`, `fl.ts`, `nc.ts` | All state requirements: fees, bond amounts, office rules, documents, deadlines, screening questions |
| `content/faq.ts` | The FAQ |
| `content/blog/*.mdx` | Guides — drop in a new `.mdx` file and it publishes itself |
| `lib/email/templates.ts` | The wording of every email the system sends |
| `config/ai.ts` | The assistant's rules and refusal wording |

**Why this matters:** changing a state's rules in `config/states/` updates its guide page, the intake screening questions, the document checklist, the generated packet PDF, and the renewal reminders — all together. There is no second copy to keep in sync.

### Adding a fourth state

1. Copy `config/states/ga.ts` to a new file, e.g. `tx.ts`, and edit the facts.
2. Add `"TX"` to `StateCode` in `config/states/types.ts`.
3. Add it to `stateList` in `config/states/index.ts`.

The guide page, funnel, checklist, packet, and reminders pick it up automatically.

### Publishing a guide

Create `content/blog/my-guide.mdx` starting with:

```
---
title: "My Guide Title"
description: "One sentence for search engines."
date: "2026-08-01"
---
```

Then write normally underneath. Add `draft: true` to hide it while you work.

---

## 4. Connecting Stripe (test mode)

**You can skip this entirely at first.** Without Stripe keys, checkout runs in a clearly-labeled demo mode: no card is charged, but the lead, application, and client account are created exactly as a real payment would create them. Demo orders are marked and **excluded from every revenue figure**.

When you are ready:

### Step 1 — Get your test keys

1. Create an account at [stripe.com](https://stripe.com).
2. Make sure the **Test mode** toggle in the dashboard is ON.
3. Go to **Developers → API keys** and copy the **Secret key** (starts with `sk_test_`).
4. Put it in `.env`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   ```

### Step 2 — Create your products

In the Stripe dashboard, go to **Product catalogue** and create one product per line below. After creating each one, click into its price and copy the **price ID** (starts with `price_`).

| Create this product | Price | Billing | Put its price ID in |
| --- | --- | --- | --- |
| License Filing Package | $795.00 | One time | `STRIPE_PRICE_LICENSE_FILING` |
| Compliance Subscription | $59.00 | Monthly | `STRIPE_PRICE_COMPLIANCE` |
| Suite + Compliance Bundle | $549.00 | Monthly | `STRIPE_PRICE_SUITE_BUNDLE` |
| Suite Setup Fee | $995.00 | One time | `STRIPE_PRICE_SUITE_SETUP` |
| LLC / EIN Setup Assistance | $199.00 | One time | `STRIPE_PRICE_ADDON_LLC_EIN` |
| Pre-Inspection Photo Review | $99.00 | One time | `STRIPE_PRICE_ADDON_PHOTO_REVIEW` |
| Occupation Tax Certificate Handling | $149.00 | Yearly | `STRIPE_PRICE_ADDON_OCCUPATION_TAX` |

> The amounts in Stripe must match `config/pricing.ts`. Stripe controls what is charged; the website controls what is displayed. If they disagree, customers see one price and pay another.

**Check your work:** sign in as admin and open **/admin/settings**. Every product should say "Ready". Anything saying "Price ID missing" will fall back to demo checkout.

### Step 3 — Connect the webhook

The webhook is how Stripe tells your app that a payment succeeded. Without it, customers pay but no account is created.

To test locally, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

It prints a signing secret starting with `whsec_`. Put it in `.env` as `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.

In production, add the webhook in **Developers → Webhooks** pointing at `https://yourdomain.com/api/stripe/webhook`, subscribed to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### Step 4 — Make a test purchase

Walk through `/intake`. At Stripe's checkout page use test card **4242 4242 4242 4242**, any future expiry, any CVC. You should land on the confirmation page, and the client should appear in `/admin`.

---

## 5. Connecting email

By default emails print to your terminal instead of being sent. That is intentional — it is how you sign in while developing, and it means you cannot accidentally email a real person with test data.

To send real email, sign up at [resend.com](https://resend.com), verify your sending domain, then set:

```
EMAIL_DRIVER="resend"
RESEND_API_KEY="re_..."
EMAIL_FROM="DealerDesk <hello@yourdomain.com>"
```

`EMAIL_FROM` must use a domain you verified with Resend, or Resend will reject the send.

> **Until you do this, clients cannot sign in to the portal** — their sign-in link goes to your server log, not their inbox. This is on the launch punch list.

---

## 6. Connecting the AI assistant

Optional. Without it, the assistant on the intake pages searches your own FAQ instead, and the UI honestly labels itself "FAQ search" rather than pretending to be an assistant. Document checks fall back to deterministic rules. Nothing is broken.

To enable it, get a key from [console.anthropic.com](https://console.anthropic.com) and set:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

The model is set in `config/ai.ts` (currently `claude-sonnet-5`). Change it in that one place to move the whole app.

**Read section 10 before enabling this.** The assistant is under a legal guardrail, and you should understand what it does.

---

## 7. The daily reminder job

Deadline reminders go out 90, 60, and 30 days before each date. A scheduler has to trigger them once a day.

Set a long random secret in `.env`:

```
CRON_SECRET="some-long-random-string-you-invent"
```

On Vercel, `vercel.json` already schedules this — just add `CRON_SECRET` to your environment variables there.

Anywhere else, point a daily scheduler (cron, a monitoring service, anything) at:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/reminders
```

Running it more than once a day is harmless — each reminder is recorded so nobody gets the same email twice.

> In production the job **refuses to run** if `CRON_SECRET` is not set. That is deliberate: without it, anyone who found the URL could trigger emails to your clients.

---

## 8. Deploying

### The important thing to understand first

This app stores data in two places:

1. **The database** — a single file, `prisma/dev.db`
2. **Uploaded documents** — files in a `storage/` folder

**On Vercel, both of those are erased on every deployment.** Vercel's servers do not keep files between deploys. So you have two options:

### Option A — Your own server (simplest, matches how it is built)

Any small VPS ($5–10/month from Hetzner, DigitalOcean, etc.) or even a computer that stays on. Nothing to change:

```bash
git clone <your repo>
npm install
cp .env.example .env        # fill in your real values
npx prisma migrate deploy
npm run build
npm run start
```

Put it behind a reverse proxy for HTTPS, and back up `prisma/dev.db` and `storage/` on a schedule. **This is the recommended path until you have enough clients to justify more.**

### Option B — Vercel (needs two swaps)

1. **Database → Postgres.** Create a free database at [Neon](https://neon.tech) or [Supabase](https://supabase.com). Then:
   - In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
   - Set `DATABASE_URL` to the connection string Neon/Supabase gives you
   - Run `npx prisma migrate deploy`

   Nothing else changes — the schema deliberately uses no SQLite-only features.

2. **Uploads → object storage.** Add a driver in `lib/storage/drivers/` for [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) or S3, register it in `lib/storage/index.ts`, and set `STORAGE_DRIVER`. The rest of the app calls `putObject`/`getObject`/`deleteObject` and does not care which driver answers.

Then set every environment variable from `.env.example` in Vercel's project settings, and push.

---

## 9. Running the tests

```bash
npm test          # business logic — fast, no browser needed
npm run test:e2e  # full browser walkthrough of the intake funnel
```

The browser tests need Chromium once: `npx playwright install chromium`.

What is covered:

| Test file | What it protects |
| --- | --- |
| `tests/guardrails.test.ts` | **The legal guardrail.** Legal questions refused, ordinary questions answered, unsafe replies withheld, SSNs never logged |
| `tests/screening.test.ts` | Eligibility rules, attorney-referral routing, state rule data integrity |
| `tests/deadlines.test.ts` | Renewal dates including Georgia's even-year rule, reminder milestone selection |
| `tests/packet.test.ts` | Packet assembly, and that SSN fields stay blank |
| `tests/pricing-and-csv.test.ts` | Published prices, CSV escaping and formula-injection protection, document checks |
| `e2e/intake.spec.ts` | The funnel end to end, the referral route, the disclaimer gate, disclaimer on every page |

> If a test in `tests/guardrails.test.ts` ever fails, stop and fix it before shipping anything else. A failure there means the assistant would answer a question that requires a lawyer.

---

## 10. How the legal guardrails work

The business's central legal risk is giving legal advice without being a lawyer. Four things protect against that, and none of them is just a note in the copy.

### The disclaimer is on every page

A shared component renders it, and every footer uses it — marketing, portal, and admin. A browser test asserts it is visible on the key pages.

### Nothing about the product signs or files for a client

There is no code path that submits anything to a state. Packets are generated as drafts, with a cover page saying so.

### We never store a Social Security number

There is no column for one in the database. The portal will not render a field for one, and drops the value server-side even if one is posted. The packet prints a labeled blank ruled line instead, and the cover page lists what the client must complete by hand. Tests assert this in all three states.

### The assistant refuses legal questions in three layers

1. **The system prompt** tells the model the rules.
2. **A pre-check** inspects the client's message *before* any model call. If it is asking for legal advice, no model call happens at all.
3. **A post-check** inspects the reply — first with fixed patterns, then with a second model call that reviews it.

Layers 2 and 3 are ordinary code, so they work no matter what the model decides to do. A prompt is an instruction; these are controls.

Whenever any layer fires:

- The person gets a polite deferral, not a guess.
- The lead is flagged **attorney referral requested**, shown loudly at the top of your admin pipeline.
- The person is emailed, and so are you.
- A record is written to the audit log, visible on the lead's page.

The same routing happens in the intake form: a "yes" on the criminal-history question, or *any* text in the legal-question box, creates a referral. **It never blocks anyone** — we do not decide who is eligible, we just stop pretending we can answer.

---

## 11. Decisions

Choices made while building, and why.

| Decision | Why |
| --- | --- |
| **SQLite by default** | Runs with zero setup. The schema uses no SQLite-only features, so moving to Postgres is a provider change plus one migrate command. |
| **Next.js 16, not 15** | Next 15.5 pulls in transitive `postcss` and `sharp` security advisories that only a Next 16 upgrade resolves. The dependency tree currently audits clean. |
| **Auth written in-house, not Auth.js** | Auth.js v5 is still a beta with breaking changes between releases; v4's App Router support is retrofitted. Magic-link-only auth with no passwords is small enough to implement correctly in three readable files, and it means no beta dependency in the login path. |
| **Prisma enums and `Json` used directly** | Verified they work on SQLite in Prisma 6, so no string-encoding workaround was needed. Both port to Postgres unchanged. |
| **Packet assembly split from PDF rendering** | `assemblePacket()` is a pure function producing a document model; the renderer turns it into pages. The interesting logic is testable without parsing a PDF. |
| **Packets generated on demand, never stored** | A packet always reflects current data and current state rules. Regenerating after a rule change removes any chance of handing someone a stale document. |
| **Demo checkout when Stripe is absent** | Lets the whole funnel be demonstrated and tested without a Stripe account, while marking those orders so demo activity never reaches revenue numbers. |
| **AI never reads values off documents** | The image check reports legibility and framing only. Client-entered amounts are compared to state minimums deterministically — a hallucinated "bond looks fine" is worse than no check. |
| **Every AI feature has a non-AI path** | The business should not stop working because an API is down or a key expired. |
| **Brand and contact details are obvious placeholders** | Nothing fake-but-plausible ships. `/admin/settings` shows which values still need replacing. |
| **Suite tracking is deliberately minimal** | Occupancy, tenant, lease dates, rent. Full property-management accounting belongs in dedicated software, not here. |

---

## 12. Before you launch — punch list

Work through this before taking a real customer's money.

### Legal — do these first

- [ ] **Have an attorney review all site copy**, especially `/legal/disclaimer`, `/legal/terms`, and `/legal/privacy`. The terms and privacy pages are drafts and say so on the page.
- [ ] Have the attorney review the packet cover page wording (`lib/packet/assemble.ts`, `draftNotice`) and the assistant's refusal wording (`config/ai.ts`).
- [ ] Confirm the not-a-law-firm boundaries in section 10 match how you actually intend to operate.
- [ ] Line up the attorney you will refer people to. The system creates referrals from day one.

### Verify every state fact

- [ ] Search the code for `CONTENT: verify` — every one marks a fact that must be re-checked against current state rules. They are in `config/states/ga.ts`, `fl.ts`, and `nc.ts`.
- [ ] Confirm with the source, not a competitor's website. Each state file lists official links under `citations`.
- [ ] Particularly confirm: Georgia's $50,000 bond and 250 sq ft minimum (both changed recently), Florida's $300 fee and no-dealer-plates rule, North Carolina's renewal date.
- [ ] Set a recurring reminder to re-check these. They change.

### Your business details

- [ ] Replace every placeholder in `config/site.ts`: business name, street address, city, postal code, phone, email, admin email, booking URL, and map coordinates. Check `/admin/settings` — it lists which are still placeholders.
- [ ] Confirm `DealerDesk` is the name you are trading under.
- [ ] Replace the suite photos on `/suites` (currently "Photo coming soon" placeholders) with real photographs of the building and suites.

### Accounts and keys

- [ ] Buy your domain and point it at your host.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your real domain.
- [ ] Create your Stripe **live** products and prices, and swap the test keys for live ones.
- [ ] Add the live Stripe webhook and its signing secret.
- [ ] Sign up for Resend, verify your sending domain, and set `EMAIL_DRIVER=resend`. **Until this is done, clients cannot sign in.**
- [ ] Set `CRON_SECRET` and confirm the daily reminder job runs.
- [ ] Optionally add `ANTHROPIC_API_KEY`.

### Hosting

- [ ] Choose Option A or B in section 8.
- [ ] If Vercel: switch to Postgres and add an object-storage driver, or uploaded documents will vanish on each deploy.
- [ ] Set up automatic backups of the database and the uploaded documents.
- [ ] Create your own admin account and delete the seeded demo data (`admin@example-dealerdesk.com` and the eight example clients).

### Final check

- [ ] Run `npm test` and `npm run test:e2e` — both green.
- [ ] Make one real test-mode purchase of each package and confirm the client account appears in `/admin`.
- [ ] Sign in to the portal as a test client, upload a document, and download the packet. Confirm the SSN line is blank.
- [ ] Ask the assistant a legal question and confirm it refuses and creates a referral.
- [ ] Check `/admin/settings` — every service should read as configured.

---

**DealerDesk is not a law firm and does not provide legal advice.** That statement is a product requirement, not marketing copy. Everything in section 10 exists to keep it true.
