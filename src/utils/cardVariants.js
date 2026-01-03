/**
 * Card Variant System
 *
 * Provides deterministic but varied card appearances based on competitor ID.
 * Uses 16 palette families from Figma designs.
 */

// 16 Palette families from Figma - each has 5 colors
// Format: [color1, color2, color3, color4, color5]
export const PALETTE_FAMILIES = [
  // PALETTE 01: Hot pink, navy, cyan, mint, coral
  ['#fa1078', '#030625', '#00c4d7', '#00f2c9', '#f9683f'],
  // PALETTE 02: Slate blue, cream, gold, burnt orange, maroon
  ['#6489a4', '#f3efe0', '#f6c551', '#e0602a', '#5d0205'],
  // PALETTE 03: Hot pink, navy, lime yellow, gold, coral
  ['#fa1078', '#030625', '#ebf244', '#f6cc3c', '#f9683f'],
  // PALETTE 04: Navy, cream, gold, maroon, dark maroon
  ['#0b2357', '#f3efe0', '#f6c551', '#5d0205', '#430103'],
  // PALETTE 05: Rose, lavender, navy, pale gold, salmon
  ['#f96389', '#b882d5', '#030625', '#f5d076', '#f9716a'],
  // PALETTE 06: Crimson, hot pink, silver, royal blue, peach
  ['#e0335f', '#fa4282', '#bfbfbf', '#005dbb', '#f7a757'],
  // PALETTE 07: Rose, lavender, navy, teal, pale gold
  ['#f96389', '#b882d5', '#030625', '#57bfb6', '#f5d076'],
  // PALETTE 08: Crimson, hot pink, silver, royal blue, peach (same as 06)
  ['#e0335f', '#fa4282', '#bfbfbf', '#005dbb', '#f7a757'],
  // PALETTE 09: Rose, navy, teal, pale gold, light gray
  ['#f96389', '#030625', '#57bfb6', '#f5d076', '#d8d9d7'],
  // PALETTE 10: Hot pink, charcoal, slate blue, sage, taupe
  ['#fa4282', '#3c3c40', '#2d5089', '#628c6d', '#8d837c'],
  // PALETTE 11: Rose, navy, teal, pale gold, off-white
  ['#f96389', '#030625', '#57bfb6', '#f5d076', '#f2f2f2'],
  // PALETTE 12: Pink, aubergine, aqua, yellow, off-white
  ['#f877af', '#231425', '#6dd9d9', '#f6cb3a', '#f2f2f2'],
  // PALETTE 13: Red, slate blue, cyan, sage, red
  ['#e03d4d', '#425d8a', '#00b2d6', '#93a699', '#e03d41'],
  // PALETTE 14: Bright red, plum, charcoal, emerald, tan
  ['#fa0938', '#8f4686', '#3a4c58', '#09a672', '#a9866d'],
  // PALETTE 15: Red, dark gray, slate blue, light gray, red
  ['#e03d4d', '#2e313f', '#425d8a', '#d8d9d7', '#e03d41'],
  // PALETTE 16: Red, slate blue, sage, light gray, red
  ['#e03d4d', '#425d8a', '#96a69d', '#d8d9d7', '#e03d41'],
]

/**
 * Determine if a color is light (for text contrast)
 */
