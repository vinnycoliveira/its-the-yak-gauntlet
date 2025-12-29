import { extractEmoji } from '../../utils/stickerRandomizer'

// Simple hash for deterministic randomness
function hashSeed(seed) {
  let hash = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Stacked in bottom left, growing upward
// Base position: bottom 12px, left 12px
// Sticker height: 40px, overlap between 0 and -8px (so offset 32-40px)
const BASE_BOTTOM = 12
const BASE_LEFT = 12
const STICKER_HEIGHT = 40

export default function AsteriskSticker({ asterisk, index, seed }) {
  const emoji = extractEmoji(asterisk)

  // Use seed for group-level randomization (overlap)
  const groupHash = hashSeed(`${seed}-asterisk-group`)

  // Use different salts for each property to get independent random values per sticker
  const tiltHash = hashSeed(`${seed}-tilt-${index}`)
  const driftHash = hashSeed(`${seed}-drift-${index}`)

  // ± 10° tilt (per sticker)
  const tilt = (tiltHash % 21) - 10

  // ± 8px left/right drift (per sticker) - using modulo 17 gives range 0-16, subtract 8 for -8 to +8
  const drift = (driftHash % 17) - 8

  // 0 to -8px overlap (same for whole stack so they stay connected)
  const overlap = (groupHash % 9)  // 0 to 8
  const stackOffset = STICKER_HEIGHT - overlap

  const bottomPosition = BASE_BOTTOM + (index * stackOffset)
  const leftPosition = BASE_LEFT + drift

  return (
    <div
      className="asterisk-sticker"
      style={{
        bottom: `${bottomPosition}px`,
        left: `${leftPosition}px`,
        transform: `rotate(${tilt}deg)`,
      }}
      title={asterisk}
    >
      {emoji}
    </div>
  )
}
