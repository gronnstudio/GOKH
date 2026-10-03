/**
 * Every page, both languages, desktop and phone: it loads, it has one h1,
 * nothing scrolls sideways, and axe finds no WCAG 2.2 A/AA violation.
 */
import { readdirSync } from "node:fs"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const ids = readdirSync("content/entries").filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""))
const pages = ["nl", "en"].flatMap((lang) => [`/${lang}/`, `/${lang}/sources/`, `/${lang}/contribute/`, ...ids.map((id) => `/${lang}/e/${id}/`)])

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

test("the language switch keeps the page", async ({ page }) => {
  await page.goto("/nl/e/soil-food-web/")
  await page.getByRole("link", { name: "English" }).click()
  await expect(page).toHaveURL(/\/en\/e\/soil-food-web\/$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

test("an untranslated body says so and is marked English", async ({ page }) => {
  await page.goto("/nl/e/soil-food-web/")
  await expect(page.locator(".note")).toBeVisible()
  await expect(page.locator(".prose")).toHaveAttribute("lang", "en")
})

test("search finds an entry", async ({ page }) => {
  await page.goto("/en/")
  const input = page.locator("pagefind-searchbox input")
  await input.fill("mycorrhiza")
  await expect(page.locator("pagefind-searchbox").getByRole("option").first()).toBeVisible()
})

test.describe("dark (Blauwe Uur)", () => {
  test.use({ colorScheme: "dark" })
  for (const path of ["/nl/", "/en/sources/", "/nl/e/soil-food-web/", "/en/e/compacted-soil/"]) {
    test(`${path} keeps contrast in dark`, async ({ page }) => {
      await page.goto(path)
      const axe = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze()
      expect(axe.violations.map((v) => v.id)).toEqual([])
    })
  }
})