export function isLightColor(hex) {
  if (!hex || typeof hex !== 'string') return false // Fallback: assume dark
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

/**
 * Get a color scheme from a palette family
 * Intelligently picks colors for different card elements
 */
function getPaletteColors(paletteIndex, hash) {
  const palette = PALETTE_FAMILIES[paletteIndex]

  // Use hash to pick which color is primary (card background)
  const primaryIndex = hash % 5
  const primary = palette[primaryIndex]

  // Find a contrasting color for sticker from remaining colors
  const otherColors = palette.filter((_, i) => i !== primaryIndex)
  const stickerIndex = (hash >> 3) % otherColors.length
  const stickerPrimary = otherColors[stickerIndex]

  // Pick another color for secondary/border (darker feel)
  const remainingColors = otherColors.filter((_, i) => i !== stickerIndex)
  const secondaryIndex = (hash >> 6) % remainingColors.length
  const secondary = remainingColors[secondaryIndex] || primary

  // Text color based on primary brightness
  const text = isLightColor(primary) ? '#000000' : '#ffffff'

  // Text color for sticker based on sticker background brightness
  const stickerText = isLightColor(stickerPrimary) ? '#000000' : '#ffffff'

  return {
    primary,
    secondary,
    border: primary,
    text,
    nameBackground: primary,
    stickerPrimary,
    stickerSecondary: isLightColor(stickerPrimary) ? '#000000' : stickerPrimary,
    stickerText,
  }
}

// Frame shapes for photos
export const FRAME_SHAPES = {
  rectangle: 'frame-rectangle',
  rounded: 'frame-rounded',
  inset: 'frame-inset',
  parallelogram: 'frame-parallelogram', // For use with parallelogram labels
}

// Name label positions
export const NAME_POSITIONS = {
  'top-left': 'name-top-left',
  'top-center': 'name-top-center',
  'bottom-left': 'name-bottom-left',
}

// Border styles
export const BORDER_STYLES = {
  solid: 'border-solid',
  double: 'border-double',
  gradient: 'border-gradient',
  none: 'border-none',
}

// Badge styles
export const BADGE_STYLES = {
  medal: 'badge-medal',
  circle: 'badge-circle',
  square: 'badge-square',
}

// Font styles for names (CSS class names)
export const FONT_STYLES = {
  display: 'font-display',
  script: 'font-script',
  bold: 'font-bold-sans',
  retro: 'font-retro',
}

// Font family strings for label components
export const FONT_FAMILIES = {
  display: "'Caprasimo', Georgia, serif",
  script: "'Playball', cursive",
  bold: "'Bowlby One', sans-serif",
  retro: "'Old Standard TT', serif",
}

// Label styles for name/time labels
export const LABEL_STYLES = {
  'parallelogram-pop': 'parallelogram-pop',
  'ribbon-pop': 'ribbon-pop',
  'hotdog': 'hotdog',
}

// Border color options with distribution: 60% white, 20% black, 20% transparent
// Using 10 slots: 6 white, 2 black, 2 transparent
export const BORDER_COLORS = [
  '#ffffff', // white (slot 0)
  '#ffffff', // white (slot 1)
  '#ffffff', // white (slot 2)
  '#ffffff', // white (slot 3)
  '#ffffff', // white (slot 4)
  '#ffffff', // white (slot 5)
  '#000000', // black (slot 6)
  '#000000', // black (slot 7)
  'transparent', // transparent (slot 8)
  'transparent', // transparent (slot 9)
]

// Pattern overlay SVGs - 60% of cards get a pattern, 40% get none
// Using 10 slots: 6 patterns (indices 0-5 pick from array), 4 null slots
export const CARD_PATTERNS = [
  '/pattern-swirly.svg',
  '/pattern-swrily-line-shapes.svg',
  '/pattern-swrily-line-shapes-2.svg',
  '/pattern-swrily-line-shapes-3.svg',
  '/pattern-sponge.svg',
  '/pattern-lavalamp.svg',
  '/pattern-dots.svg',
  '/pattern-long-swirls.svg',
  '/pattern-golf-links.svg',
  '/pattern-cheetah.svg',
  '/pattern-sprinkles.svg',
]

// Style options arrays for random selection
const frameShapeOptions = Object.keys(FRAME_SHAPES)
const namePositionOptions = Object.keys(NAME_POSITIONS)
const borderStyleOptions = Object.keys(BORDER_STYLES)
const badgeStyleOptions = Object.keys(BADGE_STYLES)
const fontStyleOptions = Object.keys(FONT_STYLES)
const labelStyleOptions = Object.keys(LABEL_STYLES)

/**
 * Simple string hash function for deterministic randomness
 */
export function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Get the card effect for a given ID
 * Returns: 'holo', 'radiant', 'rainbow', 'glare', 'foil', 'worn', or 'plain'
 */
export function getCardEffect(id) {
  const hash = hashString(String(id))

  // 7 styled : 3 plain = 10 total slots
  const slot = hash % 10
  if (slot >= 7) return 'plain'

  // New holofoil effects + classic effects
  // Holofoil effects are rarer (3/7 chance among styled)
  // Classic effects are more common (4/7 chance among styled)
  const effects = ['holo', 'radiant', 'rainbow', 'glare', 'foil', 'worn', 'glare']
  return effects[hash % effects.length]
}

/**
 * Get the card pattern for a given ID
 * Returns: pattern URL string (100% of cards get a pattern)
 */
export function getCardPattern(id) {
  const hash = hashString(`${id}-pattern`)
  const patternIndex = hash % CARD_PATTERNS.length
  return CARD_PATTERNS[patternIndex]
}

/**
 * Get the CSS class for a card effect
 */
export function getCardEffectClass(effect) {
  if (effect === 'plain') return ''
  return `card-effect-${effect}`
}

/**
 * Get the glare direction for a card (for glare effect cards)
 * Returns: 'tl-br' (top-left to bottom-right) or 'tr-bl' (top-right to bottom-left)
 */
export function getGlareDirection(id) {
  const hash = hashString(`${id}-glare`)
  return hash % 2 === 0 ? 'tl-br' : 'tr-bl'
}

/**
 * Get a deterministic theme for a competitor based on their ID
 * @param {string|number} competitorId - Unique identifier for the competitor
 * @param {object} overrides - Optional overrides for specific properties
 * @returns {object} Complete theme configuration
 */
export function getCardVariant(competitorId, overrides = {}) {
  const id = String(competitorId)
  const hash = hashString(id)

  // Pick palette family
  const paletteIndex = hash % PALETTE_FAMILIES.length

  // Pick style options deterministically
  const frameShape = frameShapeOptions[(hash >> 4) % frameShapeOptions.length]
  const namePosition = namePositionOptions[(hash >> 8) % namePositionOptions.length]
  const borderStyle = borderStyleOptions[(hash >> 12) % borderStyleOptions.length]
  const badgeStyle = badgeStyleOptions[(hash >> 16) % badgeStyleOptions.length]
  const fontStyle = fontStyleOptions[(hash >> 20) % fontStyleOptions.length]
  const labelStyle = labelStyleOptions[(hash >> 28) % labelStyleOptions.length]

  // Pick border color (60% white, 20% black, 20% transparent)
  const borderColor = BORDER_COLORS[(hash >> 24) % BORDER_COLORS.length]

  // Get colors from palette
  const colors = getPaletteColors(paletteIndex, hash)

  return {
    paletteIndex,
    frameShape: overrides.frameShape || frameShape,
    namePosition: overrides.namePosition || namePosition,
    borderStyle: overrides.borderStyle || borderStyle,
    badgeStyle: overrides.badgeStyle || badgeStyle,
    fontStyle: overrides.fontStyle || fontStyle,
    labelStyle: overrides.labelStyle || labelStyle,
    borderColor: overrides.borderColor || borderColor,
    colors: overrides.colors || colors,
  }
}

/**
 * Get CSS class names for a variant
 */
export function getVariantClasses(variant) {
  return [
    FRAME_SHAPES[variant.frameShape],
    NAME_POSITIONS[variant.namePosition],
    BORDER_STYLES[variant.borderStyle],
    BADGE_STYLES[variant.badgeStyle],
    FONT_STYLES[variant.fontStyle],
  ].filter(Boolean).join(' ')
}

/**
 * Get inline styles for a variant (for dynamic colors)
 */
export function getVariantStyles(variant) {
  const colors = variant.colors
  return {
    '--card-primary': colors.primary,
    '--card-secondary': colors.secondary,
    '--card-border': colors.border,
    '--card-text': colors.text,
    '--card-name-bg': colors.nameBackground,
    '--sticker-primary': colors.stickerPrimary,
    '--sticker-secondary': colors.stickerSecondary,
    '--sticker-text': colors.stickerText,
    '--card-border-color': variant.borderColor,
  }
}
