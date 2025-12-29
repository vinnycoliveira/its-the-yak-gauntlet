import { useState, useRef } from 'react'
import { formatDate } from '../utils/dataHelpers'

/**
 * Generate a deterministic barcode pattern based on competitor name
 * Returns an array of objects with id and size for each bar
 */
function generateBarcode(name) {
  const bars = []
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Generate ~35 bars for a realistic barcode look
  for (let i = 0; i < 35; i++) {
    const hash = (seed * (i + 1) * 17) % 100
    let size
    if (hash < 30) {
      size = 'thick'
    } else if (hash < 60) {
      size = 'medium'
    } else {
      size = 'thin'
    }
    bars.push({ id: `${seed}-${i}`, size })
  }
  return bars
}

/**
 * PSA Grading Case wrapper component
 * Displays a card in a crystal-clear PSA-style grading case
 * with the competitor's name, date, and "PERSONAL BEST" label
 *
 * Handles all transform physics (tilt, flip, scale) as a single unit with the card
 */
export default function PSAGradeCase({ name, date, children }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [pointer, setPointer] = useState({ x: 50, y: 50 })
  const caseRef = useRef(null)

  const barcodePattern = generateBarcode(name)

  // Format date for display (e.g., "MON JUN 1, 2025")
  const formattedDate = formatDate(date).toUpperCase()

  const handleClick = (e) => {
    // Don't flip if clicking on interactive elements inside the card
    if (e.target.closest('.card-back-link, a, button')) return

    // Only flip from front to back on general click
    // Back to front is handled by the dedicated flip-back button
    if (isFlipped) return

    // Don't flip if already flipping (prevents double-flip)
    if (isFlipping) return

    // Reset tilt when flipping to prevent interference
    setTilt({ x: 0, y: 0 })
    // Enable slower flip transition
    setIsFlipping(true)
    setIsFlipped(true)
    // Remove flipping class after animation completes
    setTimeout(() => setIsFlipping(false), 500)
  }

  const handleFlipBack = (e) => {
    e.stopPropagation()
    if (isFlipping) return

    setTilt({ x: 0, y: 0 })
    setIsFlipping(true)
    setIsFlipped(false)
    setTimeout(() => setIsFlipping(false), 500)
  }

  const handleMouseMove = (e) => {
    // Disable tilt effect when flipped or during flip animation
    if (isFlipped || isFlipping) return

    const caseEl = e.currentTarget
    const rect = caseEl.getBoundingClientRect()

    // Calculate mouse position relative to case center (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    // Calculate pointer position as percentage (0-100) for holofoil effects
    const pointerX = ((e.clientX - rect.left) / rect.width) * 100
    const pointerY = ((e.clientY - rect.top) / rect.height) * 100
    setPointer({ x: pointerX, y: pointerY })

    // Convert to rotation degrees (max ±10 degrees for the case)
    const maxTilt = 10
    setTilt({
      x: y * maxTilt,
      y: -x * maxTilt
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setPointer({ x: 50, y: 50 })
  }

  // State to pass to child card
  const psaCaseState = {
    isFlipped,
    isFlipping,
    tilt,
    pointer,
    handleFlipBack,
    caseRef,  // Pass case ref for FAB positioning
  }

  return (
    <div
      ref={caseRef}
      className={`psa-case cursor-pointer ${isFlipped ? 'flipped' : ''} ${isFlipping ? 'flipping' : ''}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
    >
      {/* Inner wrapper that handles all transforms including flip */}
      <div
        className="psa-case-transform"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 + tilt.y : tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: isFlipping ? 'transform 0.6s ease-in-out' : 'transform 0.15s ease-out',
        }}
      >
        {/* Front face of PSA case */}
        <div className="psa-case-front">
          {/* PSA Label header */}
          <div className="psa-label">
            <div className="psa-label-left">
              <div className="psa-label-name">{name}</div>
              <div className="psa-barcode">
                {barcodePattern.map((bar) => (
                  <div key={bar.id} className={`psa-barcode-bar ${bar.size}`} />
                ))}
              </div>
            </div>
            <div className="psa-label-right">
              <div className="psa-label-date">{formattedDate}</div>
              <div className="psa-label-grade">PERSONAL BEST</div>
            </div>
          </div>

          {/* Depth layer for 3D effect */}
          <div className="psa-case-depth" />

          {/* Inner card holder */}
          <div className="psa-case-inner">
            {/* Clone child and inject props */}
            {typeof children === 'function'
              ? children(psaCaseState)
              : children}
          </div>

          {/* Crystal clear overlay with reflections */}
          <div className="psa-case-overlay" />
        </div>

        {/* Back face of PSA case - transparent to show card back */}
        <div className="psa-case-back">
          {/* PSA Label header - same as front */}
          <div className="psa-label">
            <div className="psa-label-left">
              <div className="psa-label-name">{name}</div>
              <div className="psa-barcode">
                {barcodePattern.map((bar) => (
                  <div key={`back-${bar.id}`} className={`psa-barcode-bar ${bar.size}`} />
                ))}
              </div>
            </div>
            <div className="psa-label-right">
              <div className="psa-label-date">{formattedDate}</div>
              <div className="psa-label-grade">PERSONAL BEST</div>
            </div>
          </div>

          {/* Depth layer for 3D effect */}
          <div className="psa-case-depth" />

          {/* Inner card holder - shows card back */}
          <div className="psa-case-inner">
            {/* Clone child and inject props for back view */}
            {typeof children === 'function'
              ? children({ ...psaCaseState, showBack: true })
              : children}
          </div>

          {/* Crystal clear overlay with reflections */}
          <div className="psa-case-overlay" />
        </div>

        {/* Edge/thickness visible during flip - left side */}
        <div className="psa-case-edge psa-case-edge-left" />
        {/* Edge/thickness visible during flip - right side */}
        <div className="psa-case-edge psa-case-edge-right" />
      </div>
    </div>
  )
}
