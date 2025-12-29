/**
 * TimeLabelHotdog - Pill-shaped time label (hotdog style)
 *
 * Features:
 * - Rounded pill/hotdog shape
 * - Configurable fill and stroke colors via palette
 * - Variable font family (matches name label)
 * - Centered horizontally on card
 */
export default function TimeLabelHotdog({
  time,
  fillColor = 'var(--card-primary)',
  textColor = 'var(--card-text)',
  strokeColor = 'black', // Should be white or black
  fontFamily = "'Caprasimo', Georgia, serif",
  className = '',
}) {
  return (
    <div className={`time-label-hotdog ${className}`}>
      <div
        className="hotdog-shape"
        style={{
          background: fillColor,
          borderColor: strokeColor,
          '--hotdog-shadow': strokeColor,
        }}
      >
        <span className="label-text" style={{ fontFamily, fontWeight: 'bold', fontSize: '1.2rem', color: textColor }}>
          {time}
        </span>
      </div>
    </div>
  )
}
