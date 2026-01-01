const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

async function fetchTable(tableName) {
  const records = []
  let offset = null

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}`)
    if (offset) {
      url.searchParams.set('offset', offset)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    records.push(...data.records)
    offset = data.offset
  } while (offset)

  return records
}

function extractPhotoUrls(picField) {
  if (!picField || !Array.isArray(picField) || picField.length === 0) {
    return []
  }
  // Airtable API returns attachments as array of objects with url property
  // Return all photo URLs, not just the first
  return picField.map((attachment) => attachment.url).filter(Boolean)
}

// Format seconds to "M:SS.ss" time string
function formatTime(seconds) {
  if (!seconds && seconds !== 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${mins}:${secs}`
}

// Format gap in seconds to "+M:SS.ss" string
function formatGap(seconds) {
  if (!seconds && seconds !== 0) return ''
  return formatTime(seconds)
}

// Extract URL from Airtable button/link field
function extractUrl(field) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field.url) return field.url
  return ''
}

export async function fetchLeaderboard() {
  const records = await fetchTable('Leaderboard')
  return records.map((record) => {
    // Get all linked competitor record IDs (supports team runs with multiple competitors)
    const competitorIds = record.fields.Competitor || []
    const competitorRecordIds = Array.isArray(competitorIds) ? competitorIds : []

    return {
      id: record.id,
      // Use 'Competitors' (lookup field with name) if available
      competitor: record.fields.Competitors || '',
      // Store all linked record IDs for team run support
      competitorRecordIds,
      time: formatTime(record.fields.Time),
      date: record.fields.Date || '',
      rank: record.fields.Rank || 999,
      resume: record.fields['Resumé'] || '',
      asterisks: record.fields.Asterisks || '',
      gapToWR: formatGap(record.fields['Gap to WR']),
      gapToNext: formatGap(record.fields['Gap to Next Fastest']),
      worldRecordDuration: record.fields['World Record Duration'] || '',
      youtubeUrl: extractUrl(record.fields['YouTube URL']) || extractUrl(record.fields['YouTube ↗️']),
      triviaUrl: extractUrl(record.fields['Trivia Quiz URL']) || extractUrl(record.fields['Trivia ↗️']),
    }
  })
}

export async function fetchCompetitors() {
  const records = await fetchTable('Competitors')
  const competitorsByName = {}
  const competitorsById = {}

  records.forEach((record) => {
    const name = record.fields.Competitor
    if (name) {
      const competitor = {
        name: name,
        fullName: record.fields['Full Name'] || name,
        photoUrls: extractPhotoUrls(record.fields.Pic),
        numRuns: parseInt(record.fields['Numb. of Runs'], 10) || 1,
        resume: record.fields['Resumé'] || '',
      }
      competitorsByName[name] = competitor
      // Also index by record ID for fallback lookup
      competitorsById[record.id] = competitor
    }
  })

  return { byName: competitorsByName, byId: competitorsById }
}

export async function fetchAsterisks() {
  const records = await fetchTable('Asterisks')
  const asterisksByFlag = {}
  const asterisksById = {}

  records.forEach((record) => {
    const flag = record.fields.Flag
    if (flag) {
      const asterisk = {
        flag: flag,
        description: record.fields.Description || '',
      }
      asterisksByFlag[flag] = asterisk
      // Also index by record ID for resolving linked records
      asterisksById[record.id] = asterisk
    }
  })

  return { byFlag: asterisksByFlag, byId: asterisksById }
}

export async function fetchAllData() {
  const [leaderboard, competitors, asterisks] = await Promise.all([
    fetchLeaderboard(),
    fetchCompetitors(),
    fetchAsterisks(),
  ])

  return { leaderboard, competitors, asterisks }
}
