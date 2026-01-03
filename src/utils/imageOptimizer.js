/**
 * Image optimization utility using Cloudinary's fetch feature
 *
 * To enable: set VITE_CLOUDINARY_CLOUD_NAME in .env
 * If not set, returns original URLs (no optimization)
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

// Card dimensions (2.5:3.5 aspect ratio)
const CARD_WIDTH = 400
const CARD_HEIGHT = 560

/**
 * Transform an image URL to use Cloudinary's optimization
 *
 * @param {string} originalUrl - The original image URL (e.g., from Airtable)
 * @param {object} options - Optional overrides
 * @returns {string} - Optimized Cloudinary URL, or original if invalid
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
  if (!originalUrl) return originalUrl

  // If no cloud name configured, return original URL
  if (!CLOUD_NAME) return originalUrl

  // Skip if already a Cloudinary URL
  if (originalUrl.includes('cloudinary.com')) return originalUrl

  // Skip data URLs
  if (originalUrl.startsWith('data:')) return originalUrl

  const {
    width = CARD_WIDTH,
    height = CARD_HEIGHT,
    crop = 'fill',      // fill, fit, crop, thumb
    gravity = 'face',   // face detection for better cropping
    quality = 'auto',   // automatic quality optimization
    format = 'auto',    // automatic format (WebP, AVIF when supported)
  } = options

  // Build Cloudinary transformation string
  const transforms = [
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    `g_${gravity}`,
    `q_${quality}`,
    `f_${format}`,
  ].join(',')

  // Encode the source URL
  const encodedUrl = encodeURIComponent(originalUrl)

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transforms}/${encodedUrl}`
}

/**
 * Check if image optimization is enabled
 * @returns {boolean}
 */
export function isOptimizationEnabled() {
  // Always enabled - uses demo cloud as fallback
  return true
}

/**
 * Get optimization status for debugging
 * @returns {object}
 */
export function getOptimizationStatus() {
  return {
    enabled: true,
    cloudName: CLOUD_NAME,
    isDemo: CLOUD_NAME === 'demo',
  }
}
