import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { isLightColor } from '../utils/cardVariants'
import YouTubeModal from './YouTubeModal'

/**
 * Portal-based buttons for card back.
 * Renders ALL buttons to document.body to escape 3D transform context,
 * fixing hit-testing issues with backface-visibility and CSS 3D transforms.
 */
export default function CardBackButtons({
  youtubeUrl,
  triviaUrl,
  isVisible,      // true when card is flipped and not animating
  containerRef,   // ref to placeholder div in card-back-links
  stickerColor,   // primary sticker color for Watch Run button
  cardSecondary,  // secondary card color for Trivia Quiz button
  rotation = 0,   // card rotation in degrees to match grid item rotation
  inPSACase = false, // whether card is in PSA case (affects button sizing)
}) {
  const [position, setPosition] = useState(null)
  const [hoveredButton, setHoveredButton] = useState(null)
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)

  useEffect(() => {
    if (!isVisible || !containerRef?.current) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      const rect = containerRef.current.getBoundingClientRect()
      // Use absolute positioning with scroll offset for smooth scrolling
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      })
    }

    updatePosition()

    // Track position on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    // Continuously update during potential animations (hover scale, etc.)
    const interval = setInterval(updatePosition, 50)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      clearInterval(interval)
    }
  }, [isVisible, containerRef])

  // Don't render if not visible or position not calculated
  if (!isVisible || !position) return null

  // Determine text colors based on background contrast
  const watchRunBg = stickerColor || '#1e8c7a'
  const triviaQuizBg = cardSecondary || '#8b1528'
  const watchRunTextColor = isLightColor(watchRunBg) ? '#000000' : '#ffffff'
  const triviaQuizTextColor = isLightColor(triviaQuizBg) ? '#000000' : '#ffffff'

  // Base button styles - adjust padding based on PSA case to match visual sizes
  // Cards not in PSA case are scaled larger (1.2x), so buttons need less padding
  const baseButtonStyle = {
    flex: 1,
    padding: inPSACase ? '10px 12px' : '6px 8px',
    borderRadius: '6px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: inPSACase ? '0.875rem' : '0.875rem',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif',
    transition: 'filter 0.15s, box-shadow 0.15s',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: inPSACase ? '40px' : '40px',
  }

  const buttons = (
    <div
      className="portal-card-buttons"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        display: 'flex',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'auto',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {youtubeUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowYouTubeModal(true)
          }}
          onMouseEnter={() => setHoveredButton('youtube')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            ...baseButtonStyle,
            background: watchRunBg,
            color: watchRunTextColor,
            filter: hoveredButton === 'youtube' ? 'brightness(1.15)' : 'none',
            boxShadow: hoveredButton === 'youtube' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
          }}
        >
          Watch Run
        </button>
      )}
      {triviaUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            window.open(triviaUrl, '_blank', 'noopener,noreferrer')
          }}
          onMouseEnter={() => setHoveredButton('trivia')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            ...baseButtonStyle,
            background: triviaQuizBg,
            color: triviaQuizTextColor,
            filter: hoveredButton === 'trivia' ? 'brightness(1.15)' : 'none',
            boxShadow: hoveredButton === 'trivia' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
          }}
        >
          Trivia Quiz
        </button>
      )}
    </div>
  )

  return createPortal(
    <>
      {buttons}
      {showYouTubeModal && (
        <YouTubeModal
          url={youtubeUrl}
          onClose={() => setShowYouTubeModal(false)}
        />
      )}
    </>,
    document.body
  )
}
