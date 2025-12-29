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
 * NameLabelRibbonPop - Ribbon name label with arrow notch and drop shadow
 *
 * Features:
 * - Rectangle with arrow notch on right side
 * - Configurable fill, stroke, and shadow colors
 * - Optional icon on the left
 * - Variable font family
 * - Enforces Title Case on names
 */
export default function NameLabelRibbonPop({
  name,
  fillColor = 'white', // Palette color passed from card variant
  textColor = 'black',
  strokeColor = 'black',
  shadowColor = 'black',
  fontFamily = "'Caprasimo', Georgia, serif",
  icon = null,
  className = '',
}) {
  return (
    <div className={`name-label-ribbon-pop ${className}`}>
      {/* SVG Background Shape - rectangle with arrow notch on right */}
      <svg
        className="label-bg"
        viewBox="0 0 257 56"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Shadow layer (offset +2, +2) */}
        <path
          d="M2 4H254L246 29L254 54H2V4Z"
          fill={shadowColor}
        />
        {/* Main shape with stroke */}
        <path
          d="M0 2H252L244 27L252 52H0V2Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
      </svg>

      {/* Content overlay */}
      <div className="label-content">
        {icon && <span className="label-icon">{icon}</span>}
        <span className="label-text" style={{ fontFamily, fontWeight: 'bold', color: textColor }}>
          {toTitleCase(name)}
        </span>
      </div>
    </div>
  )
}
