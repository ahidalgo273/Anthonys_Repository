import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests for the intake funnel.
 *
 * Runs against a production build on port 3210, so it never collides with a dev
 * server you have open on 3000. Playwright starts and stops the server itself.
 *
 * Stripe is deliberately NOT configured here: the funnel takes its demo
 * checkout path, which exercises exactly the same lead, application, and
 * account provisioning a real payment would.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : [["list"]],

  use: {
    baseURL: "http://localhost:3210",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Normally Playwright uses the browser it downloaded via
    // `npx playwright install`. Set PLAYWRIGHT_CHROMIUM_PATH to point at an
    // existing Chromium instead — useful in a container that already has one.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // Creates the test database first, so the suite works from a clean
    // checkout with no manual setup.
    command: "npx prisma migrate deploy && npm run build && npx next start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // A separate database file, so a test run never touches your real data.
      // Prisma resolves this relative to prisma/, giving prisma/e2e.db.
      DATABASE_URL: "file:./e2e.db",
      EMAIL_DRIVER: "console",
    },
  },
});
