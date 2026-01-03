import { useState, useRef, useEffect } from 'react'

// Check if we're on mobile (matches CSS breakpoint)
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

/**
 * LazyCard - Wrapper component with virtualization
 * On mobile: unloads cards far from viewport to prevent memory exhaustion
 * On desktop: keeps cards loaded once visible (better UX with more memory)
 */
export default function LazyCard({ children, className = '', style = {} }) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const isMobile = isMobileViewport()

    // On mobile: use smaller margin and track visibility both ways
    // On desktop: use larger margin and only load once
    const rootMargin = isMobile ? '400px 0px' : '200px 0px'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMobile) {
          // Mobile: track visibility both ways (virtualization)
          setIsVisible(entry.isIntersecting)
        } else {
          // Desktop: only load once, never unload
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={className} style={style}>
      {isVisible ? (
        children
      ) : (
        <div className="lazy-card-placeholder">
          <div className="lazy-card-skeleton" />
        </div>
      )}
    </div>
  )
}
