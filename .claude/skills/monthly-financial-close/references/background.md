# Background for the monthly financial close

Sources: Anthony's sent mail on the June, July, August, and September 2026 closes, and AppFolio
(Realm-X) queries run on 2026-11-19. Anything marked "unverified" was inferred, not confirmed.

## People and roles

| Who | Role in the close |
|---|---|
| Vito Orlando (M W Orlando CPA) | Sends "Go America LLC - <Month> Preliminary Financials". Main recipient of the review. |
| Mikaila Woodward (M W Orlando CPA) | Made the journal entries and GPR reversals and reposts through the August close. |
| Thomas Perna (M W Orlando CPA) | Copied from the September close onward. |
| Mark W Orlando (M W Orlando CPA) | Copied on every thread. |
| Damien Chiodo | President. On every thread. Makes the call on treatment questions. |
| Lucia Dominguez | Internal. Edits tenant-ledger charges. |
| Community managers (Vickie for Park South) | Hold purchase receipts. The CPA does not have them. |

Keep the same To and Cc as the thread you are replying to. Do not add or drop people.

## Timing

Preliminary financials arrive between the 19th and the 25th of the following month. Anthony has
replied within about one day. Order of work in every past close: expenses first, then 4111, then
GPR. He tells the CPA what he is moving to next ("moving to GPR now").

## Portfolio shape (2026-11-19)

- 392 properties in the directory: 366 active, 26 sold. Almost all are single-unit records.
- By state: GA 136, PR 133, OH 114, SC 5, CA 3, IL 1.
- Park South is the Jackson Street and Jefferson Street units in Augusta, GA.
- Puerto Rico units (Calle Cedro, Calle Sauce, Calle Higuerillo, Calle Mango) carry small tenant
  rent amounts. That is normal for those units, not an error.
- Some bills are coded to the owning entity (for example "Go Ohio 2, LLC", written GOOH2 in
  emails) instead of a single property. The unit is then only in the description text.
- Sold properties stay in AppFolio with a management end date and reason "Owner Sold". Several
  have "Sold <month>" in the name.

## Chart of accounts cheat sheet

Income side:

| GL | Name | Notes |
|---|---|---|
| 4090 | Gross Potential Rents | Posted by the CPA's monthly GPR entry |
| 4091 | Gain/Loss To Lease | "LTL" in emails |
| 4092 | Vacancy Loss | |
| 4098 | Delinquency | |
| 4099 | Concessions | Where forgiven or uncharged days go |
| 4111 | Rent Income | Tenant rent charges. Should clear to zero after the GPR post |
| 4112-4114 | GHVP, HAP, HUD Income | Subsidy income |
| 4700 | Prepaid Rental Income | |
| 2999 | Prepaid Rental Liability | Balance sheet |

Expense accounts where capital items have hidden:

| GL | Name |
|---|---|
| 5106 | Make Ready (most frequent) |
| 5129 | General Repairs |
| 5108 | Plumbing |
| 5101, 5103, 5107, 5111 | Carpet, HVAC Repair, Other Repairs, Windows |
| 5075 | Rental Preservation (check for sold properties) |
| 5060-5069 | Legal and professional (title and deed fees) |

Other accounts that came up: `5110 Supplies Expense`, `5706 Bonus` (payroll), `5803 Bonus`
(outside services), `5211 Preservation` and `5216 Rehab` (cost of goods sold, used for
fix-and-flip properties).

The capital / fixed-asset balance sheet accounts were not returned by Realm-X. Do not name a
destination GL. Say "capitalize" and let the CPA pick the account, as past emails did.

## Capitalize or expense

Anthony's actual calls in past closes:

| Item | His call | His stated reason |
|---|---|---|
| Rehab work on a unit (several bills, Vine Street) | Capitalize | "these are rehabs" |
| Flooring | Capitalize | |
| HVAC bill, 74 Woodrow | Capitalize | "it was a full replacement" |
| $5,800 plumbing bill, 842 Vine | Capitalize | size |
| General repairs bill | Capitalize | "substantial repairs" |
| Title and deed fees | Capitalize, spread evenly across the portfolio | cost of changing the title holder goes to basis |
| Preservation on sold properties in 5075 | Not capitalized. Move out of rental expenses | distorts rental operating expenses |

Working test, in this order:

