import { useScrollToTop } from './ScrollToTopFab'

export default function MobileHeader({ isOpen, onToggle }) {
  const { isVisible, scrollToTop } = useScrollToTop()

  return (
    <header className="mobile-header">
      <button
        type="button"
        onClick={onToggle}
        className="mobile-menu-btn"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      <h1 className="text-lg font-display font-bold text-yak-gold tracking-wide">
        THE YAK GAUNTLET
      </h1>
      <button
        type="button"
        onClick={scrollToTop}
        className={`mobile-scroll-top-btn ${isVisible ? 'visible' : ''}`}
        aria-label="Scroll to top"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="17 11 12 6 7 11" />
          <polyline points="17 18 12 13 7 18" />
        </svg>
      </button>
    </header>
  )
}
