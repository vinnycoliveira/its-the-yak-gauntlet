/**
 * TimeLabelRibbonPop - Ribbon time label with arrow notch and drop shadow
 *
 * Features:
 * - Rectangle with arrow notch on LEFT side (mirrors NameLabelRibbonPop)
 * - Configurable fill, stroke, and shadow colors
 * - Variable font family (matches name label)
 * - Optional rank display
 */
export default function TimeLabelRibbonPop({
  time,
  rank = null,
  fillColor = 'white', // Palette color passed from card variant
  textColor = 'black',
  strokeColor = 'black',
  shadowColor = 'black',
  fontFamily = "'Caprasimo', Georgia, serif",
  className = '',
}) {
  return (
    <div className={`time-label-ribbon-pop ${className}`}>
      {/* SVG Background Shape - rectangle with arrow notch on left */}
      <svg
        className="label-bg"
        viewBox="0 0 257 56"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Shadow layer (offset +4, +4) */}
        <path
          d="M7 6H255V56H7L15 31L7 6Z"
          fill={shadowColor}
        />
        {/* Main shape with stroke */}
        <path
          d="M3 2H251V52H3L11 27L3 2Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
      </svg>

      {/* Content overlay */}
      <div className="label-content">
        <span className="label-text" style={{ fontFamily, fontWeight: 'bold', color: textColor }}>
          {time}
        </span>
        {rank && <span className="label-rank">#{rank}</span>}
      </div>
    </div>
  )
}
