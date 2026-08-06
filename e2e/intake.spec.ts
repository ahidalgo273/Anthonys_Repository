import { expect, test } from "@playwright/test";

/**
 * The intake funnel, end to end.
 *
 * Covers the happy path a paying customer takes, plus the two behaviors that
 * must never regress: the attorney-referral route and the disclaimer gate at
 * checkout.
 */

/** Unique per run, so repeated runs do not collide on email. */
const stamp = () => `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

async function completeContactStep(page: import("@playwright/test").Page, email: string) {
  await page.goto("/intake");
  await expect(page.getByRole("heading", { name: /start your application/i })).toBeVisible();

  await page.getByLabel("Your name").fill("Playwright Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page).toHaveURL(/step=state/);
}

test.describe("intake funnel", () => {
  test("walks a Georgia applicant from contact to demo checkout", async ({ page }) => {
    const email = `happy-${stamp()}@example.com`;

    // ── Step 1: contact ──────────────────────────────────────────────────────
    await completeContactStep(page, email);

    // ── Step 2: state ────────────────────────────────────────────────────────
    await page.getByRole("radio", { name: /Georgia/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/step=goal/);

    // ── Step 3: goal ─────────────────────────────────────────────────────────
    await page.getByRole("radio", { name: /Dealer auction access/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/step=timeline/);

    // ── Step 4: timeline ─────────────────────────────────────────────────────
    await page.getByRole("radio", { name: /As soon as possible/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/step=screening/);

    // ── Step 5: screening (clean answers) ────────────────────────────────────
    await page.getByRole("radio", { name: "Yes" }).first().check(); // age 18+
    await page.getByRole("radio", { name: /already have an LLC/i }).check();
    await page.getByRole("radio", { name: /Yes, or I expect to qualify/i }).check();
    await page.getByLabel(/Which state do you live in/i).fill("GA");
    // Criminal history — answer No.
    await page
      .getByRole("group")
      .filter({ hasText: /criminal history/i })
      .getByRole("radio", { name: "No" })
      .check();
    await page.getByRole("radio", { name: /already have a qualifying office/i }).check();
    await page.getByRole("radio", { name: /Yes, completed/i }).check();

    await page.getByRole("button", { name: /see my results/i }).click();
    await expect(page).toHaveURL(/step=package/);

    // Screening verdict is shown before any money changes hands.
    await expect(page.getByText(/Nothing is stopping you/i)).toBeVisible();

    // ── Step 6: package + disclaimer gate ────────────────────────────────────
    // The full price string, so this does not also match the assistant's
    // suggested question about the $795 package.
    await expect(page.getByText("$795 one-time")).toBeVisible();
    await page.getByRole("radio", { name: /License Filing Package/i }).check();

    await page.getByRole("checkbox", { name: /not a law firm/i }).check();
    await page.getByRole("button", { name: /continue to checkout/i }).click();

    // ── Demo checkout completes and provisions the account ───────────────────
    await expect(page).toHaveURL(/intake\/complete/);
    await expect(page.getByText(/Demo checkout/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /you're all set/i })).toBeVisible();
    await expect(page.getByText(/Start these Georgia items today/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to my portal/i })).toBeVisible();
  });

  // ── LEGAL GUARDRAIL ────────────────────────────────────────────────────────
  test("routes a criminal-history yes to an attorney referral without blocking", async ({
    page,
  }) => {
    const email = `referral-${stamp()}@example.com`;

    await completeContactStep(page, email);

    await page.getByRole("radio", { name: /Georgia/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByRole("radio", { name: /Dealer auction access/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByRole("radio", { name: /As soon as possible/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByRole("radio", { name: "Yes" }).first().check();
    await page.getByRole("radio", { name: /already have an LLC/i }).check();
    await page.getByRole("radio", { name: /Yes, or I expect to qualify/i }).check();
    await page.getByLabel(/Which state do you live in/i).fill("GA");

    // The answer that triggers the referral.
    await page
      .getByRole("group")
      .filter({ hasText: /criminal history/i })
      .getByRole("radio", { name: "Yes" })
      .check();

    await page.getByRole("radio", { name: /already have a qualifying office/i }).check();
    await page.getByRole("radio", { name: /Yes, completed/i }).check();
    await page.getByRole("button", { name: /see my results/i }).click();

    await expect(page).toHaveURL(/step=package/);

    // Referral offered, and it never evaluates the applicant.
    await expect(page.getByText(/attorney referral/i).first()).toBeVisible();
    await expect(page.getByText(/disqualif/i)).toHaveCount(0);

    // Critically: they are NOT blocked from proceeding.
    await expect(page.getByRole("button", { name: /continue to checkout/i })).toBeEnabled();
  });

  test("will not check out without the not-a-law-firm acknowledgment", async ({ page }) => {
    const email = `gate-${stamp()}@example.com`;

    await completeContactStep(page, email);
    await page.getByRole("radio", { name: /Georgia/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("radio", { name: /Dealer auction access/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("radio", { name: /As soon as possible/i }).check();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.getByRole("radio", { name: "Yes" }).first().check();
    await page.getByRole("radio", { name: /already have an LLC/i }).check();
    await page.getByRole("radio", { name: /Yes, or I expect to qualify/i }).check();
    await page.getByLabel(/Which state do you live in/i).fill("GA");
    await page
      .getByRole("group")
      .filter({ hasText: /criminal history/i })
      .getByRole("radio", { name: "No" })
      .check();
    await page.getByRole("radio", { name: /already have a qualifying office/i }).check();
    await page.getByRole("radio", { name: /Yes, completed/i }).check();
    await page.getByRole("button", { name: /see my results/i }).click();

    await page.getByRole("radio", { name: /License Filing Package/i }).check();
    // Deliberately leave the acknowledgment unchecked.
    await page.getByRole("button", { name: /continue to checkout/i }).click();

    // The browser blocks the submit on the required checkbox — we stay put.
    await expect(page).toHaveURL(/step=package/);
    await expect(page.getByRole("checkbox", { name: /not a law firm/i })).not.toBeChecked();
  });
});

test.describe("public site", () => {
  test("shows the disclaimer on every key page", async ({ page }) => {
    for (const path of ["/", "/pricing", "/suites", "/states/georgia", "/faq", "/contact"]) {
      await page.goto(path);
      await expect(
        page.getByTestId("legal-disclaimer").first(),
        `${path} must carry the disclaimer`,
      ).toBeVisible();
    }
  });

  test("states plainly that a Florida wholesale license has no dealer plates", async ({ page }) => {
    await page.goto("/states/florida");
    await expect(page.getByText(/does not come with dealer plates/i).first()).toBeVisible();
    await expect(page.getByText(/\$25,000/).first()).toBeVisible();
  });

  test("publishes prices without asking for contact details", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("$795").first()).toBeVisible();
    await expect(page.getByText("$59").first()).toBeVisible();
    await expect(page.getByText("$549").first()).toBeVisible();
  });

  test("keeps the portal behind sign-in", async ({ page }) => {
    await page.goto("/portal");
    await expect(page).toHaveURL(/signin/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("keeps the admin area behind sign-in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/signin/);
  });
});
