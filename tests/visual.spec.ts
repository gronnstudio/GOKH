/**
 * Visual regression: one screenshot per page template, both themes, desktop and phone.
 * Runs only with VISUAL=1 (CI), because screenshots depend on the exact browser build.
 * A template without a committed baseline is skipped, not failed: the "Update screenshots"
 * workflow (UPDATE_SCREENSHOTS=1) takes the baselines in CI's browser and opens a PR with them.
 */
import { existsSync } from "node:fs"
import { expect, test } from "@playwright/test"

test.skip(!process.env.VISUAL, "visual regression runs in CI only (VISUAL=1)")

const templates = { home: "/nl/", entry: "/nl/e/soil-food-web/", problem: "/nl/e/compacted-soil/", sources: "/en/sources/", contribute: "/en/contribute/" }
for (const scheme of ["light", "dark"] as const) {
  for (const [name, path] of Object.entries(templates)) {
    test(`${name} looks the same (${scheme})`, async ({ page }, info) => {
      const file = `${name}-${scheme}.png`
      test.skip(!process.env.UPDATE_SCREENSHOTS && !existsSync(info.snapshotPath(file)), "no baseline yet: run Actions → Update screenshots")
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" })
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      await expect(page).toHaveScreenshot(file, { fullPage: true, maxDiffPixelRatio: 0.01 })
    })
  }
}
