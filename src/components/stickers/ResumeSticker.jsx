import { extractEmoji, getStickerRotation } from '../../utils/stickerRandomizer'

// Background colors per resume category (contrasting with emoji colors)
const RESUME_COLORS = {
  '⚾️': '#5B9BD5', // Baseball (red ball) -> light blue
  '⛳️': '#E88B8B', // Golf (green) -> coral pink
  '🍻': '#5E3D7A', // Stoolie (amber beer) -> deep purple
  '🎭': '#2A9D8F', // Entertainer (purple/gold masks) -> teal
  '🎶': '#1E3A5F', // Musician (orange notes) -> deep navy
  '🎾': '#7B4B94', // Tennis (green/yellow ball) -> purple
  '🏀': '#1B365D', // Basketball (orange) -> navy blue
  '🏁': '#C73E3E', // Racing (black/white flag) -> red
  '🏃': '#4A7C59', // Intern (yellow runner) -> forest green
  '🏈': '#2D5A3D', // Football (brown) -> dark green
  '👫': '#E07A5F', // Friends & Family (yellow/skin) -> coral
  '😂': '#9B2D7B', // Comedian (yellow face) -> magenta
  '🤼': '#C9A227', // Wrestling (blue) -> gold
  '🥊': '#1A6B6B', // Fighter (red gloves) -> dark teal
  '🥍': '#2C3E50', // Lacrosse (white/yellow) -> navy
}

export default function ResumeSticker({ resume, seed }) {
  if (!resume) return null

  const isBarstool = resume?.toLowerCase().includes('barstool')
  const emoji = extractEmoji(resume)
  const rotation = getStickerRotation(seed, 'resume')
  const backgroundColor = RESUME_COLORS[emoji] || '#6B7280' // fallback gray

  return (
    <div
      className={`resume-sticker ${isBarstool ? 'barstool' : ''}`}
      title={resume}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...(!isBarstool && { backgroundColor })
      }}
    >
      {isBarstool ? (
        <img
          src="/barstool-sports-logo.svg"
          alt="Barstool Sports"
          className="barstool-logo"
        />
      ) : (
        emoji
      )}
    </div>
  )
}
