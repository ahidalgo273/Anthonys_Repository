# Setup brief: monthly financial close workspace (KeyLink folder)

Paste this whole file as the first message of a new session opened in the KeyLink folder.
It was written on 2026-11-19 by an earlier session that read four months of close emails and
queried AppFolio. Everything below is context for you, the new session.

---

## 1. What I want from you

I am Anthony Hidalgo, Director of Special Assets at KeyLink. Every month our outside CPA firm
emails preliminary financials for Go America LLC and I review them. I want to turn that review
into a reusable skill.

We will do it in two phases. **Do not skip ahead to phase 2.**

**Phase 1 (this session): set up the folder, then watch me work.**
1. Create the folder framework in section 2, filled with the context in sections 4 to 9.
2. Check the connectors in section 3 and tell me which are live.
3. Then stop and say you are ready. I will walk you through my October 2026 review step by step
   and explain my thinking. Your job while I do that:
   - Pull the data I ask for from AppFolio and Outlook.
   - Write down what I do and why in `walkthroughs/2026-10-october.md`, in my words.
   - Ask a question when my reasoning is not clear or when two of my calls look inconsistent.
     Do not assume I am right. If the data disagrees with me, say so and show the rows.
   - Keep a running list of open questions and of rules you think you have inferred. Read the
     inferred rules back to me so I can confirm or correct them.

**Phase 2 (only when I say so): write the skill** from the walkthrough, into `skill/SKILL.md`.

The context below is a starting point from a session that did not watch me work. Where it
conflicts with what I show you, what I show you wins. Note the correction in `lessons-log.md`.

## 2. Folder framework to create

Create this inside the KeyLink folder. If a `financial-close` folder already exists, show me
what is in it before changing anything.

```
financial-close/
  README.md                  what this folder is, how to start a monthly run
  CONTEXT.md                 sections 4, 5 and 9 of this brief
  connectors.md              section 3
  reference/
    people.md                section 4 people table
    chart-of-accounts.md     section 6
    past-decisions.md        section 7
    appfolio-query-notes.md  section 8
  walkthroughs/
    2026-10-october.md       empty template: date, step, what Anthony did, why, data pulled, open questions
  skill/
    SKILL.md                 placeholder only, written in phase 2
    prior-draft.md           note pointing to the earlier draft (section 10)
  outputs/                   per-month working files, for example GPR review spreadsheets
  lessons-log.md             dated corrections: what the item was, what was assumed, what Anthony decided
```

Keep tenant names out of every file except the per-month files in `outputs/` and `walkthroughs/`.

## 3. Connectors

| Connector | Used for | Notes |
|---|---|---|
| AppFolio Realm-X | General ledger, bills and payments, GPR report, property directory, tenant ledgers | Tool `ask_appfolio`. Database is goamerica.appfolio.com |
| Microsoft 365 (Outlook) | The close emails. My work mail is Outlook, **not Gmail** | Search, read, and create reply drafts |
| Excel / xlsx skill | The GPR review spreadsheet I attach to my reply | |

Rules for these:
- **AppFolio is read-only.** Use `ask_appfolio`. Do not call `propose_appfolio_action` unless I
  ask for a specific change.
- **Email is draft-only.** Create a reply-all draft. I send it myself.
- If a connector is missing or fails to connect, tell me. Do not substitute made-up data.

## 4. The situation

- **Entity:** Go America LLC. Books are kept in AppFolio by M W Orlando CPA.
- **Trigger:** an email from Vito Orlando with the subject
  `Go America LLC - <Month YYYY> Preliminary Financials`. It has arrived between the 19th and
  the 25th of the following month. October 2026 arrived on 2026-11-19 and was unread. Vito said
  the P&Ls by job would follow separately.
- **My turnaround** has been about one day.

People:

