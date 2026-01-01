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

// Parse the CSV-style Gemini data
function parseGeminiData(raw) {
  const lines = raw.trim().split('\n')
  const header = lines[0].split(',')
  const records = []

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV with potential commas in quoted fields
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

// Normalize date formats for comparison
// Gemini: M.D.YYYY -> MM/DD/YYYY
function normalizeDate(dateStr) {
  if (!dateStr) return null

  // Handle M.D.YYYY format
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.')
    if (parts.length === 3) {
      const [m, d, y] = parts
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`
    }
  }

  // Already in MM/DD/YYYY format
  return dateStr
}

// Normalize time formats
// Convert M:SS.ss or ~M:SS.ss to seconds for comparison
function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === 'DNF') return null

  // Remove ~ prefix if present
  const cleaned = timeStr.replace('~', '').trim()

  // Parse M:SS.ss format
  const match = cleaned.match(/^(\d+):(\d+)\.?(\d*)$/)
  if (match) {
    const mins = parseInt(match[1], 10)
    const secs = parseInt(match[2], 10)
    const ms = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2), 10) : 0
    return mins * 60 + secs + ms / 100
  }
  return null
}

// Search quizzes for a question
function searchQuizzes(query) {
  if (!query || query.trim().length < 3) return []

  const queryLower = query.toLowerCase()
  const matches = []

  for (const quiz of quizData) {
    let quizMatches = false

    // Search in quiz name
    if (quiz.name && quiz.name.toLowerCase().includes(queryLower)) {
      quizMatches = true
    }

    // Search in questions
    for (let i = 0; i < (quiz.questions || []).length; i++) {
      const q = quiz.questions[i]
      const questionText = q.question || ''
      const answers = q.answers || []
      const answersText = answers.join(', ')

      if (questionText.toLowerCase().includes(queryLower) ||
          answersText.toLowerCase().includes(queryLower)) {
        quizMatches = true
        break
      }
    }

    if (quizMatches) {
      matches.push({
        name: quiz.name,
        url: quiz.url,
        questionCount: quiz.numberOfQuestions
      })
    }
  }

  return matches.slice(0, 5) // Return top 5 matches
}

// Find existing record in leaderboard
function findExistingRecord(geminiRecord, leaderboard) {
  const geminiDate = normalizeDate(geminiRecord.date)
  const geminiTime = timeToSeconds(geminiRecord.finalTime)
  const geminiCompetitor = geminiRecord.competitor.toLowerCase()

  for (const record of leaderboard) {
    const recordDate = record.Date
    const recordTime = timeToSeconds(record.Time)
    const recordCompetitor = (record.Competitor || '').toLowerCase()

    // Match by competitor name (fuzzy)
    const nameMatch = recordCompetitor.includes(geminiCompetitor) ||
                      geminiCompetitor.includes(recordCompetitor) ||
                      recordCompetitor.split(' ')[0] === geminiCompetitor.split(' ')[0]

    if (!nameMatch) continue

    // Match by date
    const dateMatch = geminiDate === recordDate

    // Match by time (within 1 second tolerance)
    const timeMatch = geminiTime && recordTime && Math.abs(geminiTime - recordTime) < 1

    if (dateMatch && timeMatch) {
      return record
    }

    // Looser match: same competitor and very close time
    if (nameMatch && timeMatch) {
      return record
    }
  }

  return null
}

// Main execution
const geminiRecords = parseGeminiData(geminiRaw)

const existing = []
const newRecords = []
const dnfRecords = []
const uncertain = []

for (const record of geminiRecords) {
  if (record.finalTime === 'DNF') {
    dnfRecords.push(record)
    continue
  }

  const match = findExistingRecord(record, leaderboard)

  if (match) {
    existing.push({ gemini: record, airtable: match })
  } else {
    // Try to find quiz matches
    const q1Matches = searchQuizzes(record.question1)
    const q2Matches = searchQuizzes(record.question2)

    newRecords.push({
      ...record,
      quizMatches: {
        question1: q1Matches,
        question2: q2Matches
      }
    })
  }
}

// Generate report
console.log('# Gemini Data Reconciliation Report\n')
console.log(`Generated: ${new Date().toISOString()}\n`)

console.log('## Summary')
console.log(`- Total Gemini Records: ${geminiRecords.length}`)
console.log(`- Already in Airtable: ${existing.length}`)
console.log(`- New (need to add): ${newRecords.length}`)
console.log(`- DNF Records: ${dnfRecords.length}`)
console.log('')

console.log('---\n')

console.log('## Records Already in Airtable\n')
if (existing.length === 0) {
  console.log('*None found*\n')
} else {
  console.log('| # | Competitor | Date | Time | Airtable Match |')
  console.log('|---|------------|------|------|----------------|')
  existing.forEach((e, i) => {
    console.log(`| ${i+1} | ${e.gemini.competitor} | ${e.gemini.date} | ${e.gemini.finalTime} | ${e.airtable.Competitor} (${e.airtable.Time}) |`)
  })
  console.log('')
}

console.log('---\n')

console.log('## NEW Records to Add\n')
if (newRecords.length === 0) {
  console.log('*None*\n')
} else {
  newRecords.forEach((r, i) => {
    console.log(`### ${i+1}. ${r.competitor}`)
    console.log(`- **Date**: ${r.date}`)
    console.log(`- **Time**: ${r.finalTime}`)
    console.log(`- **Q1**: ${r.question1}`)
    console.log(`- **Q2**: ${r.question2}`)
    console.log(`- **Video Timestamps**: ${r.videoStart} - ${r.videoEnd}`)

    if (r.quizMatches.question1.length > 0 || r.quizMatches.question2.length > 0) {
      console.log(`- **Potential Quiz Matches**:`)
      if (r.quizMatches.question1.length > 0) {
        console.log(`  - Q1 matches: ${r.quizMatches.question1.map(q => q.name).join(', ')}`)
      }
      if (r.quizMatches.question2.length > 0) {
        console.log(`  - Q2 matches: ${r.quizMatches.question2.map(q => q.name).join(', ')}`)
      }
    }
    console.log('')
  })
}

console.log('---\n')

console.log('## DNF Records\n')
if (dnfRecords.length === 0) {
  console.log('*None*\n')
} else {
  dnfRecords.forEach((r, i) => {
    console.log(`${i+1}. **${r.competitor}** - ${r.date}`)
    console.log(`   - Q1: ${r.question1}`)
    console.log(`   - Q2: ${r.question2}`)
  })
}
