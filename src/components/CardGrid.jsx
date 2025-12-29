import { useMemo } from 'react'
import GauntletCard from './GauntletCard'
import PSAGradeCase from './PSAGradeCase'
import { getCardVariant, FRAME_SHAPES } from '../utils/cardVariants'
import { shouldShowPSACase } from '../utils/dataHelpers'

/**
 * Simple hash function for deterministic randomness
 */
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

/**
 * Get random grid offset for a card (tilt and position)
 * @param {string} seed - Unique identifier for deterministic randomization
 * @returns {{ rotation: number, x: number, y: number }} - Transform values
 */
function getGridOffset(seed) {
  const hash = hashSeed(seed)
  // Rotation: -3 to +3 degrees
  const rotation = (hash % 7) - 3
  // X offset: -12 to +12 pixels
  const x = ((hash >> 3) % 25) - 12
  // Y offset: -12 to +12 pixels
  const y = ((hash >> 6) % 25) - 12
  return { rotation, x, y }
}

/**
 * Compute variant overrides to ensure adjacent cards don't have the same frame shape.
 * Preserves rank order - only modifies visual appearance, not card positions.
 */
function computeVariantOverrides(runs) {
  if (runs.length <= 1) return runs.map(() => ({}))

  const frameShapeKeys = Object.keys(FRAME_SHAPES)
  const overrides = []

  // Get base variants for all runs
  const baseVariants = runs.map((run) => getCardVariant(run.id))

  for (let i = 0; i < runs.length; i++) {
    const currentVariant = baseVariants[i]
    const prevOverrides = overrides[i - 1] || {}
    const prevVariant = i > 0 ? baseVariants[i - 1] : null
    const prevFrameShape = prevVariant ? (prevOverrides.frameShape || prevVariant.frameShape) : null

    // Check if current frame shape matches previous
    if (prevFrameShape && currentVariant.frameShape === prevFrameShape) {
      // Find a different frame shape
      const alternativeShape = frameShapeKeys.find((shape) => shape !== prevFrameShape)
      overrides.push({ frameShape: alternativeShape })
    } else {
      overrides.push({})
    }
  }

  return overrides
}

export default function CardGrid({ runs }) {
  // Compute overrides to avoid adjacent same-style cards (preserves rank order)
  const variantOverrides = useMemo(() => computeVariantOverrides(runs), [runs])

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 text-lg">No runs match your filters</p>
        <p className="text-white/50 text-sm mt-2">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  // Calculate row positions for edge detection
  // We use data attributes so CSS can handle the hover shift
  const totalCards = runs.length

  return (
    <div className="card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {runs.map((run, index) => {
        const offset = getGridOffset(run.id)
        const showPSACase = shouldShowPSACase(run)

        return (
          <div
            key={run.id}
            className={`card-grid-item ${showPSACase ? 'has-psa-case' : ''}`}
            data-index={index}
            data-total={totalCards}
            style={{
              '--card-rotation': `${offset.rotation}deg`,
              '--card-x': `${offset.x}px`,
              '--card-y': `${offset.y}px`,
            }}
          >
            {showPSACase ? (
              <PSAGradeCase name={run.competitor} date={run.date}>
                {(psaCaseState) => (
                  <GauntletCard
                    run={run}
                    variantOverrides={variantOverrides[index]}
                    inPSACase
                    psaCaseState={psaCaseState}
                  />
                )}
              </PSAGradeCase>
            ) : (
              <GauntletCard run={run} variantOverrides={variantOverrides[index]} />
            )}
          </div>
        )
      })}
    </div>
  )
}
