/**
 * Color Utility Functions
 *
 * Helpers for color manipulation - darken, lighten, complementary, etc.
 */

/**
 * Convert RGB array to hex string
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Convert hex string to RGB array
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return [h * 360, s * 100, l * 100]
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * Darken a color by a percentage
 */
export function darken(rgb, percent) {
  const [h, s, l] = rgbToHsl(...rgb)
  const newL = Math.max(0, l - percent)
  return hslToRgb(h, s, newL)
}

/**
 * Lighten a color by a percentage
 */
export function lighten(rgb, percent) {
  const [h, s, l] = rgbToHsl(...rgb)
  const newL = Math.min(100, l + percent)
  return hslToRgb(h, s, newL)
}

/**
 * Get complementary color (opposite on color wheel)
 */
export function getComplementary(rgb) {
  const [h, s, l] = rgbToHsl(...rgb)
  const newH = (h + 180) % 360
  return hslToRgb(newH, s, l)
}

/**
 * Get triadic colors (120 degrees apart)
 */
export function getTriadic(rgb) {
  const [h, s, l] = rgbToHsl(...rgb)
  return [
    hslToRgb((h + 120) % 360, s, l),
    hslToRgb((h + 240) % 360, s, l)
  ]
}

/**
 * Adjust saturation
 */
export function saturate(rgb, percent) {
  const [h, s, l] = rgbToHsl(...rgb)
  const newS = Math.min(100, Math.max(0, s + percent))
  return hslToRgb(h, newS, l)
}

/**
 * Check if a color is light or dark
 */
export function isLight(rgb) {
  const [r, g, b] = rgb
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

/**
 * Generate a full color palette from a single dominant color
 */
export function generatePalette(dominantRgb) {
  const primary = dominantRgb
  const secondary = darken(primary, 15)
  const complementary = getComplementary(primary)
  const stickerPrimary = saturate(complementary, 10)
  const stickerSecondary = darken(stickerPrimary, 15)

  return {
    primary: rgbToHex(...primary),
    secondary: rgbToHex(...secondary),
    border: rgbToHex(...primary),
    nameBackground: rgbToHex(...primary),
    stickerPrimary: rgbToHex(...stickerPrimary),
    stickerSecondary: rgbToHex(...stickerSecondary),
    // Text should be white on dark colors, black on light
    text: isLight(primary) ? '#000000' : '#ffffff',
  }
}
