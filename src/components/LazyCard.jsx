import { useState, useRef, useEffect } from 'react'

// Check if we're on mobile (matches CSS breakpoint)
const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches

/**
 * LazyCard - Wrapper component that only renders children when visible
 * Uses IntersectionObserver for performance-friendly lazy loading
 * On mobile, also tracks "centered" state for rolodex effect
 */
export default function LazyCard({ children, className = '', style = {} }) {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isCentered, setIsCentered] = useState(false)
  const containerRef = useRef(null)

  // Lazy loading observer - runs once
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasLoaded(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  // Mobile rolodex effect - continuous observer for centering
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    // Only enable on mobile
    if (!isMobileViewport()) return

    // Observer to detect when card is "centered" (high visibility ratio)
    const centerObserver = new IntersectionObserver(
      ([entry]) => {
        // Card is "centered" when it's highly visible (>60% in viewport center area)
        setIsCentered(entry.intersectionRatio > 0.6)
      },
      {
        // Shrink the detection area to the center portion of the viewport
        // Negative margins shrink the root bounds inward
        rootMargin: '-20% 0px -20% 0px',
        // Multiple thresholds for smoother detection
        threshold: [0, 0.3, 0.6, 0.9],
      }
    )

    centerObserver.observe(element)

    return () => centerObserver.disconnect()
  }, [])

  const centeredClass = isCentered ? 'mobile-centered' : ''

  return (
    <div ref={containerRef} className={`${className} ${centeredClass}`} style={style}>
      {hasLoaded ? (
        children
      ) : (
        <div className="lazy-card-placeholder">
          <div className="lazy-card-skeleton" />
        </div>
      )}
    </div>
  )
}
