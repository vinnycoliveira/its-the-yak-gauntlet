/**
 * Simple hash function to create deterministic randomness from a string seed
 */
function hashSeed(seed) {
  let hash = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get the position sticker variant based on rank
 * @param {number} rank - The competitor's rank (1, 2, 3, etc.)
 * @param {string} seed - A unique identifier for deterministic randomization
 * @returns {string} - The sticker variant: 'gold', 'silver', 'bronze', 'circle', 'diamond', or 'baseball'
 */
export function getPositionVariant(rank, seed) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'

  // For ranks 4+, use seeded randomization
  const variants = ['circle', 'diamond', 'baseball']
  const hash = hashSeed(seed)
  return variants[hash % variants.length]
}

/**
 * Get positions for asterisk stickers scattered around the card
 * @param {string[]} asterisks - Array of asterisk strings
 * @param {string} seed - A unique identifier for deterministic randomization
 * @returns {Array<{asterisk: string, x: number, y: number, rotation: number}>}
 */
export function getAsteriskPositions(asterisks, seed) {
  if (!asterisks || asterisks.length === 0) return []

  // Predefined positions around the card edges (as percentages)
  const positions = [
    { x: 5, y: 40, rotation: -10 },    // left side
    { x: 5, y: 55, rotation: 5 },      // left side lower
    { x: 85, y: 25, rotation: 8 },     // right side upper
    { x: 85, y: 40, rotation: -5 },    // right side middle
    { x: 30, y: 85, rotation: -8 },    // bottom left
    { x: 50, y: 85, rotation: 3 },     // bottom center
  ]

  const hash = hashSeed(seed)

  return asterisks.slice(0, positions.length).map((asterisk, index) => {
    // Add some variation based on seed
    const variation = (hash + index * 17) % 10 - 5
    return {
      asterisk,
      x: positions[index].x + variation,
      y: positions[index].y + (variation / 2),
      rotation: positions[index].rotation + variation,
    }
  })
}

/**
 * Get a random rotation between -5 and +5 degrees based on seed
 * @param {string} seed - A unique identifier for deterministic randomization
 * @param {string} salt - Optional salt to differentiate between stickers on same card
 * @returns {number} - Rotation in degrees between -5 and 5
 */
export function getStickerRotation(seed, salt = '') {
  const hash = hashSeed(`${seed}${salt}`)
  // Map hash to range [-5, 5]
  return (hash % 11) - 5
}

/**
 * Extract emoji from a category or asterisk string
 * @param {string} str - String like "🏈 Football" or "🥇 PR"
 * @returns {string} - Just the emoji, or first letter if no emoji
 */
export function extractEmoji(str) {
  if (!str) return '?'
  // Match emoji characters
  const emojiMatch = str.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u)
  if (emojiMatch) return emojiMatch[0]
  // Fallback to first character
  return str.charAt(0)
}

/**
 * Get randomized transform for card back name
 * @param {string} seed - A unique identifier for deterministic randomization
 * @returns {{ rotation: number, x: number, y: number }} - Transform values
 */
export function getNameTransform(seed) {
  const hash = hashSeed(`${seed}-name`)
  // Rotation: ±1.5 degrees
  const rotation = ((hash % 31) - 15) / 10  // Range: -1.5 to 1.5
  // X offset: ±4px
  const x = ((hash >> 5) % 9) - 4  // Range: -4 to 4
  // Y offset: ±4px
  const y = ((hash >> 10) % 9) - 4  // Range: -4 to 4
  return { rotation, x, y }
}
