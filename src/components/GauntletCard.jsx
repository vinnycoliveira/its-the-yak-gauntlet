import { useState, useRef, useEffect } from 'react'
import { formatDate, parseAsterisks, parseResume } from '../utils/dataHelpers'
import { getAsteriskPositions, getNameTransform } from '../utils/stickerRandomizer'
import { getCardVariant, getVariantClasses, getVariantStyles, getCardEffect, getCardEffectClass, getCardPattern, getGlareDirection, FONT_FAMILIES, isLightColor } from '../utils/cardVariants'
import { getOptimizedImageUrl } from '../utils/imageOptimizer'
import PositionSticker from './stickers/PositionSticker'
import ResumeSticker from './stickers/ResumeSticker'
import AsteriskSticker from './stickers/AsteriskSticker'
import { NameLabelParallelogramPop, TimeLabelParallelogramPop, NameLabelRibbonPop, TimeLabelRibbonPop, NameLabelHotdog, TimeLabelHotdog } from './labels'
import CardBackButtons from './CardBackButtons'

// Check if we're on mobile (matches CSS breakpoint)
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

/**
 * Simple hash function for deterministic randomness (same as CardGrid)
 */
function hashSeed(seed) {
  let hash = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Get card rotation (matches CardGrid's getGridOffset rotation calculation)
 */
function getCardRotation(seed) {
  const hash = hashSeed(seed)
  // Rotation: -3 to +3 degrees (same formula as CardGrid)
  return (hash % 7) - 3
}

export default function GauntletCard({ run, variantOverrides = {}, inPSACase = false, psaCaseState = null }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState(null) // 'to-back' or 'to-front' for CSS animation
  const [imageErrors, setImageErrors] = useState({})
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [pointer, setPointer] = useState({ x: 50, y: 50 }) // Pointer position as percentage
  const [isMobile, setIsMobile] = useState(false) // Must use state to avoid SSR/hydration issues
  const buttonsPlaceholderRef = useRef(null)
  const cardContainerRef = useRef(null)

  // Check mobile on mount (must be in useEffect to avoid SSR issues)
  useEffect(() => {
    setIsMobile(isMobileViewport())
  }, [])

  // Team run detection
  const isTeamRun = run.isTeamRun && run.teamMembers && run.teamMembers.length > 1
  const displayName = isTeamRun ? 'Team Run' : run.competitor

  // When in PSA case, use shared state from parent; otherwise use local state
  const effectiveIsFlipped = inPSACase && psaCaseState ? psaCaseState.isFlipped : isFlipped
  const effectiveIsFlipping = inPSACase && psaCaseState ? psaCaseState.isFlipping : isFlipping
  const effectiveTilt = inPSACase && psaCaseState ? psaCaseState.tilt : tilt
  const effectivePointer = inPSACase && psaCaseState ? psaCaseState.pointer : pointer

  // When showBack is true (PSA case back face), only render the card back
  const showBackOnly = inPSACase && psaCaseState?.showBack

  const handleClick = (e) => {
    const newFlippedState = !isFlipped
    console.log('[CardFlip] Tap detected', {
      competitor: run.competitor,
      inPSACase,
      isFlipping,
      currentFlipped: isFlipped,
      willFlipTo: newFlippedState,
      isMobile,
    })

    // If in PSA case, let the case handle click
    if (inPSACase) {
      console.log('[CardFlip] In PSA case, delegating to parent')
      return
    }

    // Don't flip if already flipping (prevents double-flip)
    if (isFlipping) {
      console.log('[CardFlip] Already flipping, ignoring tap')
      return
    }

    console.log('[CardFlip] Executing flip to:', newFlippedState ? 'BACK' : 'FRONT')

    // Reset tilt when flipping to prevent interference
    setTilt({ x: 0, y: 0 })
    // Set flip direction for CSS animation (mobile uses directional classes)
    setFlipDirection(newFlippedState ? 'to-back' : 'to-front')
    // Enable slower flip transition
    setIsFlipping(true)
    setIsFlipped(newFlippedState)
    // Remove flipping class after animation completes
    setTimeout(() => {
      setIsFlipping(false)
      setFlipDirection(null)
      console.log('[CardFlip] Flip animation complete, now showing:', newFlippedState ? 'BACK' : 'FRONT')
    }, 500)
  }

  const handleFlipBack = (e) => {
    e.stopPropagation()
    if (isFlipping) return

    setTilt({ x: 0, y: 0 })
    setFlipDirection('to-front')
    setIsFlipping(true)
    setIsFlipped(false)
    setTimeout(() => {
      setIsFlipping(false)
      setFlipDirection(null)
    }, 500)
  }

  const handleMouseMove = (e) => {
    // If in PSA case, let the case handle mouse move
    if (inPSACase) return

    // Disable tilt effect when card is flipped or during flip animation
    if (isFlipped || isFlipping) return

    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    // Calculate mouse position relative to card center (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    // Calculate pointer position as percentage (0-100) for holofoil effects
    const pointerX = ((e.clientX - rect.left) / rect.width) * 100
    const pointerY = ((e.clientY - rect.top) / rect.height) * 100
    setPointer({ x: pointerX, y: pointerY })

    // Convert to rotation degrees (max ±12 degrees)
    const maxTilt = 12
    setTilt({
      x: y * maxTilt,   // tiltX: mouse below center = tilt forward
      y: -x * maxTilt   // tiltY: mouse right of center = tilt right
    })
  }

  const handleMouseLeave = () => {
    // If in PSA case, let the case handle mouse leave
    if (inPSACase) return

    setTilt({ x: 0, y: 0 })
    setPointer({ x: 50, y: 50 }) // Reset to center
  }

  const asterisksList = parseAsterisks(run.asterisks)
  const categories = parseResume(run.resume)
  const asteriskPositions = getAsteriskPositions(asterisksList, run.id)
  const primaryCategory = categories[0] || ''

  // Get deterministic variant based on competitor ID (uses palette families from Figma)
  const variant = getCardVariant(run.id, variantOverrides)
  const variantClasses = getVariantClasses(variant)
  const variantStyles = getVariantStyles(variant)

  // Get card effect class (uses shared utility for consistency with CardGrid reordering)
  const effect = getCardEffect(run.id)
  const cardEffect = getCardEffectClass(effect)
  const glareDirection = effect === 'glare' ? `glare-${getGlareDirection(run.id)}` : ''

  // Get card pattern (60% of cards get a pattern, 40% get none)
  const cardPattern = getCardPattern(run.id)

  // Get randomized name transform for card back
  const nameTransform = getNameTransform(run.id)

  // Calculate derived pointer values for holofoil effects (use effective values)
  const pointerFromCenter = Math.sqrt(
    (effectivePointer.y - 50) ** 2 + (effectivePointer.x - 50) ** 2
  ) / 50
  const pointerFromTop = effectivePointer.y / 100
  const pointerFromLeft = effectivePointer.x / 100

  // Holofoil CSS variables
  const holoStyles = {
    '--pointer-x': `${effectivePointer.x}%`,
    '--pointer-y': `${effectivePointer.y}%`,
    '--pointer-from-center': Math.min(pointerFromCenter, 1),
    '--pointer-from-top': pointerFromTop,
    '--pointer-from-left': pointerFromLeft,
    '--background-x': `${37 + (effectivePointer.x / 100) * 26}%`,
    '--background-y': `${33 + (effectivePointer.y / 100) * 34}%`,
  }

  return (
    <div
      ref={cardContainerRef}
      className={`card-container variant-card cursor-pointer ${effectiveIsFlipped ? 'flipped' : ''} ${effectiveIsFlipping ? 'flipping' : ''} ${flipDirection ? `flip-${flipDirection}` : ''} ${cardEffect} ${glareDirection} ${variantClasses} ${inPSACase ? 'in-psa-case' : ''}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ aspectRatio: '2.5 / 3.5', ...variantStyles, ...holoStyles }}
    >
      <div
        className="card-inner w-full h-full"
        style={{
          // When in PSA case, don't apply any transforms - the case handles everything
          // On mobile: CSS handles the flip animation via .flipping class - don't apply rotation here
          // On desktop: full 3D transform with tilt
          transform: inPSACase || isMobile
            ? 'none'
            : `${effectiveIsFlipped ? 'rotateY(180deg)' : ''} rotateX(${effectiveTilt.x}deg) rotateY(${effectiveTilt.y}deg)`,
        }}
      >
        {/* Front of card - hidden when showBackOnly is true (PSA case back face) */}
        {!showBackOnly && <div className="card-front w-full h-full">
          <div className="trading-card h-full relative">
            {/* Card background (visible for circle/diamond frames) */}
            <div className="card-background absolute inset-0" />
            {/* Pattern overlay - 60% of cards get a pattern */}
            {cardPattern && (
              <div
                className="card-pattern-overlay absolute inset-0"
                style={{ backgroundImage: `url(${cardPattern})` }}
              />
            )}

            {/* Photo container - shape controlled by variant */}
            <div className="photo-container absolute">
              {isTeamRun ? (
                <div className={`team-photo-grid team-photo-grid-${run.teamMembers.length}`}>
                  {run.teamMembers.map((member, index) => (
                    <div key={member.name || index} className="team-photo-cell">
                      {member.photoUrl && !imageErrors[member.name] ? (
                        <img
                          src={getOptimizedImageUrl(member.photoUrl)}
                          alt={member.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-top"
                          onError={() => setImageErrors((prev) => ({ ...prev, [member.name]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card-burgundy/20 to-card-dark-red/20">
                          <span className="text-2xl font-display text-white/30">
                            {(member.name || '?').charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : run.photoUrl && !imageErrors.single ? (
                <img
                  src={getOptimizedImageUrl(run.photoUrl)}
                  alt={run.competitor}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                  onError={() => setImageErrors((prev) => ({ ...prev, single: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card-burgundy/20 to-card-dark-red/20">
                  <span className="text-8xl font-display text-white/30">
                    {run.competitor.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Name label - hidden when in PSA case (name shown in case label) */}
            {!inPSACase && (
              variant.labelStyle === 'hotdog' ? (
                <NameLabelHotdog
                  name={displayName}
                  fillColor={variant.colors.primary}
                  textColor={isLightColor(variant.colors.primary) ? 'black' : 'white'}
                  fontFamily={FONT_FAMILIES[variant.fontStyle]}
                />
              ) : (
                <div className="name-label">
                  {variant.labelStyle === 'ribbon-pop' ? (
                    <NameLabelRibbonPop
                      name={displayName}
                      fillColor={variant.colors.primary}
                      textColor={isLightColor(variant.colors.primary) ? 'black' : 'white'}
                      fontFamily={FONT_FAMILIES[variant.fontStyle]}
                    />
                  ) : (
                    <NameLabelParallelogramPop
                      name={displayName}
                      shadowColor={variant.colors.primary}
                      fontFamily={FONT_FAMILIES[variant.fontStyle]}
                    />
                  )}
                </div>
              )
            )}

            {/* Time label */}
            {variant.labelStyle === 'hotdog' ? (
              <TimeLabelHotdog
                time={run.time}
                fillColor={variant.colors.primary}
                textColor={isLightColor(variant.colors.primary) ? 'black' : 'white'}
                fontFamily={FONT_FAMILIES[variant.fontStyle]}
              />
            ) : (
              <div className="time-label">
                {variant.labelStyle === 'ribbon-pop' ? (
                  <TimeLabelRibbonPop
                    time={run.time}
                    fillColor={variant.colors.secondary}
                    textColor={isLightColor(variant.colors.secondary) ? 'black' : 'white'}
                    fontFamily={FONT_FAMILIES[variant.fontStyle]}
                  />
                ) : (
                  <TimeLabelParallelogramPop
                    time={run.time}
                    shadowColor={variant.colors.primary}
                    fontFamily={FONT_FAMILIES[variant.fontStyle]}
                  />
                )}
              </div>
            )}

            {/* Resume sticker - bottom left */}
            <ResumeSticker resume={primaryCategory} seed={run.id} />

            {/* Position sticker - bottom right */}
            <PositionSticker rank={run.rank} seed={run.id} variant={variant} pattern={cardPattern} />

            {/* Asterisk stickers - stacked in bottom left */}
            {asteriskPositions.map((pos, index) => (
              <AsteriskSticker
                key={pos.asterisk}
                asterisk={pos.asterisk}
                index={index}
                seed={run.id}
              />
            ))}

            {/* Gloss sheen overlay */}
            <div className="card-sheen" />

            {/* Holofoil shine layer - for holo/radiant/rainbow effects */}
            <div className="card-shine" />

            {/* Holofoil glare layer - follows pointer */}
            <div className="card-glare" />
          </div>
        </div>}

        {/* Back of card - shown as static (no flip) when showBackOnly, otherwise normal */}
        <div className={`card-back w-full h-full ${showBackOnly ? 'psa-back-static' : ''}`}>
          <div className="trading-card h-full">
            <div className="card-back-content">
              {/* Pattern overlay - same as front */}
              {cardPattern && (
                <div
                  className="card-back-pattern absolute inset-0"
                  style={{ backgroundImage: `url(${cardPattern})` }}
                />
              )}
              {/* Inset container */}
              <div className="card-back-inset">
                {/* Header */}
                <div className="card-back-header">
                  <div className="header-left">
                    <div
                      className="header-name"
                      style={{ transform: `rotate(${nameTransform.rotation}deg) translate(${nameTransform.x}px, ${nameTransform.y}px)` }}
                    >{run.competitor}</div>
                    <div className="header-time">{run.time}</div>                    
                  </div>
                  <div className="header-right">
                    <div className="header-rank">Rank #{run.rank}</div>
                    <div className="header-date">{formatDate(run.date)}</div>
                  </div>
                </div>
                <div className="header-divider" />

                {/* Stats */}
                <div className="card-back-stats">
                  {run.gapToWR && (
                    <div className="stat-row">
                      <span className="stat-label">Gap to WR</span>
                      <span className="stat-value">+{run.gapToWR}</span>
                    </div>
                  )}

                  {run.gapToNext && run.gapToNext !== '0:00.00' && (
                    <div className="stat-row">
                      <span className="stat-label">Gap to Next</span>
                      <span className="stat-value">+{run.gapToNext}</span>
                    </div>
                  )}

                  {run.numRuns > 1 && (
                    <div className="stat-row">
                      <span className="stat-label">Total Runs</span>
                      <span className="stat-value">{run.numRuns}</span>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Resume</span>
                      <span className="stat-value">{categories.join(', ')}</span>
                    </div>
                  )}

                  {/* Asterisks/Flags */}
                  {asterisksList.length > 0 && (
                    <div className="stat-row flags-row">
                      <span className="stat-label">Asterisks</span>
                      <span className="stat-value flags-value">
                        {asterisksList.map((flag, i) => (
                          <span key={i} className="flag-tag">
                            {flag}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons - inline on mobile, placeholder for portal on desktop */}
                <div
                  className="card-back-links"
                  ref={buttonsPlaceholderRef}
                  style={isMobile ? {} : { visibility: 'hidden', height: '36px' }}
                >
                  {/* On mobile, render actual buttons; on desktop, portal renders them */}
                  {isMobile && (
                    <>
                      {run.youtubeUrl && (
                        <button
                          type="button"
                          className="card-back-link youtube"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(run.youtubeUrl, '_blank', 'noopener,noreferrer')
                          }}
                          style={{ background: variant.colors.stickerPrimary, color: isLightColor(variant.colors.stickerPrimary) ? '#000' : '#fff' }}
                        >
                          Watch Run
                        </button>
                      )}
                      {run.triviaUrl && (
                        <button
                          type="button"
                          className="card-back-link trivia"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(run.triviaUrl, '_blank', 'noopener,noreferrer')
                          }}
                          style={{ background: variant.colors.secondary, color: isLightColor(variant.colors.secondary) ? '#000' : '#fff' }}
                        >
                          Trivia Quiz
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal-based buttons - rendered outside 3D transform context for reliable clicking */}
      {/* Only render for the "main" card, not the duplicate back-face card in PSA cases */}
      {!showBackOnly && (
        <CardBackButtons
          youtubeUrl={run.youtubeUrl}
          triviaUrl={run.triviaUrl}
          onFlipBack={inPSACase && psaCaseState?.handleFlipBack ? psaCaseState.handleFlipBack : handleFlipBack}
          isVisible={effectiveIsFlipped && !effectiveIsFlipping}
          containerRef={buttonsPlaceholderRef}
          cardRef={inPSACase ? psaCaseState?.caseRef : cardContainerRef}
          stickerColor={variant.colors.stickerPrimary}
          cardSecondary={variant.colors.secondary}
          rotation={getCardRotation(run.id)}
          fabOffsetX={inPSACase ? -8 : -32}
          fabOffsetY={inPSACase ? -8 : -56}
          inPSACase={inPSACase}
        />
      )}
    </div>
  )
}
