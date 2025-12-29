/**
 * Parse a time string like "2:11.64" or "1:26.08" to total seconds
 */
export function parseTime(timeStr) {
  if (!timeStr) return Infinity
  // Ensure we have a string
  const str = String(timeStr)
  const parts = str.split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10)
    const seconds = parseFloat(parts[1])
    return minutes * 60 + seconds
  }
  return parseFloat(timeStr)
}

/**
 * Format a date string to a nicer format
 * Handles both ISO format "2024-03-19" (from API) and "11/17/2023" (from old exports)
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''

  let date

  // Check if ISO format (YYYY-MM-DD)
  if (dateStr.includes('-')) {
    date = new Date(`${dateStr}T00:00:00`)
  }
  // Check if US format (MM/DD/YYYY)
  else if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/')
    date = new Date(year, month - 1, day)
  }
  else {
    return dateStr // Return as-is if unknown format
  }

  // Check for invalid date
  if (Number.isNaN(date.getTime())) return dateStr

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Extract the photo URL from Airtable's attachment format
 * Format: "filename.png (https://...)"
 */
export function extractPhotoUrl(picField) {
  if (!picField) return null
  const match = picField.match(/\((https?:\/\/[^)]+)\)/)
  return match ? match[1] : null
}

/**
 * Parse asterisks string into array of flags
 * Format: "☝️ Inagural, 🥇 PR" -> ["☝️ Inagural", "🥇 PR"]
 */
export function parseAsterisks(asterisksStr) {
  if (!asterisksStr) return []
  // Handle arrays (from Airtable linked records) or strings
  if (Array.isArray(asterisksStr)) return asterisksStr
  return String(asterisksStr).split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Parse resumé/category field into array
 * Format: "🅱️ Barstool, 🏈 Football" -> ["🅱️ Barstool", "🏈 Football"]
 */
export function parseResume(resumeStr) {
  if (!resumeStr) return []
  // Handle arrays (from Airtable linked records) or strings
  if (Array.isArray(resumeStr)) return resumeStr
  return String(resumeStr).split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Filter runs based on selected criteria
 */
export function filterRuns(runs, { categories = [], asterisks = [], search = '' }) {
  return runs.filter(run => {
    // Filter by category
    if (categories.length > 0) {
      const runCategories = parseResume(run.resume)
      const hasMatchingCategory = categories.some(cat =>
        runCategories.some(rc => rc.includes(cat))
      )
      if (!hasMatchingCategory) return false
    }

    // Filter by asterisks
    if (asterisks.length > 0) {
      const runAsterisks = parseAsterisks(run.asterisks)
      const hasMatchingAsterisk = asterisks.some(ast =>
        runAsterisks.some(ra => ra.includes(ast))
      )
      if (!hasMatchingAsterisk) return false
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      const nameMatch = run.competitor.toLowerCase().includes(searchLower)
      if (!nameMatch) return false
    }

    return true
  })
}

/**
 * Sort runs by specified field
 */
export function sortRuns(runs, sortBy, sortOrder = 'asc') {
  const sorted = [...runs].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'time':
        comparison = a.timeSeconds - b.timeSeconds
        break
      case 'rank':
        comparison = a.rank - b.rank
        break
      case 'date':
        comparison = new Date(a.date) - new Date(b.date)
        break
      case 'name':
        comparison = a.competitor.localeCompare(b.competitor)
        break
      default:
        comparison = a.rank - b.rank
    }

    return sortOrder === 'desc' ? -comparison : comparison
  })

  return sorted
}

/**
 * Extract first alpha character from a string (skipping emojis)
 */
function getFirstAlphaChar(str) {
  if (!str) return ''
  const match = str.match(/[a-zA-Z]/)
  return match ? match[0].toLowerCase() : str
}

/**
 * Sort by first alpha character (ignoring emoji prefix)
 */
function sortByAlpha(a, b) {
  return getFirstAlphaChar(a).localeCompare(getFirstAlphaChar(b))
}

/**
 * Get unique categories from all runs
 */
export function getUniqueCategories(runs) {
  const categories = new Set()
  runs.forEach(run => {
    parseResume(run.resume).forEach(cat => categories.add(cat))
  })
  return Array.from(categories).sort(sortByAlpha)
}

/**
 * Get unique asterisks from all runs
 */
export function getUniqueAsterisks(runs) {
  const asterisks = new Set()
  for (const run of runs) {
    for (const ast of parseAsterisks(run.asterisks)) {
      asterisks.add(ast)
    }
  }
  return Array.from(asterisks).sort(sortByAlpha)
}

/**
 * Check if a run qualifies for PSA grading case display
 * Criteria: Competitor has multiple runs AND this run has the PR (Personal Record) asterisk
 */
export function shouldShowPSACase(run) {
  // Must have more than one run
  if (!run.numRuns || run.numRuns <= 1) return false

  // Must have the PR asterisk
  const asterisksList = parseAsterisks(run.asterisks)
  const hasPR = asterisksList.some(ast => ast.includes('PR'))

  return hasPR
}
