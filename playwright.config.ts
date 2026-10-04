import { existsSync } from "node:fs"
import { defineConfig, devices } from "@playwright/test"

/**
 * Tests run against the real static build (dist/site), served by `astro preview`.
 * This environment ships Chromium under /opt/pw-browsers; elsewhere (CI)
 * Playwright uses its own browser.
 */
const PREINSTALLED = "/opt/pw-browsers/chromium"
const launchOptions = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : undefined

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4321" },
  snapshotPathTemplate: "tests/screenshots/{projectName}/{arg}{ext}",
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "phone", use: { ...devices["Pixel 7"], launchOptions } },
  ],
  webServer: {
    command: "npx astro preview --host 127.0.0.1 --port 4321 --ignore-lock",
    url: "http://127.0.0.1:4321/nl/",
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
