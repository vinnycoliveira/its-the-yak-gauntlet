/**
 * Convert string to Title Case
 */
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * NameLabelHotdog - Pill-shaped name label (hotdog style)
 *
 * Features:
 * - Rounded pill/hotdog shape
 * - Configurable fill and stroke colors via palette
 * - Variable font family
 * - Enforces Title Case on names
 * - Centered horizontally on card
 */
export default function NameLabelHotdog({
  name,
  fillColor = 'var(--card-primary)',
  textColor = 'var(--card-text)',
  strokeColor = 'black', // Should be white or black
  fontFamily = "'Caprasimo', Georgia, serif",
  className = '',
}) {
  return (
    <div className={`name-label-hotdog ${className}`}>
      <div
        className="hotdog-shape"
        style={{
          background: fillColor,
          borderColor: strokeColor,
          '--hotdog-shadow': strokeColor,
        }}
      >
        <span className="label-text" style={{ fontFamily, fontWeight: 'bold', color: textColor }}>
          {toTitleCase(name)}
        </span>
      </div>
    </div>
  )
}
