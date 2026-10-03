// The public site. Static output only: no adapter, no server. See docs/decisions/0001-site-stack.md.
import { defineConfig } from "astro/config"

export default defineConfig({
  srcDir: "./site/src",
  publicDir: "./site/public",
  outDir: "./dist/site",
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  // The preview is not indexed; production decides this when it goes public.
  devToolbar: { enabled: false },
})
