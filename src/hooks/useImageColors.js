/**
 * useImageColors Hook
 *
 * Extracts the dominant color from an image and generates a full color palette.
 * Uses Color Thief for color extraction.
 */

import { useState, useEffect } from 'react'
import ColorThief from 'colorthief'
import { generatePalette } from '../utils/colorUtils'

const colorThief = new ColorThief()

/**
 * Hook to extract dominant color from an image and generate a palette
 * @param {string} imageUrl - URL of the image to analyze
 * @param {boolean} enabled - Whether to enable color extraction (default: true)
 * @returns {object} { palette, loading, error }
 */
export function useImageColors(imageUrl, enabled = true) {
  const [palette, setPalette] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!imageUrl || !enabled) {
      setPalette(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    const extractColors = async () => {
      try {
        // Create an image element to load the image
        const img = new Image()
        img.crossOrigin = 'Anonymous'

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = imageUrl
        })

        // Wait for image to be fully loaded
        if (img.complete && img.naturalWidth !== 0) {
          // Extract dominant color
          const dominantColor = colorThief.getColor(img)

          if (isMounted && dominantColor) {
            // Generate full palette from dominant color
            const generatedPalette = generatePalette(dominantColor)
            setPalette(generatedPalette)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setPalette(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    extractColors()

    return () => {
      isMounted = false
    }
  }, [imageUrl, enabled])

  return { palette, loading, error }
}

/**
 * Convert palette object to CSS custom properties
 * @param {object} palette - Palette from generatePalette
 * @returns {object} CSS custom properties object
 */
export function paletteToStyles(palette) {
  if (!palette) return {}

  return {
    '--card-primary': palette.primary,
    '--card-secondary': palette.secondary,
    '--card-border': palette.border,
    '--card-text': palette.text,
    '--card-name-bg': palette.nameBackground,
    '--sticker-primary': palette.stickerPrimary,
    '--sticker-secondary': palette.stickerSecondary,
  }
}