| Who | Role in the close |
|---|---|
| Vito Orlando (M W Orlando CPA) | Sends the preliminary financials. Main recipient of my review |
| Mikaila Woodward (M W Orlando CPA) | Made the journal entries and GPR reversals and reposts through the August close |
| Thomas Perna (M W Orlando CPA) | Copied from the September close onward |
| Mark W Orlando (M W Orlando CPA) | Copied on every thread |
| Damien Chiodo | President. On every thread. Decides treatment questions |
| Lucia Dominguez | Internal. Edits tenant-ledger charges |
| Community managers (Vickie for Park South) | Hold purchase receipts. The CPA does not have them |

Keep the To and Cc of the thread being replied to.

Portfolio on 2026-11-19: 392 properties in the directory, 366 active and 26 sold, almost all
single-unit records. GA 136, PR 133, OH 114, SC 5, CA 3, IL 1. Park South is the Jackson Street
and Jefferson Street units in Augusta, GA. Puerto Rico units carry small tenant rent amounts,
which is normal. Some bills are coded to the owning entity (for example "Go Ohio 2, LLC",
written GOOH2) with the unit only in the description. Sold properties stay in AppFolio with a
management end date and reason "Owner Sold".

## 5. The three checks, as I described them

1. **Expenses for rehab / CapEx.** I go through the month's expenses, look at the big-ticket
   items, read the descriptions, and ask the CPA to move anything I can reasonably call CapEx
   or rehab to the balance sheet.
2. **GL 4111 Rent Income audit.** Each month gross potential rent (GPR) is posted, and there is
   often an amount left in 4111 because something was booked wrong. Most often it is a
   prepayment for a later month booked as rent income, which should sit as a prepaid ("(none)"
   in AppFolio).
3. **GPR report review.** I go through the GPR report for errors. I usually start in the loss to
   lease column, because a manager forgot to charge or prorate a tenant's rent, or the CPA
   posted a GPR entry to a sold property.

Order in every past close: expenses, then 4111, then GPR.

## 6. Chart of accounts cheat sheet

| GL | Name | Notes |
|---|---|---|
| 4090 | Gross Potential Rents | Posted by the CPA's monthly GPR entry |
| 4091 | Gain/Loss To Lease | "LTL" in emails |
| 4092 | Vacancy Loss | |
| 4098 | Delinquency | |
| 4099 | Concessions | Where forgiven or uncharged days go |
| 4111 | Rent Income | Tenant rent charges |
| 4112-4114 | GHVP, HAP, HUD Income | Subsidy income |
| 4700 | Prepaid Rental Income | |
| 2999 | Prepaid Rental Liability | Balance sheet |
| 5075 | Rental Preservation | Has held costs for sold properties |
| 5101, 5103, 5107, 5111 | Carpet, HVAC Repair, Other Repairs, Windows | |
| 5106 | Make Ready | Most frequent home of misbooked rehab |
| 5108 | Plumbing | |
| 5110 | Supplies Expense | |
| 5129 | General Repairs | |
| 5060-5069 | Legal and professional | Title and deed fees |
| 5211, 5216 | Preservation, Rehab (cost of goods sold) | Fix-and-flip properties |
| 5706 | Bonus (payroll) | |
| 5803 | Bonus (outside services) | |

The capital / fixed-asset balance sheet accounts were not returned by AppFolio. Past emails say
"capitalize" and leave the account to the CPA.

## 7. What past closes show (June to September 2026)

Capitalization calls I made:

| Item | My call | My stated reason |
|---|---|---|
| Rehab bills on a unit (Vine Street) | Capitalize | "these are rehabs" |
| Flooring | Capitalize | |
| HVAC bill, 74 Woodrow | Capitalize | "it was a full replacement" |
| $5,800 plumbing bill, 842 Vine | Capitalize | |
| General repairs bill | Capitalize | "substantial repairs" |
| Title and deed fees | Capitalize, spread evenly across the portfolio | Cost of changing the title holder goes to basis |
| Preservation on sold properties in 5075 | Not capitalized. Moved to preservation expense in the fix-and-flip bucket | Distorted rental operating expenses. Damien decided |

No dollar threshold appears in any email. **Ask me how I decide.** This is the least defined
part of the review.

Other items I raised: Make Ready lines that belonged in 5110 Supplies; a bonus booked as bonus
that should have been salary; whether bonus was in 5706 or 5803; a receipt applied to a GL
nobody recognized; make-ready spend on units occupied all year, where I asked for receipts.

