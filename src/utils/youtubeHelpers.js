// YouTube URL parsing and metadata extraction

/**
 * Extract video ID and timecode from a YouTube URL
 */
export function parseYouTubeUrl(url) {
  if (!url) return null

  let videoId = null
  let timecode = null

  try {
    const urlObj = new URL(url)

    // Handle different YouTube URL formats
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v')
      timecode = urlObj.searchParams.get('t')
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1)
      timecode = urlObj.searchParams.get('t')
    }

    // Parse timecode (could be "1m30s" or "90" or "1:30")
    if (timecode) {
      // Already in seconds
      if (/^\d+$/.test(timecode)) {
        timecode = parseInt(timecode)
      }
      // Format like "1m30s"
      else if (/^\d+m\d+s$/.test(timecode)) {
        const match = timecode.match(/(\d+)m(\d+)s/)
        timecode = parseInt(match[1]) * 60 + parseInt(match[2])
      }
    }
  } catch (e) {
    console.error('Failed to parse YouTube URL:', e)
    return null
  }

  return { videoId, timecode }
}

/**
 * Extract info from YouTube URL using oEmbed API (no API key needed)
 */
export async function extractYouTubeInfo(url) {
  const parsed = parseYouTubeUrl(url)
  if (!parsed?.videoId) return null

  try {
    // Use YouTube oEmbed API (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.videoId}&format=json`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      console.warn('oEmbed request failed')
      return { videoId: parsed.videoId, timecode: parsed.timecode }
    }

    const data = await response.json()

    return {
      videoId: parsed.videoId,
      timecode: parsed.timecode,
      title: data.title || null,
      author: data.author_name || null,
      thumbnailUrl: data.thumbnail_url || null,
      // Try to extract date from title if it follows a pattern
      date: extractDateFromTitle(data.title)
    }
  } catch (e) {
    console.error('Failed to fetch YouTube info:', e)
    return { videoId: parsed.videoId, timecode: parsed.timecode }
  }
}

/**
 * Try to extract a date from a video title
 * Common patterns: "The Yak 12/15/24", "Show - December 15, 2024"
 */
function extractDateFromTitle(title) {
  if (!title) return null

  // Pattern: MM/DD/YY or MM/DD/YYYY
  const slashMatch = title.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (slashMatch) {
    let [, month, day, year] = slashMatch
    if (year.length === 2) {
      year = '20' + year
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Pattern: Month DD, YYYY
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
                  'july', 'august', 'september', 'october', 'november', 'december']
  const monthMatch = title.toLowerCase().match(
    new RegExp(`(${months.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`)
  )
  if (monthMatch) {
    const monthNum = months.indexOf(monthMatch[1]) + 1
    const day = monthMatch[2]
    const year = monthMatch[3]
    return `${year}-${String(monthNum).padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

/**
 * Format seconds to MM:SS.SS
 */
export function formatTime(seconds) {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  return `${mins}:${secs.padStart(5, '0')}`
}

/**
 * Parse MM:SS.SS to seconds
 */
export function parseTime(timeStr) {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1])
  }
  return parseFloat(timeStr) || 0
}
