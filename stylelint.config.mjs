/**
 * CSS stays inside Baseline "widely available" unless a feature is a deliberate
 * progressive enhancement, listed here with what happens without it.
 */
export default {
  plugins: ["stylelint-plugin-use-baseline"],
  rules: {
    "plugin/use-baseline": [
      true,
      {
        available: "widely",
        // Lowered by Lightning CSS for older browsers, so safe everywhere.
        ignoreFunctions: ["light-dark", "oklch", "color-mix"],
        // Without them: no page transition, plain line breaks, popovers centred instead of anchored.
        ignoreAtRules: ["view-transition"],
        ignoreProperties: {
          "text-wrap": ["balance", "pretty"],
          "anchor-name": ["/^.+$/"],
          "position-anchor": ["/^.+$/"],
          "view-transition-name": ["/^.+$/"],
          "font-synthesis-weight": ["/^.+$/"],
          "translate": ["/^.+$/"],
        },
        ignoreSelectors: ["view-transition-group", "selection"],
      },
    ],
  },
}
