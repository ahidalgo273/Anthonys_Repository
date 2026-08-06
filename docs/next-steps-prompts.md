# "What do I do next?" prompts

Paste one of these into a Claude Code session opened on this repository.

They are written to make Claude **read the actual current state of the project**
before answering — which environment variables are set, which placeholders you
have replaced, what `/admin/settings` reports — rather than repeating a list
that goes stale the moment you change something.

Copy everything inside the box, including the numbered rules. The rules are the
part that makes the answer usable.

---

## 1. Launch roadmap — start here

Use this first, and again whenever you have finished a batch of steps and want
to know what is now unblocked.

```text
I'm the owner of DealerDesk — a dealer-licensing service (GA/FL/NC application
prep + Atlanta office suites). I'm not a developer. The platform in this repo is
built and pushed, but nothing is live yet.

Before you answer, actually read the current state of things:
- README.md, especially section 12 (the launch punch list)
- config/site.ts — which values are still placeholders
- config/states/*.ts — every "CONTENT: verify" marker
- .env and .env.example — which services are actually configured
- Run the app and check /admin/settings, which reports what's connected

Then give me a step-by-step guide to getting this live and taking real money.

Rules for your answer:
1. Order it by what actually blocks what. Tell me what has to happen before
   what, and what I can do in parallel.
2. Split every step into either "Anthony has to do this himself" (attorney,
   Stripe account, buying a domain, phoning the state boards) or "Claude can do
   this in a session" — and say which.
3. For each step give me a rough time cost and dollar cost.
4. Flag anything that would be expensive or embarrassing to get wrong.
5. End with ONE thing to start today.

Be concrete. Use real values you found in the repo, not placeholders. If
something's genuinely ambiguous, ask me instead of guessing.

You're not a lawyer and neither am I — for anything legal, tell me to ask one.
```

**Why it is shaped this way.** The read-the-repo instruction keeps the answer
accurate as the project changes. The do-it-yourself / Claude-can-do-it split
matters most: a list that mixes "call an attorney" with "add a storage driver"
is the kind that gets read once and abandoned.

---

## 2. First paying clients

Use this once the site is live and taking payments.

```text
DealerDesk is live and taking payments. I need my first 5 paying clients.

Context you should read first: README.md, config/pricing.ts, and the three
state guides in config/states/ — especially the "honestCaveat" fields, which
say what each license genuinely can't do.

My wedge is that I publish my prices. Competitors hide theirs until they have
your phone number, take deposits, and add fees later.

Give me a step-by-step plan to the first 5 clients. Cover:
1. Which state to lead with, and why — based on what the license actually does
   for the buyer, not on which is cheapest for me.
2. Who the buyer really is (car flippers, brokers, exporters, online
   wholesalers) and where they already spend time online.
3. How to use published pricing as the pitch rather than burying it.
4. What I can do this week with roughly $0, versus what needs a budget.
5. What to say to someone who wants a Florida wholesale license because they
   think it comes with dealer plates. It doesn't, and I'd rather lose the sale.

Be specific — name the channel, the message, and the first action.

Tell me plainly which parts of this you're confident about and which are
guesses. I'd rather have three things that work than ten that sound good.
```

---

## 3. Weekly check-in

Short. Use it every week or two to stay oriented.

```text
Review this repo and tell me:
1. What changed since the last time we talked.
2. What's now stale or risky — especially any "CONTENT: verify" state facts in
   config/states/ that I haven't confirmed against the current state rules.
3. What became unblocked because of something I finished.
4. My next 3 actions, in order.

Keep it under a page. Check /admin/settings for what's actually configured
rather than assuming.
```

---

## A note on the state facts

Every fee, bond amount, square footage, and deadline in `config/states/` is
marked `CONTENT: verify against current state rules before launch`. Those
markers exist because these numbers change — Georgia's bond and office minimum
both moved recently.

No prompt can verify them for you. They have to be checked against the state
boards themselves, using the official links in the `citations` field at the
bottom of each state file. Prompt 3 will keep reminding you which ones are
still unconfirmed.
