import { getPositionVariant, getStickerRotation } from '../../utils/stickerRandomizer'

// PNG medal images for top 3 positions (2x resolution)
const MEDAL_IMAGES = {
  gold: '/position stickers/position=gold@2x.png',
  silver: '/position stickers/position=silver@2x.png',
  bronze: '/position stickers/position=bronze@2x.png',
}

export default function PositionSticker({ rank, seed, variant: cardVariant, pattern }) {
  const stickerVariant = getPositionVariant(rank, seed)
  const rotation = getStickerRotation(seed, 'position')

  // If card variant specifies a badge style, use it for non-medal ranks
  const badgeStyle = cardVariant?.badgeStyle

  // Pattern overlay style - 40% of card size
  const patternOverlayStyle = pattern ? {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${pattern})`,
    backgroundSize: '40%',
    backgroundPosition: 'center',
    mixBlendMode: 'luminosity',
    opacity: 0.25,
    pointerEvents: 'none',
    borderRadius: 'inherit',
  } : null

  // Medal variants (gold, silver, bronze) for top 3 - use SVG images
  if (['gold', 'silver', 'bronze'].includes(stickerVariant)) {
    return (
      <div className={`position-sticker medal-sticker ${stickerVariant}`} style={{ transform: `rotate(${rotation}deg)` }}>
        <img
          src={MEDAL_IMAGES[stickerVariant]}
          alt={`${stickerVariant} medal - rank ${rank}`}
          className="medal-img"
        />
      </div>
    )
  }

  // Circle badge style (from card variant) - uses complementary sticker colors
  if (badgeStyle === 'circle') {
    return (
      <div className="position-sticker" style={{ background: 'rgba(255, 255, 255, 0.5)', borderRadius: '50%', border: '3px solid var(--sticker-primary)', transform: `rotate(${rotation}deg)`, overflow: 'hidden' }}>
        <div className="badge-inner" style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--sticker-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sticker-text)',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {pattern && <div style={patternOverlayStyle} />}
          <span style={{ position: 'relative', zIndex: 1 }}>
            <sup style={{ fontSize: '0.6em', marginRight: '1px' }}>#</sup>{rank}
          </span>
        </div>
      </div>
    )
  }

  // Square badge style (from card variant) - uses complementary sticker colors
  if (badgeStyle === 'square') {
    return (
      <div className="position-sticker" style={{
        width: '60px',
        height: '60px',
        borderRadius: '8px',
        background: 'var(--sticker-primary)',
        border: '3px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        overflow: 'hidden',
      }}>
        {pattern && <div style={patternOverlayStyle} />}
        <span style={{
          color: 'var(--sticker-text)',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          fontFamily: 'monospace',
          position: 'relative',
          zIndex: 1,
        }}>
          <sup style={{ fontSize: '0.6em', marginRight: '1px' }}>#</sup>{rank}
        </span>
      </div>
    )
  }

  // Regular variants for rank 4+
  return (
    <div className={`position-sticker reg-sticker ${stickerVariant}`} style={{ transform: `rotate(${rotation}deg)`, overflow: 'hidden' }}>
      {pattern && <div style={patternOverlayStyle} />}
      <div className="sticker-content" style={{ position: 'relative', zIndex: 1 }}>
        <span className="reg-number"><sup className="rank-hash">#</sup>{rank}</span>
      </div>
    </div>
  )
}
