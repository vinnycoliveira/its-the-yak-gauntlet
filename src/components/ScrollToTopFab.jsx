import { useState, useEffect, createContext, useContext } from 'react'

// Context to share scroll state with mobile header
const ScrollContext = createContext({ isVisible: false, scrollToTop: () => {} })

export function useScrollToTop() {
  return useContext(ScrollContext)
}

export function ScrollToTopProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Threshold before FAB appears
      const threshold = 1200

      // Calculate total scrollable height
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentScroll = window.scrollY

      // Show FAB after threshold
      setIsVisible(currentScroll > threshold)

      // Calculate progress (0 to 1) from threshold to end of page
      // This determines vertical position of the FAB
      const scrollableAfterThreshold = scrollHeight - threshold
      const scrolledAfterThreshold = Math.max(0, currentScroll - threshold)
      const progress = scrollableAfterThreshold > 0
        ? Math.min(1, scrolledAfterThreshold / scrollableAfterThreshold)
        : 0

      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ScrollContext.Provider value={{ isVisible, scrollProgress, scrollToTop }}>
      {children}
    </ScrollContext.Provider>
  )
}

export default function ScrollToTopFab() {
  const { isVisible, scrollProgress, scrollToTop } = useScrollToTop()

  // Calculate vertical position using CSS custom property for smooth GPU-accelerated animation
  // Progress 0 = near top, Progress 1 = near bottom

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top-fab ${isVisible ? 'visible' : ''}`}
      style={{ '--scroll-progress': scrollProgress }}
      aria-label="Scroll to top"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Double chevron up */}
        <polyline points="17 11 12 6 7 11" />
        <polyline points="17 18 12 13 7 18" />
      </svg>
    </button>
  )
}
