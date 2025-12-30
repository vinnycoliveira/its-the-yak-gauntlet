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
 * Fetch the Resume field options from Airtable's schema
 * This ensures we always have the current list of resume types
 */
export async function fetchResumeOptions() {
  const response = await fetch(
    `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
    { headers }
  )

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  // Find the Competitors table
  const competitorsTable = data.tables.find(t => t.id === TABLES.COMPETITORS)
  if (!competitorsTable) {
    throw new Error('Competitors table not found')
  }

  // Find the Resumé field
  const resumeField = competitorsTable.fields.find(f => f.name === 'Resumé')
  if (!resumeField || resumeField.type !== 'multipleSelects') {
    throw new Error('Resumé field not found or not a multiple select')
  }

  // Extract the options with their IDs and names
  return resumeField.options.choices.map(choice => {
    // Parse emoji from the name (format is "emoji Name")
    const match = choice.name.match(/^(.+?)\s+(.+)$/)
    if (match) {
      return {
        id: choice.id,
        emoji: match[1],
        name: match[2],
        fullName: choice.name
      }
    }
    return {
      id: choice.id,
      emoji: '',
      name: choice.name,
      fullName: choice.name
    }
  })
}

/**
 * Fetch all competitors from Airtable
 */
export async function fetchCompetitors() {
  const records = []
  let offset = null

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.COMPETITORS}`)
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
    if (offset) url.searchParams.set('offset', offset)

    const response = await fetch(url, { headers })
    const data = await response.json()

    console.log('Asterisks API response:', data)

    if (data.error) {
      throw new Error(data.error.message)
    }

    for (const record of data.records) {
      console.log('Asterisk record:', record.id, record.fields)
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
 * Upload image to tmpfiles.org (free file hosting with CORS support)
 * Files are stored for 1 hour minimum, which is enough for Airtable to fetch
 */
export async function uploadImage(blob) {
  const formData = new FormData()
  formData.append('file', blob, 'competitor.jpg')

  const response = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData
  })

  const data = await response.json()

  if (data.status !== 'success') {
    console.error('tmpfiles.org upload failed:', data)
    throw new Error(data.message || 'Failed to upload image')
  }

  // tmpfiles returns URL like https://tmpfiles.org/12345/file.jpg
  // We need to convert it to direct link: https://tmpfiles.org/dl/12345/file.jpg
  const url = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
  return url
}

/**
 * Create a new competitor
 * @param {string} name - Competitor name
 * @param {string[]} resumeFullNames - Array of full resume names (e.g., "🏈 Football")
 * @param {string|null} imageUrl - Optional image URL
 */
export async function createCompetitor(name, resumeFullNames = [], imageUrl = null) {
  const fields = {
    'Competitor': name
  }

  // Resume items should be the full display names like "🏈 Football"
  if (resumeFullNames.length > 0) {
    fields['Resumé'] = resumeFullNames
  }

  // Add image as attachment
  if (imageUrl) {
    fields['Pic'] = [{ url: imageUrl }]
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
