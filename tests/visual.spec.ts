/**
 * Visual regression: one screenshot per page template, both themes, desktop and phone.
 * Runs only with VISUAL=1 (CI), because screenshots depend on the exact browser build.
 * Baselines are made in CI by the "Update screenshots" workflow and committed from there.
 */
import { expect, test } from "@playwright/test"

test.skip(!process.env.VISUAL, "visual regression runs in CI only (VISUAL=1)")

const templates = { home: "/nl/", entry: "/nl/e/soil-food-web/", problem: "/nl/e/compacted-soil/", sources: "/en/sources/", contribute: "/en/contribute/" }
for (const scheme of ["light", "dark"] as const) {
  for (const [name, path] of Object.entries(templates)) {
    test(`${name} looks the same (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" })
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      await expect(page).toHaveScreenshot(`${name}-${scheme}.png`, { fullPage: true, maxDiffPixelRatio: 0.01 })
    })
  }
}
