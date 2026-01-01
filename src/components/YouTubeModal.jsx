import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { parseYouTubeUrl } from '../utils/youtubeHelpers'

/**
 * Modal overlay for embedded YouTube player.
 * Supports autoplay and timecode from URL.
 */
export default function YouTubeModal({ url, onClose }) {
  const parsed = parseYouTubeUrl(url)
  const videoId = parsed?.videoId
  const timecode = parsed?.timecode

  // Build embed URL with autoplay and start time
  // playsinline=1 is required for iOS Safari to play inline instead of fullscreen
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1${timecode ? `&start=${timecode}` : ''}`
    : null

  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden' // Prevent background scroll

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [handleEscape])

  if (!embedUrl) return null

  return createPortal(
    <div
      className="youtube-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
    >
      <div
        className="youtube-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '960px',
          margin: '0 16px',
          aspectRatio: '16 / 9',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-48px',
            right: '0',
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Close video"
        >
          <XMarkIcon style={{ width: 32, height: 32 }} />
        </button>
        <iframe
          src={embedUrl}
          title="YouTube video player"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            border: 'none',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
    </div>,
    document.body
  )
}
