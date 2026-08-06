# DealerDesk

A web platform for a two-sided dealer-licensing business:

- **License filing** — preparing used-car dealer license applications for Georgia, Florida, and North Carolina, plus ongoing compliance tracking.
- **Dealer suites** — renting license-compliant micro-office suites in Atlanta to those same clients as their state-required established place of business.

> The full setup, deployment, and Stripe walkthrough arrives in Phase 6. This is enough to run what exists today.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer. Then:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

No accounts, keys, or database are required yet — the marketing site is fully static.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the production site |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Check for TypeScript errors |

## The files you will actually edit

| File | What it controls |
| --- | --- |
| `config/site.ts` | Business name, address, phone, email, and the legal disclaimer text |
| `config/pricing.ts` | Every published price |
| `config/states/ga.ts`, `fl.ts`, `nc.ts` | All state requirements, fees, bond amounts, documents, deadlines |
| `content/faq.ts` | The FAQ (feeds the home page, the FAQ page, and later the AI assistant) |
| `content/blog/*.mdx` | Guides — drop in a new `.mdx` file and it publishes itself |

Changing a state's rules in `config/states/` updates its guide page, the intake screening, the document checklist, the generated packet, and the renewal reminders together. There is no per-page copy to keep in sync.

## Before this goes live

Placeholder values are marked in the code and collected into a launch punch list in Phase 6. The big ones:

- Real business name, address, phone, and email in `config/site.ts` (currently obvious placeholders)
- **Verify every fact marked `// CONTENT: verify against current state rules before launch`** in `config/states/`
- Attorney review of all copy, especially `/legal/*`
- Real suite photographs on the suites page

## Build progress

- [x] **Phase 1** — Scaffold, marketing site, pricing, state guides, blog, SEO
- [ ] **Phase 2** — Intake funnel, rules engine, Stripe checkout, email
- [ ] **Phase 3** — Client portal, uploads, packet PDFs, deadline reminders
- [ ] **Phase 4** — Admin dashboard, metrics, suite tracker, seed data
- [ ] **Phase 5** — AI assistant with legal guardrails
- [ ] **Phase 6** — Tests, full README, deploy checklist
