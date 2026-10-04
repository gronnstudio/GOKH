/** sRGB ↔ OKLCH and WCAG contrast, small enough to need no dependency. */
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}

export function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(A, B)
  const H = C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return [round(L, 4), round(C, 4), round(H, 2)]
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d

/** OKLCH → sRGB hex, with chroma reduced until the colour fits in sRGB. */
export function oklchToHex([L, C, H]: [number, number, number]): string {
  for (let c = C; c >= 0; c -= 0.002) {
    const rgb = oklchToRgb(L, c, H)
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4))
      return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")
  }
  return "#000000"
}

function oklchToRgb(L: number, C: number, H: number): number[] {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.sign(v) * Math.abs(v) ** (1 / 2.4) - 0.055))
}
