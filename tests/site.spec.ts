/**
 * Every page, desktop and phone: it loads, it has one h1,
 * nothing scrolls sideways, and axe finds no WCAG 2.2 A/AA violation.
 */
import { readdirSync } from "node:fs"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const ids = readdirSync("content/entries").filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""))
// Dutch only for now (owner, 4 Oct 2026); add a language here when the site publishes it.
const pages = ["nl"].flatMap((lang) => [`/${lang}/`, `/${lang}/sources/`, `/${lang}/contribute/`, ...ids.map((id) => `/${lang}/e/${id}/`)])

for (const path of pages) {
  test(`${path} is accessible`, async ({ page }) => {
    const res = await page.goto(path)
    expect(res?.status()).toBe(200)
    await expect(page.locator("h1")).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
}

test("the root sends visitors to Dutch", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/nl\/$/)
})

test("the site is Dutch only for now: no English pages, no language switch", async ({ page }) => {
  await page.goto("/nl/e/soil-food-web/")
  await expect(page.locator("html")).toHaveAttribute("lang", "nl")
  await expect(page.locator("[data-lang-switch]")).toHaveCount(0)
  const res = await page.goto("/en/")
  expect(res?.status()).toBe(404)
})

test("an entry reads in Dutch", async ({ page }) => {
  await page.goto("/nl/e/soil-food-web/")
  await expect(page.locator(".note")).toHaveCount(0)
  await expect(page.locator(".prose")).not.toHaveAttribute("lang", "en")
})

test("search finds an entry from the home page", async ({ page }) => {
  await page.goto("/nl/")
  await page.locator(".search-hero").click()
  const input = page.getByRole("combobox")
  await expect(input).toBeFocused()
  await input.fill("myco")
  await expect(page.getByRole("option").first()).toContainText("Mycorrhiza")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/nl\/e\/mycorrhizal-networks\/$/)
})

test.describe("dark (Blauwe Uur)", () => {
  test.use({ colorScheme: "dark" })
  for (const path of ["/nl/", "/nl/sources/", "/nl/e/soil-food-web/", "/nl/e/compacted-soil/"]) {
    test(`${path} keeps contrast in dark`, async ({ page }) => {
      await page.goto(path)
      const axe = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze()
      expect(axe.violations.map((v) => v.id)).toEqual([])
    })
  }
})

test("the theme switch cycles and survives a reload without a flash", async ({ page }) => {
  await page.goto("/nl/")
  const html = page.locator("html")
  await expect(html).not.toHaveAttribute("data-theme")
  await page.locator("[data-theme-toggle]").click()
  await expect(html).toHaveAttribute("data-theme", "light")
  await page.locator("[data-theme-toggle]").click()
  await expect(html).toHaveAttribute("data-theme", "dark")
  await expect(page.locator("[data-theme-toggle]")).toHaveAttribute("aria-label", "Thema: donker")
  // The theme is set by a script in <head>, before the body exists.
  await page.goto("/nl/sources/", { waitUntil: "commit" })
  await page.waitForSelector("html[data-theme]", { state: "attached" })
  await expect(html).toHaveAttribute("data-theme", "dark")
})

test("a grade explains itself in a popover", async ({ page }) => {
  await page.goto("/nl/e/soil-food-web/")
  const grade = page.locator("button.grade").first()
  await grade.click()
  const pop = page.locator(".pop:popover-open")
  await expect(pop).toBeVisible()
  await expect(pop).toContainText("Hoe zeker zijn we?")
  await page.keyboard.press("Escape")
  await expect(pop).toHaveCount(0)
})

test("search opens from the keyboard on any page, ranks, and remembers", async ({ page }) => {
  await page.goto("/nl/sources/")
  await page.keyboard.press("Control+k")
  const input = page.getByRole("combobox")
  await expect(input).toBeFocused()
  await input.fill("water")
  // A title that starts with the query beats one that only contains it.
  await expect(page.getByRole("option").first()).toContainText("Water blijft staan")
  await expect(page.getByRole("option").nth(1)).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true")
  // Full text from inside the entries joins after the titles.
  await input.fill("actinobacteriën")
  await expect(page.locator("#palette-list .pal-kind", { hasText: "In de tekst" }).first()).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/e\//)
  // The pick is remembered on this device.
  await page.keyboard.press("Control+k")
  await expect(page.locator("#palette-list .pal-kind").first()).toHaveText("Recent")
})

test("single-key shortcuts navigate, and can be switched off", async ({ page }) => {
  await page.goto("/nl/")
  await page.keyboard.press("g")
  await page.keyboard.press("s")
  await expect(page).toHaveURL(/\/nl\/sources\/$/)
  await page.keyboard.press("?")
  const sheet = page.getByRole("dialog", { name: "Sneltoetsen" })
  await expect(sheet).toBeVisible()
  await sheet.getByRole("checkbox").uncheck()
  await page.keyboard.press("Escape")
  await page.keyboard.press("g")
  await page.keyboard.press("c")
  await expect(page).toHaveURL(/\/nl\/sources\/$/)
  // Ctrl/Cmd K holds a modifier, so it keeps working.
  await page.keyboard.press("Control+k")
  await expect(page.getByRole("combobox")).toBeFocused()
})

test("j and k walk the cards", async ({ page }) => {
  await page.goto("/nl/")
  await page.keyboard.press("j")
  await expect(page.locator("main [data-walk]").first()).toBeFocused()
  await page.keyboard.press("j")
  await expect(page.locator("main [data-walk]").nth(1)).toBeFocused()
  await page.keyboard.press("k")
  await expect(page.locator("main [data-walk]").first()).toBeFocused()
})

test("a card and its entry share a view-transition name", async ({ page }) => {
  await page.goto("/nl/")
  const card = page.locator(".card-title").first()
  const name = await card.evaluate((el) => getComputedStyle(el).viewTransitionName)
  expect(name).toMatch(/^entry-/)
  await card.click()
  expect(await page.locator("h1").evaluate((el) => getComputedStyle(el).viewTransitionName)).toBe(name)
})

test("speculation rules are valid JSON", async ({ page }) => {
  await page.goto("/nl/")
  const rules = await page.locator('script[type="speculationrules"]').textContent()
  expect(JSON.parse(rules!).prerender[0].eagerness).toBe("moderate")
})

test("the domains menu opens and takes you to a domain", async ({ page, isMobile }) => {
  test.skip(isMobile, "on phones the domains live in the menu sheet")
  await page.goto("/nl/sources/")
  await page.getByRole("button", { name: "Domeinen" }).click()
  const panel = page.locator("#domains-menu")
  await expect(panel).toBeVisible()
  await panel.getByRole("link", { name: /Water/ }).click()
  await expect(page).toHaveURL(/\/nl\/#water$/)
})

test("on a phone the menu button opens a full menu", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button shows on narrow screens")
  await page.goto("/nl/")
  await page.getByRole("button", { name: "Menu" }).click()
  const sheet = page.locator("#site-menu")
  await expect(sheet).toBeVisible()
  await sheet.getByRole("link", { name: "Bronnen" }).click()
  await expect(page).toHaveURL(/\/nl\/sources\/$/)
})
