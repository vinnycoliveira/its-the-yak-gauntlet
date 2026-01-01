import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the data files
const geminiRaw = fs.readFileSync(path.join(__dirname, '../src/data/geminiExtraction.json'), 'utf-8')
const leaderboardRaw = fs.readFileSync(path.join(__dirname, '../src/data/leaderboard.json'), 'utf-8')
const quizDataRaw = fs.readFileSync(path.join(__dirname, '../yakle-quizzes-full.json'), 'utf-8')

const leaderboard = JSON.parse(leaderboardRaw)
const quizData = JSON.parse(quizDataRaw)

// Records that are CONFIRMED already in Airtable (exact matches only)
const confirmedExisting = [
  { competitor: 'Belal Muhammad', date: '2.11.2025' },
  { competitor: 'Ari Shaffir', date: '2.12.2025' },
  { competitor: 'Danny Conrad', date: '3.11.2025' },
  { competitor: 'Calvin Faucher', date: '6.9.2025' },
]

// Parse CSV
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseGeminiData(raw) {
  const lines = raw.trim().split('\n')
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    if (row.length >= 7) {
      records.push({
        videoStart: row[0],
        videoEnd: row[1],
        date: row[2],
        competitor: row[3],
        finalTime: row[4],
        question1: row[5],
        question2: row[6]
      })
    }
  }
  return records
}

// Convert Gemini date (M.D.YYYY) to Airtable format (MM/DD/YYYY)
function formatDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('.')
  if (parts.length === 3) {
    const [m, d, y] = parts
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`
  }
  return dateStr
}

// Convert time string to clean format
function formatTime(timeStr) {
  if (!timeStr || timeStr === 'DNF') return timeStr
  // Remove ~ prefix
  return timeStr.replace('~', '').trim()
}

// Check if record is confirmed existing
function isConfirmedExisting(record) {
  return confirmedExisting.some(e =>
    e.competitor.toLowerCase() === record.competitor.toLowerCase() &&
    e.date === record.date
  )
}

// Search quizzes for matching URL
function findQuizUrl(question1, question2) {
  const searchTerms = [question1, question2].filter(q => q && q.length > 5)

  for (const term of searchTerms) {
    const termLower = term.toLowerCase()
    for (const quiz of quizData) {
      // Search in quiz questions
      for (const q of (quiz.questions || [])) {
        const questionText = (q.question || '').toLowerCase()
        const answersText = (q.answers || []).join(' ').toLowerCase()

        if (questionText.includes(termLower) || answersText.includes(termLower)) {
          return { url: quiz.url, name: quiz.name }
        }
      }
    }
  }
  return null
}

// Main
const geminiRecords = parseGeminiData(geminiRaw)
const importRecords = []

for (const record of geminiRecords) {
  // Skip confirmed existing
  if (isConfirmedExisting(record)) {
    continue
  }

  const isDNF = record.finalTime === 'DNF'
  const quizMatch = findQuizUrl(record.question1, record.question2)

  importRecords.push({
    competitor: record.competitor,
    date: formatDate(record.date),
    time: formatTime(record.finalTime),
    isDNF: isDNF,
    asterisks: isDNF ? '🚫 DNF' : '',
    question1: record.question1,
    question2: record.question2,
    videoTimestamps: `${record.videoStart} - ${record.videoEnd}`,
    suggestedQuizUrl: quizMatch?.url || '',
    suggestedQuizName: quizMatch?.name || '',
    notes: record.competitor.includes('Unknown') || record.competitor.includes('Mystery')
      ? 'NEEDS IDENTIFICATION'
      : (record.finalTime.includes('~') ? 'APPROXIMATE TIME' : '')
  })
}

// Output as JSON
const output = {
  generated: new Date().toISOString(),
  totalRecords: importRecords.length,
  records: importRecords
}

console.log(JSON.stringify(output, null, 2))

// Also write to file
fs.writeFileSync(
  path.join(__dirname, '../src/data/pendingImports.json'),
  JSON.stringify(output, null, 2)
)
console.error(`\nWritten to src/data/pendingImports.json`)
