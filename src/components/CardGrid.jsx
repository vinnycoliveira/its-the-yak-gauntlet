import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import GauntletCard from './GauntletCard'
import PSAGradeCase from './PSAGradeCase'
import LazyCard from './LazyCard'
import { getCardVariant, FRAME_SHAPES } from '../utils/cardVariants'
import { shouldShowPSACase } from '../utils/dataHelpers'

const CARDS_PER_PAGE = 12

// Check if we're on mobile (matches CSS breakpoint)
const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches

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
  const [isMobile, setIsMobile] = useState(false)
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE)
  const loadMoreRef = useRef(null)
  const prevRunsRef = useRef(runs)

  // Check viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileViewport())
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Reset visible count when runs change (e.g., new filter applied)
  if (prevRunsRef.current !== runs) {
    prevRunsRef.current = runs
    if (visibleCount !== CARDS_PER_PAGE) {
      setVisibleCount(CARDS_PER_PAGE)
    }
  }

  // Load more cards when the sentinel comes into view (mobile only)
  const loadMore = useCallback(() => {
    if (!isMobile) return
    setVisibleCount((prev) => Math.min(prev + CARDS_PER_PAGE, runs.length))
  }, [runs.length, isMobile])

  // IntersectionObserver to trigger loading more cards (mobile only)
  useEffect(() => {
    if (!isMobile) return

    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '400px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, isMobile])

  // Compute overrides to avoid adjacent same-style cards (preserves rank order)
  const variantOverrides = useMemo(() => computeVariantOverrides(runs), [runs])

  // On mobile, only render cards up to visibleCount; on desktop, render all
  const visibleRuns = useMemo(
    () => (isMobile ? runs.slice(0, visibleCount) : runs),
    [runs, visibleCount, isMobile]
  )
  const hasMore = isMobile && visibleCount < runs.length

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 text-lg">No runs match your filters</p>
        <p className="text-white/50 text-sm mt-2">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <>
      <div className="card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleRuns.map((run, index) => {
          const offset = getGridOffset(run.id)
          const showPSACase = shouldShowPSACase(run)

          return (
            <LazyCard
              key={run.id}
              className={`card-grid-item ${showPSACase ? 'has-psa-case' : ''}`}
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
            </LazyCard>
          )
        })}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="load-more-sentinel py-8 text-center">
          <p className="text-white/50 text-sm">Loading more cards...</p>
        </div>
      )}
    </>
  )
}
