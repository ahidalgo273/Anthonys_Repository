---
name: monthly-financial-close
description: 'Run the Go America LLC monthly financial review after the CPA sends "Preliminary Financials": (1) find rehab / CapEx booked as expense, (2) audit GL 4111 Rent Income for leftovers after the GPR post, (3) review the Gross Potential Rent report for errors. Produces a findings list and a draft reply to the accountants. Use for "financial review", "close the books", "month-end review", "GPR review", "4111 audit", or /monthly-financial-close <Month YYYY>.'
argument-hint: "<Month YYYY>  (defaults to the month in the newest Preliminary Financials email)"
---

# Monthly financial close review (Go America LLC)

You are doing the owner-side review of the month's books. The CPA firm (M W Orlando CPA) keeps the
books in AppFolio and emails preliminary financials; Anthony reviews and replies with corrections.
Your job is to do the digging and hand Anthony a verified findings list plus a ready-to-send draft.

Read `references/background.md` before starting. It holds the people, the chart-of-accounts
cheat sheet, the worked examples from past closes, and the AppFolio query notes.

## Hard rules

- **Read-only in AppFolio.** Use `ask_appfolio` only. Never call `propose_appfolio_action` unless
  Anthony asks for a specific change in this session.
- **Draft, never send.** Create an Outlook reply draft (`outlook_create_reply_all_draft`). Anthony
  sends it himself.
- **Every finding needs evidence** from AppFolio: property, vendor or tenant, date, amount, GL, and
  the description text. If a number came from Realm-X without a transaction behind it, re-query
  before reporting it.
- **Separate "confident" from "needs your eyes".** Do not present a judgment call as a fact. Say
  what would change your mind (for example, a receipt).
- **Realm-X answers are not ground truth.** It guesses at ambiguous terms (for example, what counts
  as "sold"). Cross-check classifications against the property directory, and say so when you
  could not verify something.

## Step 0: Scope the month (about 3 minutes)

1. Search Outlook for the newest `"Preliminary Financials"` email from Vito Orlando. The subject
   names the month (for example `Go America LLC - October 2026 Preliminary Financials`).
2. Read the whole thread, including any replies Anthony already sent, so you do not repeat items.
3. Read the attached statements if they are readable. Note any line that looks off month over month.
4. Pull the property directory from AppFolio (name, status, management end date). Keep the list of
   Sold properties and their end dates. You need it in Steps 2 and 3.
5. Tell Anthony in one line: month, thread found, whether the GPR entry looks posted yet (Step 2
   tells you how to check).

## Step 1: Expense review for rehab / CapEx (about 15 minutes)

Goal: find items booked to an expense GL that should sit on the balance sheet.

1. Query the big-ticket lines for the month, **one GL account or small range per call** (large
   calls time out at 60 seconds). Priority order, based on where past misbookings were found:
   `5106 Make Ready`, `5129 General Repairs`, `5108 Plumbing`, `5103 HVAC Repair`, `5101 Carpet`,
   `5107 Other Repairs`, `5111 Windows`, `5100 Repairs & Maintenance`, `5075 Rental Preservation`,
   then `5060-5069` legal and professional (title and deed fees).
   Ask for bills **and** payments of $750 or more with property, unit, vendor, amount, date, and
   description. Bills and their payments come back as pairs: dedupe before counting.
2. Classify each line with the tests in `references/background.md` ("Capitalize or expense").
3. While reading the lines, also flag plain miscoding (wrong expense GL), since Anthony reports
   those in the same email. Past examples: Make Ready lines that were really `5110 Supplies
   Expense`; bonus recorded in `5706` versus `5803`; a receipt applied to a GL nobody recognized.
4. Flag `5075 Rental Preservation` lines that belong to a **sold** property. Those are not rental
   operating expenses. Past resolution: move to the preservation expense in the fix-and-flip
   bucket, not capitalized.
5. Flag make-ready spend on a unit that was occupied all month. A make ready needs a vacancy. The
   CPA does not hold receipts; the community manager does. List these as "request receipts".

Output for this step: a table of `property | vendor | date | amount | current GL | proposed
treatment | why | confidence`.

## Step 2: GL 4111 Rent Income audit (about 10 minutes)

