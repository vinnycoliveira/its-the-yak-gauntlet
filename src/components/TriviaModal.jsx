import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/solid'

/**
 * Modal overlay for embedded trivia quiz.
 * Displays external quiz URL in an iframe.
 */
export default function TriviaModal({ url, onClose }) {
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

  if (!url) return null

  return createPortal(
    <div
      className="trivia-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '60px 0 16px',
      }}
    >
      <div
        className="trivia-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          height: '100%',
          maxHeight: 'calc(100vh - 76px)',
          margin: '0 16px',
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
          aria-label="Close trivia"
        >
          <XMarkIcon style={{ width: 32, height: 32 }} />
        </button>
        <iframe
          src={url}
          title="Trivia Quiz"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'white',
          }}
          allow="fullscreen"
        />
      </div>
    </div>,
    document.body
  )
}
