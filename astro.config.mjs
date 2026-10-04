// The public site. Static output only: no adapter, no server. See docs/decisions/0001 and 0002.
import { defineConfig } from "astro/config"
import browserslist from "browserslist"
import { browserslistToTargets } from "lightningcss"

// The browser floor: Baseline "widely available". Lightning CSS lowers newer syntax
// (nesting, light-dark(), oklch()) for anything inside that floor.
const targets = browserslistToTargets(browserslist("baseline widely available"))

export default defineConfig({
  srcDir: "./site/src",
  publicDir: "./site/public",
  outDir: "./dist/site",
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "never" },
  devToolbar: { enabled: false },
  vite: {
    css: { transformer: "lightningcss", lightningcss: { targets } },
    build: { cssMinify: "lightningcss" },
  },
})
