import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/solid'
import { isLightColor } from '../utils/cardVariants'

/**
 * Portal-based buttons for card back.
 * Renders ALL buttons to document.body to escape 3D transform context,
 * fixing hit-testing issues with backface-visibility and CSS 3D transforms.
 */
export default function CardBackButtons({
  youtubeUrl,
  triviaUrl,
  onFlipBack,     // callback to flip card back
  isVisible,      // true when card is flipped and not animating
  containerRef,   // ref to placeholder div in card-back-links
  cardRef,        // ref to card container for FAB positioning
  stickerColor,   // primary sticker color for Watch Run button
  cardSecondary,  // secondary card color for Trivia Quiz button
  rotation = 0,   // card rotation in degrees to match grid item rotation
  fabOffsetX = 8, // horizontal offset from card edge (default 8px)
  fabOffsetY = 8, // vertical offset from card edge (default 8px)
  inPSACase = false, // whether card is in PSA case (affects button sizing)
}) {
  const [position, setPosition] = useState(null)
  const [cardPosition, setCardPosition] = useState(null)
  const [hoveredButton, setHoveredButton] = useState(null)

  useEffect(() => {
    if (!isVisible || !containerRef?.current) {
      setPosition(null)
      setCardPosition(null)
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

      // FAB always positioned relative to the card container (not PSA case)
      if (cardRef?.current) {
        const cardRect = cardRef.current.getBoundingClientRect()
        setCardPosition({
          top: cardRect.top + window.scrollY,
          left: cardRect.left + window.scrollX,
          width: cardRect.width,
          height: cardRect.height,
        })
      }
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
  }, [isVisible, containerRef, cardRef])

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

  // FAB size
  const fabSize = 48

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
            window.open(youtubeUrl, '_blank', 'noopener,noreferrer')
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

  // Flip back FAB - positioned at bottom-right corner of card
  const flipFab = cardPosition && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onFlipBack?.(e)
      }}
      onMouseEnter={() => setHoveredButton('flip')}
      onMouseLeave={() => setHoveredButton(null)}
      style={{
        position: 'absolute',
        top: cardPosition.top + cardPosition.height - fabSize - fabOffsetY,
        left: cardPosition.left + cardPosition.width - fabSize - fabOffsetX,
        width: fabSize,
        height: fabSize,
        borderRadius: '50%',
        background: hoveredButton === 'flip' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
        color: 'rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        boxShadow: hoveredButton === 'flip'
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        zIndex: 10000,
        pointerEvents: 'auto',
        transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
        transform: hoveredButton === 'flip' ? 'scale(1.1)' : 'scale(1)',
      }}
      title="Flip back to front"
    >
      <ArrowUturnLeftIcon style={{ width: 20, height: 20 }} />
    </button>
  )

  return createPortal(
    <>
      {buttons}
      {flipFab}
    </>,
    document.body
  )
}
