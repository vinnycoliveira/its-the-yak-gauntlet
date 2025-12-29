import { useState, useEffect } from 'react'

export default function ScrollToTopFab() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Estimate when 4th row is out of view
      // Card aspect ratio is 2.5:3.5, so height ≈ 1.4 * width
      // At 4 columns (xl), cards are roughly 250px wide → ~350px tall
      // 4 rows × 350px + gaps ≈ 1400px + some buffer
      // We'll use a threshold that works across breakpoints
      const threshold = 1200
      setIsVisible(window.scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top-fab ${isVisible ? 'visible' : ''}`}
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
