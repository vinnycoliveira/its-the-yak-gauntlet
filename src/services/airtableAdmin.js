// Airtable admin API service for creating/updating records

const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID

const TABLES = {
  LEADERBOARD: 'tblrzmja74UGcnRwH',
  COMPETITORS: 'tblEwY9n69LDGAapi',
  ASTERISKS: 'tbl0hnSCgbiv5wCGR'
}

const headers = {
  'Authorization': `Bearer ${AIRTABLE_PAT}`,
  'Content-Type': 'application/json'
}

/**
 * Fetch all competitors from Airtable
 */
export async function fetchCompetitors() {
  const records = []
  let offset = null

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.COMPETITORS}`)
    url.searchParams.set('fields[]', 'Competitor')
    if (offset) url.searchParams.set('offset', offset)

    const response = await fetch(url, { headers })
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    for (const record of data.records) {
      records.push({
        id: record.id,
        name: record.fields.Competitor || ''
      })
    }

    offset = data.offset
  } while (offset)

  return records.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Fetch all asterisks from Airtable
 */
export async function fetchAsterisks() {
  const records = []
  let offset = null

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.ASTERISKS}`)
    url.searchParams.set('fields[]', 'Flag')
    url.searchParams.set('fields[]', 'Description')
    if (offset) url.searchParams.set('offset', offset)

    const response = await fetch(url, { headers })
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    for (const record of data.records) {
      records.push({
        id: record.id,
        flag: record.fields.Flag || '',
        description: record.fields.Description || ''
      })
    }

    offset = data.offset
  } while (offset)

  return records
}

/**
 * Create a new competitor
 */
export async function createCompetitor(name, resumeItems = []) {
  const fields = {
    'Competitor': name
  }

  // Resume items should be the display names like "🏈 Football"
  if (resumeItems.length > 0) {
    // Map plain names to emoji versions
    const resumeMap = {
      'Barstool': '\u{1F171}\uFE0F Barstool',
      'Comedian': '\u{1F602} Comedian',
      'Entertainer': '\u{1F3AD} Entertainer',
      'Friends & Family': '\u{1F46B} Friends & Family',
      'Intern': '\u{1F3C3} Intern',
      'Musician': '\u{1F3B6} Musician',
      'Stoolie': '\u{1F37B} Stoolie',
      'Basketball': '\u{1F3C0} Basketball',
      'Football': '\u{1F3C8} Football',
      'Fighter': '\u{1F94A} Fighter',
      'Baseball': '\u26BE\uFE0F Baseball',
      'Golf': '\u26F3\uFE0F Golf',
      'Tennis': '\u{1F3BE} Tennis',
      'Lacrosse': '\u{1F94D} Lacrosse',
      'Wrestling': '\u{1F93C} Wrestling',
      'Racing': '\u{1F3C1} Racing',
    }
    fields['Resumé'] = resumeItems.map(r => resumeMap[r] || r)
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.COMPETITORS}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields })
    }
  )

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return {
    id: data.id,
    name: data.fields.Competitor
  }
}

/**
 * Create a new asterisk
 */
export async function createAsterisk(flag, description = '') {
  const fields = {
    'Flag': flag
  }

  if (description) {
    fields['Description'] = description
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.ASTERISKS}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields })
    }
  )

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return {
    id: data.id,
    flag: data.fields.Flag
  }
}

/**
 * Create a new run in the leaderboard
 */
export async function createRun({
  time,
  date,
  youtubeUrl,
  quizUrl,
  competitorId,
  asteriskIds = []
}) {
  const fields = {}

  // Time is stored as duration in seconds
  if (time) {
    fields['Time'] = time
  }

  // Date
  if (date) {
    fields['Date'] = date
  }

  // YouTube URL
  if (youtubeUrl) {
    fields['YouTube URL'] = youtubeUrl
  }

  // Quiz URL
  if (quizUrl) {
    fields['Trivia Quiz URL'] = quizUrl
  }

  // Competitor (linked record)
  if (competitorId) {
    fields['Competitor'] = [competitorId]
  }

  // Asterisks (linked records)
  if (asteriskIds.length > 0) {
    fields['Asterisks'] = asteriskIds
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.LEADERBOARD}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields })
    }
  )

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return {
    id: data.id,
    ...data.fields
  }
}