Background: tenant rent charges credit 4111 all month. The CPA then posts the Gross Potential
Rent journal entry, which clears 4111 into `4090 GPR`, `4091 Gain/Loss To Lease`, `4092 Vacancy
Loss`, `4098 Delinquency`, and `4099 Concessions`. After that post, **4111 should net to zero per
property**. Anything left is an error.

1. Check whether the GPR entry is posted. Ask for 4111 activity for the month **including journal
   entries**, for a small group of properties. If you see only rent charges and no offsetting
   debits, either GPR is not posted yet or Realm-X left out the journal entries. Ask it directly
   which. If GPR is not posted, tell Anthony: the leftover test cannot run yet, but the
   charge-level checks below still can.
2. List properties whose 4111 net for the month is not zero after the post, with every
   transaction behind the balance.
3. Diagnose each leftover. Most common cause, by Anthony's experience: a **prepayment for a later
   month recorded as rent income**. It should sit as a prepaid on the tenant ledger (AppFolio
   shows the GL as "(none)" / prepayment) until that month's charge exists. Other causes seen:
   - a charge added or edited after GPR was posted (fix: reverse and repost GPR for that unit);
   - a rent charge for the wrong period (description says another month);
   - a credit or courtesy adjustment posted to 4111 that should be `4099 Concessions`;
   - activity on a sold property.
4. Charge-level checks that work even before the post: rent charges whose description names a
   different month, duplicate charges for one tenant, two tenants charged a full month on one
   unit, negative adjustments to 4111.

Output: `property | tenant | amount left in 4111 | cause | fix | who does it`.
Fixes on the tenant ledger are internal (Lucia). Reversing and reposting GPR is the CPA.

## Step 3: GPR report review (about 15 minutes)

1. Run **Gross Potential Rent Enhanced** for the month, all properties. Ask for every row with:
   unit, tenant, property, GPR, loss to market, monthly rent, concessions, vacancy loss,
   delinquency loss, net rent income, period.
2. Loss to lease is non-zero on most units, because market rent rarely equals lease rent. **A
   non-zero value is not the error.** Hunt for these patterns instead:
   - **Monthly rent is 0, no vacancy loss, and loss to lease equals GPR.** The unit was occupied
     but nobody charged rent, or a prorate was missed. Past examples were small prorated amounts
     ($35 to $56) from move-in or move-out days.
   - **Partial period** (the period is not the full month). Check that the prorated charge matches
     the days. Move-ins late in the month and move-outs early in the month are where managers
     forget to charge or prorate.
   - **Two tenant rows on one unit** in the same month. Check for overlap or a double charge.
   - **Sold property with any GPR row.** The CPA should not post GPR to a property after its
     management end date. Verify "sold" against the directory from Step 0, not Realm-X's label.
   - **Loss to lease larger than about 60 percent of GPR**, or a sign that makes no sense.
   - **Negative delinquency loss**, or delinquency equal to the full rent on a tenant who paid.
   - **Rent charged does not match the lease rent** on the rent roll.
3. For each hit, open the tenant ledger (ask Realm-X for that tenant's charges and receipts for
   the month) before calling it an error.
4. Decide the fix with the playbook in `references/background.md` ("GPR fixes").

Output: an `.xlsx` in the session scratchpad named `GPR Review - <Month YYYY>.xlsx` with the
flagged rows and a **Notes** column saying what to do, one instruction per row. This mirrors the
file Anthony has attached in past closes. Use the xlsx skill if available.

## Step 4: Report and draft (about 5 minutes)

1. Give Anthony a summary in chat: counts and dollar totals per step, then the tables. Lead with
   the items you are confident in. Put judgment calls in a separate "needs your eyes" list.
2. Create a **reply-all draft** on the Preliminary Financials thread in Anthony's voice (see
   "Email style" in `references/background.md`). Attach nothing yourself; tell Anthony which file
   to attach.
3. List what you could not verify and why.
4. State the next step for Anthony in one line.

## Known limits (tell Anthony when they bite)

- Realm-X does not return bill or payment links or IDs. Past emails used links like
  `https://goamerica.appfolio.com/accounting/payable_payments/<id>`. Identify each item by
  property, vendor, date, and amount, and tell Anthony which items still need a link.
- Calls time out at 60 seconds. A timeout does not mean failure: narrow the query (one GL, one
  state, or one property group) and run it again.
- Large results are saved to a file. Parse the CSV with a script; do not eyeball it.
- The GPR report runs on cash basis by default. State the basis in the summary.
