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
 * NameLabelParallelogramPop - Parallelogram name label with drop shadow
 *
 * Features:
 * - Slanted parallelogram shape
 * - Configurable fill, stroke, and shadow colors
 * - Optional icon on the left
 * - Variable font family
 * - Enforces Title Case on names
 */
export default function NameLabelParallelogramPop({
  name,
  fillColor = 'white',
  strokeColor = 'black',
  shadowColor = 'black', // Palette color passed from card variant
  fontFamily = "'Caprasimo', Georgia, serif",
  icon = null,
  className = '',
}) {
  return (
    <div className={`name-label-parallelogram-pop ${className}`}>
      {/* SVG Background Shape */}
      <svg
        className="label-bg"
        viewBox="0 0 280 60"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Back layer - black shadow (offset +8, +8) */}
        <path
          d="M28 8H278L262 58H12L28 8Z"
          fill={strokeColor}
        />
        {/* Middle layer - colored shadow (offset +4, +4) */}
        <path
          d="M24 4H274L258 54H8L24 4Z"
          fill={shadowColor}
        />
        {/* Front layer - white fill with black stroke */}
        <path
          d="M20 1H270L254 51H4L20 1Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
      </svg>

      {/* Content overlay */}
      <div className="label-content">
        {icon && <span className="label-icon">{icon}</span>}
        <span className="label-text" style={{ fontFamily, fontWeight: 'bold' }}>
          {toTitleCase(name)}
        </span>
      </div>
    </div>
  )
}