1. **Replacement of a whole component** (roof, HVAC system, water heater, flooring, windows,
   sewer line, appliance package)? Lean capitalize.
2. **Part of a unit turn or rehab** (several trades on one unit in one month, vacant unit, the
   words rehab, renovation, remodel, full, replace, install, new)? Lean capitalize.
3. **Restores the unit to working order without extending its life** (unclog, patch, service
   call, cleaning, paint touch-up, pest)? Expense.
4. **Thin description** ("Repairs", "CHECK # 107", a vendor name alone)? Do not guess. Put it in
   "needs your eyes" and name the document that would settle it.

There is no written dollar threshold in the past emails. $750 is only the query floor used to
keep the list short. Do not present it as policy.

Reference point, for Anthony and the CPA to decide, not a rule this skill applies: the IRS
tangible property regulations (Treas. Reg. 1.263(a)-3) treat a cost as an improvement if it is a
betterment, a restoration, or an adaptation to a new use, and the de minimis safe harbor in
Treas. Reg. 1.263(a)-1(f) lets a taxpayer without an applicable financial statement expense
items up to $2,500 per invoice or item if elected. Book treatment can differ from tax treatment.

## GPR fixes

| Situation | Fix | Who |
|---|---|---|
| GPR posted to a sold property | Reverse the GPR for that property | CPA |
| Tenant was not charged for days they occupied, and should be | Add the charge on the tenant ledger (to 4111), then unpost and repost GPR for that unit | Lucia, then CPA |
| Days deliberately not charged (courtesy, special circumstance) | Treat as a concession. Journal entry out of 4091 Gain/LTL into 4099 Concessions | CPA |
| Charge was booked to 4111 but should be a concession | Edit the charge on the tenant ledger, then repost GPR | Lucia, then CPA |
| Fix would mean editing a completed move-out | Leave the ledger alone. Repost GPR, then journal the amount from 4091 to 4099 | CPA |

Order matters: **reverse GPR, edit the tenant ledger, repost GPR.** Ledger edits made while GPR
is posted do not flow through. Be explicit in the Notes column. In a past close the CPA wrote
back that they could not tell what a note was asking for, and a full round trip was lost.

## Email style

Anthony's review emails are short, numbered, and specific. Pattern:

```
Thanks for these Vito, here are some notes:

1. <Property / GL> - <what is wrong> - <what to do>. <link>
2. ...

Besides that I think we are good here, moving to GPR now.

Thank you,
Anthony Hidalgo
```

- One item per number, one instruction per item.
- For a capital item, a single line is enough: "This should be CapX: <link>" or "This is a rehab
  that needs to be capitalized: <link>".
- Questions are asked plainly: "Are we sure there's 0 in 5803 Bonus? I'm pretty sure we paid
  some out."
- Give the reason only when the treatment is not obvious.
- GPR revisions go as an attached spreadsheet with a Notes column, with a one-line email:
  "Please see attached for my GPR revisions."
- Do not write the signature block. Outlook adds it.

## AppFolio (Realm-X) query notes

Queries that returned usable data on 2026-11-19:

- Property directory with status and management end date.
- Chart of accounts by range.
- `For <Month YYYY>, list bills and payments of $750 or more coded to GL account <number name>.
  Include property, vendor, amount, date, description.` About 30 seconds for one account.
- `General ledger detail for GL account 4111 Rent Income for <dates>, accrual basis, all
  properties ... net ending balance per property and each transaction.` Returned charges only.
  Journal entries were not in the result, so ask for them by name.
- `Run the Gross Potential Rent Enhanced report for <Month YYYY> for all properties. Return every
  unit row ...` Returned 482 rows for October 2026, on cash basis.

Queries that timed out at 60 seconds: one call covering about 30 expense accounts for the month,
and a 4111 query asking for non-zero properties plus totals plus a zero count in one go. Split
them by account, by state, or by property group.

Unverified as of 2026-11-19: what a month's 4111 looks like after the GPR post. The October query
showed a full month of rent charges ($197,244.65 across 237 properties) and no offsetting
entries. Either October's GPR entry was not posted yet, or the journal entries were left out of
the result. Settle this first in Step 2.

## Lessons log

Add a dated line here after each close when Anthony corrects a call, so the next run starts
smarter. Record what the item was, what the skill said, and what Anthony decided.