GPR fixes used:

| Situation | Fix | Who |
|---|---|---|
| GPR posted to a sold property | Reverse the GPR for that property | CPA |
| Tenant not charged for days occupied, and should be | Add the charge on the tenant ledger to 4111, then unpost and repost GPR | Lucia, then CPA |
| Days deliberately not charged | Journal entry out of 4091 Gain/LTL into 4099 Concessions | CPA |
| Charge booked to 4111 that should be a concession | Edit the charge, then repost GPR | Lucia, then CPA |
| Fix would mean editing a completed move-out | Leave the ledger. Repost GPR, then journal 4091 to 4099 | CPA |

Order: reverse GPR, edit the tenant ledger, repost GPR. Twice the CPA wrote back that they
could not tell what one of my notes was asking for, which cost a round trip each time.

My email style: short and numbered, one item and one instruction per number, an AppFolio link
per item, reason given only when the treatment is not obvious. Typical opener: "Thanks for
these Vito, here are some notes:". I say what I am moving to next ("moving to GPR now"). GPR
revisions go as an attached spreadsheet with a Notes column and a one-line email. Outlook adds
my signature.

## 8. AppFolio (Realm-X) query notes

Worked on 2026-11-19:
- Property directory with status and management end date.
- Chart of accounts by range.
- Bills and payments of $750 or more for one GL account for one month, with property, vendor,
  amount, date, description. About 30 seconds. Bills and payments come back as pairs.
- 4111 general ledger detail for a month, per property with transactions.
- Gross Potential Rent Enhanced for a month, all properties: 482 rows for October 2026, cash basis.

Limits:
- **Calls time out at 60 seconds.** One call across about 30 expense accounts timed out. Split by
  account, state, or property group.
- **No bill or payment links or IDs come back.** My emails use links like
  `https://goamerica.appfolio.com/accounting/payable_payments/<id>`. Ask me for them.
- Large results are saved to a file as CSV. Parse them with a script.
- Realm-X guesses at loose terms. It labelled 133 GPR rows as "sold or ended", including at
  least one active property. Check sold status against the directory.

## 9. Open questions and unverified items

1. **What does 4111 look like after the GPR post?** The October query showed $197,244.65 of rent
   charges across 237 properties and no offsetting entries. Either October GPR was not posted,
   or journal entries were left out of the result. Not settled.
2. **Loss to lease as a filter.** It was non-zero on 286 of 482 October rows, since market rent
   rarely equals lease rent. Watch which rows I actually stop on and work out the real pattern.
3. **How do I define "big ticket"?** $750 was only a query floor chosen by the earlier session.
4. **Where are prepayments visible** in AppFolio so the 4111 leftovers can be traced?

October rows the earlier session noticed, not verified, for me to confirm or dismiss:
- 157 Sherman and 217-A Metcalf: rent 0, no vacancy, full GPR in loss to lease.
- 526 Vine: two tenant rows in October, each with a $1,200 rent charge.
- 808 Greenwood: period starts 10/02, $212.90 charged against $967.74 GPR.
- 5106 Make Ready: $2,000 to KZB Sewer Water and Excavating, described only as "CHECK # 107".

## 10. Earlier draft skill

A first-pass skill exists in my GitHub repository `ahidalgo273/Anthonys_Repository`, branch
`claude/monthly-financial-review-sbg2x5`, at `.claude/skills/monthly-financial-close/`. It was
written from emails alone. Treat it as a reference to compare against after the walkthrough,
not as the answer. Do not copy it into `skill/SKILL.md`.

## 11. How to talk to me

- Lead with the next action. Number multi-step work. One concrete next step at the end.
- Restate where we are each turn (for example "Step 2 of 3, 4111 audit").
- No preamble, no recap, no closing pleasantries. Time estimates in minutes.
- State errors plainly: cause, then fix.
- Do not agree with me to be agreeable. Show both sides when a treatment is arguable, and name
  the source and its bias when you cite one.
