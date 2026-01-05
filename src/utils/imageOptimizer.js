/**
 * Image optimization using Vercel's built-in image optimization
 *
 * Uses the /_vercel/image endpoint to optimize external images.
 * Falls back to original URLs on localhost (where Vercel endpoint doesn't exist).
 */

// Card dimensions (2.5:3.5 aspect ratio)
const CARD_WIDTH = 400
const CARD_HEIGHT = 560

// Responsive size presets
export const IMAGE_SIZES = {
  mobile: { width: 200 },
  desktop: { width: 400 },
}

/**
 * Check if we're on a Vercel deployment (where image optimization is available)
 */
function isVercelDeployment() {
  if (typeof window === 'undefined') return false
  const { hostname } = window.location
  // Check for Vercel preview/production domains and custom domain
  return (
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.sh') ||
    hostname === 'itstheyakgauntlet.com' ||
    hostname === 'www.itstheyakgauntlet.com'
  )
}

/**
 * Transform an image URL to use Vercel's image optimization
 *
 * @param {string} originalUrl - The original image URL (e.g., from Airtable)
 * @param {object} options - Optional overrides
 * @returns {string} - Optimized Vercel image URL, or original if invalid/localhost
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
  if (!originalUrl) return originalUrl

  // Skip data URLs
  if (originalUrl.startsWith('data:')) return originalUrl

  // Skip optimization for local/relative URLs
  if (!originalUrl.startsWith('http')) return originalUrl

  // Only use Vercel image optimization on Vercel deployments
  if (!isVercelDeployment()) return originalUrl

  const { width = CARD_WIDTH, quality = 75 } = options

  const params = new URLSearchParams({
    url: originalUrl,
    w: width.toString(),
    q: quality.toString(),
  })

  return `/_vercel/image?${params.toString()}`
}

/**
 * Get responsive image URLs for srcset
 *
 * @param {string} originalUrl - The original image URL
 * @returns {object} - { src, srcSet, sizes } for img element
 */
export function getResponsiveImageUrls(originalUrl) {
  if (!originalUrl || originalUrl.startsWith('data:') || !originalUrl.startsWith('http')) {
    return { src: originalUrl, srcSet: null, sizes: null }
  }

  // Only use responsive images on Vercel deployments
  if (!isVercelDeployment()) {
    return { src: originalUrl, srcSet: null, sizes: null }
  }

  const mobileSrc = getOptimizedImageUrl(originalUrl, IMAGE_SIZES.mobile)
  const desktopSrc = getOptimizedImageUrl(originalUrl, IMAGE_SIZES.desktop)

  return {
    src: desktopSrc,
    srcSet: `${mobileSrc} 200w, ${desktopSrc} 400w`,
    sizes: '(max-width: 768px) 200px, 400px',
  }
}

/**
 * Check if image optimization is enabled
 * @returns {boolean}
 */
export function isOptimizationEnabled() {
  // Vercel image optimization is always available on deployed sites
  return true
}

/**
 * Get optimization status for debugging
 * @returns {object}
 */
export function getOptimizationStatus() {
  return {
    enabled: true,
    provider: 'vercel',
    note: 'Only works on deployed Vercel sites, not localhost',
  }
}
